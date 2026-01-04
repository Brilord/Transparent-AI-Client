const canvas = document.getElementById('layoutCanvas');
const emptyState = document.getElementById('layoutEmpty');
const windowListEl = document.getElementById('windowList');
const focusedWindowEl = document.getElementById('focusedWindow');
const displayCountEl = document.getElementById('displayCount');
const windowCountEl = document.getElementById('windowCount');
const layoutTitleEl = document.getElementById('layoutTitle');
const layoutSubtitleEl = document.getElementById('layoutSubtitle');
const layoutFocusedTitleEl = document.getElementById('layoutFocusedTitle');
const layoutOpenWindowsTitleEl = document.getElementById('layoutOpenWindowsTitle');
const layoutLegendTitleEl = document.getElementById('layoutLegendTitle');
const legendMainEl = document.getElementById('legendMain');
const legendLinkEl = document.getElementById('legendLink');
const legendChatEl = document.getElementById('legendChat');
const legendLayoutEl = document.getElementById('legendLayout');

const TYPE_COLORS = {
  main: '#4fd1c5',
  link: '#60a5fa',
  chat: '#fbbf24',
  layout: '#a78bfa',
  perf: '#f472b6',
  other: '#94a3b8'
};

const DEFAULT_LANGUAGE = 'en';
const LOCALE_FALLBACK = {
  'layout.title': 'Window layout',
  'layout.subtitle': 'Live map of open windows and focus',
  'layout.focusedTitle': 'Focused window',
  'layout.openWindowsTitle': 'Open windows',
  'layout.legendTitle': 'Legend',
  'layout.legendMain': 'Main',
  'layout.legendLink': 'Link',
  'layout.legendChat': 'Chat',
  'layout.legendLayout': 'Layout',
  'layout.displayCount': '{count} display{plural}',
  'layout.windowCount': '{count} window{plural}',
  'layout.focusNone': 'None',
  'layout.noWindows': 'No open windows.',
  'layout.empty': 'No open windows to display.',
  'layout.unknown': 'unknown',
  'layout.displayLabel': 'Display {index}',
  'layout.type.main': 'Main',
  'layout.type.link': 'Link',
  'layout.type.chat': 'Chat',
  'layout.type.layout': 'Layout',
  'layout.type.perf': 'Performance',
  'layout.type.other': 'Window'
};

let activeLanguage = DEFAULT_LANGUAGE;
let localeStrings = Object.assign({}, LOCALE_FALLBACK);
let latestSnapshot = null;

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  if (value.length !== 6) return null;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function normalizeLanguage(value) {
  return value === 'ko' ? 'ko' : DEFAULT_LANGUAGE;
}

function formatMessage(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
    return String(vars[key]);
  });
}

function t(key, fallback) {
  return localeStrings[key] || fallback || LOCALE_FALLBACK[key] || key;
}

function getTypeLabel(type) {
  return t(`layout.type.${type}`, type);
}

function applyLocaleStrings() {
  if (layoutTitleEl) layoutTitleEl.textContent = t('layout.title');
  if (layoutSubtitleEl) layoutSubtitleEl.textContent = t('layout.subtitle');
  if (layoutFocusedTitleEl) layoutFocusedTitleEl.textContent = t('layout.focusedTitle');
  if (layoutOpenWindowsTitleEl) layoutOpenWindowsTitleEl.textContent = t('layout.openWindowsTitle');
  if (layoutLegendTitleEl) layoutLegendTitleEl.textContent = t('layout.legendTitle');
  if (legendMainEl) legendMainEl.textContent = t('layout.legendMain');
  if (legendLinkEl) legendLinkEl.textContent = t('layout.legendLink');
  if (legendChatEl) legendChatEl.textContent = t('layout.legendChat');
  if (legendLayoutEl) legendLayoutEl.textContent = t('layout.legendLayout');
  if (emptyState) emptyState.textContent = t('layout.empty');
  if (focusedWindowEl && (!latestSnapshot || !latestSnapshot.focusedWindowId)) {
    focusedWindowEl.textContent = t('layout.focusNone');
  }
}

async function setLanguage(value) {
  activeLanguage = normalizeLanguage(value);
  let nextLocale = Object.assign({}, LOCALE_FALLBACK);
  if (window.layoutAPI && typeof window.layoutAPI.readLocale === 'function') {
    try {
      const data = await window.layoutAPI.readLocale(activeLanguage);
      if (data && typeof data === 'object') {
        nextLocale = Object.assign({}, nextLocale, data);
      }
    } catch (err) {
      // ignore locale load failures
    }
  }
  localeStrings = nextLocale;
  if (document && document.documentElement) {
    document.documentElement.lang = activeLanguage;
  }
  applyLocaleStrings();
  if (latestSnapshot) renderSnapshot(latestSnapshot);
}

function setupCanvas() {
  if (!canvas || !canvas.parentElement) return null;
  const parent = canvas.parentElement;
  const width = Math.max(1, parent.clientWidth);
  const height = Math.max(1, parent.clientHeight);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function getVirtualBounds(displays) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  displays.forEach((display) => {
    const { x, y, width, height } = display.bounds || {};
    if (typeof x !== 'number') return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

function drawDisplays(ctx, displays, scale, offsetX, offsetY) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.font = '12px "IBM Plex Sans", "Segoe UI", sans-serif';
  displays.forEach((display, index) => {
    if (!display || !display.bounds) return;
    const { x, y, width, height } = display.bounds;
    const drawX = offsetX + x * scale;
    const drawY = offsetY + y * scale;
    const drawW = width * scale;
    const drawH = height * scale;
    ctx.fillStyle = 'rgba(15, 20, 28, 0.8)';
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.strokeStyle = '#263142';
    ctx.strokeRect(drawX, drawY, drawW, drawH);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(formatMessage(t('layout.displayLabel'), { index: index + 1 }), drawX + 8, drawY + 18);
  });
  ctx.restore();
}

function drawWindows(ctx, windows, focusedId, scale, offsetX, offsetY) {
  ctx.save();
  ctx.font = '11px "IBM Plex Sans", "Segoe UI", sans-serif';
  windows.forEach((win) => {
    if (!win || !win.bounds) return;
    const { x, y, width, height } = win.bounds;
    const drawX = offsetX + x * scale;
    const drawY = offsetY + y * scale;
    const drawW = Math.max(2, width * scale);
    const drawH = Math.max(2, height * scale);
    const color = TYPE_COLORS[win.type] || TYPE_COLORS.other;
    const isFocused = win.windowId === focusedId;
    const fillAlpha = win.isMinimized ? 0.12 : 0.32;
    ctx.fillStyle = withAlpha(color, fillAlpha);
    ctx.strokeStyle = isFocused ? '#f97316' : color;
    ctx.lineWidth = isFocused ? 2 : 1;
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.strokeRect(drawX, drawY, drawW, drawH);
    if (drawW > 60 && drawH > 18) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(win.label || win.type, drawX + 6, drawY + 14);
    }
  });
  ctx.restore();
}

function formatBounds(bounds) {
  if (!bounds) return t('layout.unknown');
  const { x, y, width, height } = bounds;
  return `${x},${y} ${width}x${height}`;
}

function updateWindowList(windows, focusedId) {
  if (!windowListEl) return;
  windowListEl.innerHTML = '';
  if (!Array.isArray(windows) || windows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'layout-list-item';
    empty.textContent = t('layout.noWindows');
    windowListEl.appendChild(empty);
    return;
  }
  windows.forEach((win) => {
    const item = document.createElement('div');
    item.className = 'layout-list-item';
    if (win.windowId === focusedId) item.classList.add('focused');

    const title = document.createElement('div');
    title.className = 'layout-list-title';
    title.textContent = win.label || win.type;
    item.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'layout-list-meta';
    meta.textContent = `${getTypeLabel(win.type)} - ${formatBounds(win.bounds)}`;
    item.appendChild(meta);

    if (win.url) {
      const url = document.createElement('div');
      url.className = 'layout-list-meta';
      url.textContent = win.url;
      item.appendChild(url);
    }

    windowListEl.appendChild(item);
  });
}

function updateFocusedLabel(snapshot, windows, focusedId) {
  if (!focusedWindowEl) return;
  if (!focusedId) {
    focusedWindowEl.textContent = t('layout.focusNone');
    return;
  }
  const focused = windows.find((win) => win.windowId === focusedId)
    || (snapshot && snapshot.focusedWindow);
  if (!focused) {
    focusedWindowEl.textContent = t('layout.focusNone');
    return;
  }
  const label = focused.label || focused.type;
  focusedWindowEl.textContent = `${label} (${getTypeLabel(focused.type)})`;
}

function renderSnapshot(snapshot) {
  latestSnapshot = snapshot;
  const displays = snapshot && Array.isArray(snapshot.displays) ? snapshot.displays : [];
  const windows = snapshot && Array.isArray(snapshot.windows) ? snapshot.windows : [];
  const focusedId = snapshot ? snapshot.focusedWindowId : null;
  if (displayCountEl) {
    displayCountEl.textContent = formatMessage(t('layout.displayCount'), {
      count: displays.length,
      plural: displays.length === 1 ? '' : 's'
    });
  }
  if (windowCountEl) {
    windowCountEl.textContent = formatMessage(t('layout.windowCount'), {
      count: windows.length,
      plural: windows.length === 1 ? '' : 's'
    });
  }
  updateWindowList(windows, focusedId);
  updateFocusedLabel(snapshot, windows, focusedId);

  if (emptyState) {
    emptyState.style.display = windows.length === 0 ? 'flex' : 'none';
  }

  const canvasInfo = setupCanvas();
  if (!canvasInfo) return;
  const { ctx, width, height } = canvasInfo;
  ctx.clearRect(0, 0, width, height);
  if (!displays.length) return;

  const bounds = getVirtualBounds(displays);
  const padding = 24;
  const scale = Math.min(
    (width - padding * 2) / bounds.width,
    (height - padding * 2) / bounds.height
  );
  const offsetX = padding + (width - padding * 2 - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (height - padding * 2 - bounds.height * scale) / 2 - bounds.minY * scale;
  drawDisplays(ctx, displays, scale, offsetX, offsetY);
  drawWindows(ctx, windows, focusedId, scale, offsetX, offsetY);
}

function requestSnapshot() {
  if (!window.layoutAPI || typeof window.layoutAPI.requestLayoutSnapshot !== 'function') {
    renderSnapshot({ displays: [], windows: [] });
    return;
  }
  window.layoutAPI.requestLayoutSnapshot().then((snapshot) => {
    renderSnapshot(snapshot || { displays: [], windows: [] });
  }).catch(() => {
    renderSnapshot({ displays: [], windows: [] });
  });
}

const LIVE_POLL_MS = 250;
let pollTimer = null;

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    requestSnapshot();
  }, LIVE_POLL_MS);
}

function stopPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

async function initLocale() {
  let lang = DEFAULT_LANGUAGE;
  if (window.layoutAPI && typeof window.layoutAPI.getSetting === 'function') {
    try {
      lang = await window.layoutAPI.getSetting('language');
    } catch (err) {
      lang = DEFAULT_LANGUAGE;
    }
  }
  await setLanguage(lang);
  if (window.layoutAPI && typeof window.layoutAPI.onSettingChanged === 'function') {
    window.layoutAPI.onSettingChanged((key, value) => {
      if (key === 'language') setLanguage(value);
    });
  }
}

if (window.layoutAPI && typeof window.layoutAPI.onLayoutSnapshot === 'function') {
  window.layoutAPI.onLayoutSnapshot((snapshot) => {
    renderSnapshot(snapshot || { displays: [], windows: [] });
  });
}

window.addEventListener('resize', () => {
  if (latestSnapshot) renderSnapshot(latestSnapshot);
});

window.addEventListener('beforeunload', () => {
  stopPolling();
});

initLocale().finally(() => {
  requestSnapshot();
  startPolling();
});
