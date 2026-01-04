const { app, BrowserWindow, Menu, ipcMain, screen, dialog, shell, clipboard, crashReporter } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const PERF_BENCH = process.env.PERF_BENCH === '1';
const perfStart = PERF_BENCH ? process.hrtime.bigint() : null;
const perfSessionStart = process.hrtime.bigint();
const perfSessionStartWall = Date.now();
const perfEvents = [];
let perfWindow = null;
let perfStatsTimer = null;
let perfCpuLast = null;
let perfCpuLastAt = null;

function logPerf(label, startNs = perfStart) {
  if (!PERF_BENCH || !startNs) return;
  const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
  console.log(`[perf] ${label}: ${elapsedMs.toFixed(2)} ms`);
}

function perfElapsedMs() {
  return Number(process.hrtime.bigint() - perfSessionStart) / 1e6;
}

function summarizeUrl(rawUrl) {
  if (!rawUrl) return 'unknown';
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname || 'unknown';
  } catch (err) {
    return 'unknown';
  }
}

function pushPerfEvent(label, payload = null, source = 'main') {
  const entry = {
    id: `perf-${Date.now()}-${perfEvents.length + 1}`,
    ts: new Date().toISOString(),
    label,
    elapsedMs: Number(perfElapsedMs().toFixed(2)),
    source,
    payload
  };
  perfEvents.push(entry);
  if (perfEvents.length > 500) perfEvents.shift();
  if (perfWindow && !perfWindow.isDestroyed()) {
    try { perfWindow.webContents.send('perf-event', entry); } catch (err) {}
  }
}

function startPerfStatsTimer() {
  if (perfStatsTimer) return;
  perfCpuLast = null;
  perfCpuLastAt = null;
  perfStatsTimer = setInterval(async () => {
    if (!perfWindow || perfWindow.isDestroyed()) return;
    const now = Date.now();
    const cpuUsage = process.getCPUUsage();
    let cpuPercent = null;
    if (perfCpuLast && perfCpuLastAt) {
      const userDiff = cpuUsage.user - perfCpuLast.user;
      const sysDiff = cpuUsage.system - perfCpuLast.system;
      const elapsedMicros = Math.max(1, (now - perfCpuLastAt) * 1000);
      cpuPercent = ((userDiff + sysDiff) / elapsedMicros) * 100;
    }
    perfCpuLast = cpuUsage;
    perfCpuLastAt = now;

    let memInfo = null;
    try {
      memInfo = process.memoryUsage();
    } catch (err) {}

    const stats = {
      ts: new Date().toISOString(),
      uptimeMs: now - perfSessionStartWall,
      cpuPercent: cpuPercent === null ? null : Number(cpuPercent.toFixed(1)),
      rssMB: memInfo ? Number((memInfo.rss / 1024 / 1024).toFixed(1)) : null,
      heapUsedMB: memInfo ? Number((memInfo.heapUsed / 1024 / 1024).toFixed(1)) : null,
      events: perfEvents.length
    };
    try { perfWindow.webContents.send('perf-stats', stats); } catch (err) {}
  }, 1000);
}

function stopPerfStatsTimer() {
  if (!perfStatsTimer) return;
  clearInterval(perfStatsTimer);
  perfStatsTimer = null;
}

function openPerfWindow() {
  if (perfWindow && !perfWindow.isDestroyed()) {
    try { perfWindow.focus(); } catch (err) {}
    return;
  }
  perfWindow = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 420,
    minHeight: 520,
    transparent: false,
    frame: true,
    backgroundColor: '#0f1216',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-perf.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  perfWindow.loadFile('perf.html');
  perfWindow.on('closed', () => {
    perfWindow = null;
    stopPerfStatsTimer();
  });
  trackWindowForLayout(perfWindow);
  scheduleLayoutSnapshot();
  startPerfStatsTimer();
}

function closePerfWindow() {
  if (!perfWindow || perfWindow.isDestroyed()) return;
  try { perfWindow.close(); } catch (err) {}
}

let mainWindow;
let chatWindow;
let layoutWindow;
let focusedWindowInfo = null;
let layoutSnapshotTimer = null;
let appOpacity = 1.0; // global app opacity applied to all windows
const linkWindows = new Set();
const linkWindowMeta = new Map(); // track metadata for open link windows
const defaultDataFile = path.join(app.getPath('userData'), 'links.json');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');
const MIN_LINK_WINDOW_OPACITY = 0.68; // keep remote link text readable even when slider hits 0%
const DEFAULT_MAIN_WINDOW_WIDTH = 600;
const DEFAULT_MAIN_WINDOW_HEIGHT = 800;
const TELEMETRY_SUBMIT_URL = 'https://telemetry.invalid/crash';
const METADATA_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 6;
const HEALTH_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 12;
const METADATA_POLL_INTERVAL_MS = 7000;
const HEALTH_POLL_INTERVAL_MS = 12000;
const METADATA_BACKOFF_BASE_MS = 1000 * 30;
const METADATA_BACKOFF_MAX_MS = 1000 * 60 * 30;
const HEALTH_BACKOFF_BASE_MS = 1000 * 60;
const HEALTH_BACKOFF_MAX_MS = 1000 * 60 * 60;
const MAX_METADATA_BYTES = 512 * 1024;
const HTTP_TIMEOUT_MS = 12000;
const DEFAULT_PRIORITY = 'normal';
const ALLOWED_PRIORITIES = new Set(['low', 'normal', 'high']);
const LINK_SESSION_MODES = new Set(['shared', 'per-link', 'incognito']);
const SUPPORTED_LANGUAGES = new Set(['en', 'ko']);
const SAFE_LINK_SCHEMES = new Set(['http:', 'https:']);
const LINK_WINDOW_CSP = "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; object-src 'none'; base-uri 'self'";

const metadataQueue = [];
const metadataPending = new Set();
const metadataProcessing = new Set();
const healthQueue = [];
const healthPending = new Set();
const healthProcessing = new Set();
let metadataTimer = null;
let healthTimer = null;
const metadataRetryTimers = new Map();
const healthRetryTimers = new Map();
const linkWindowCspSessions = new Map();

let crashReporterInitialized = false;
let dataCollectionSeq = 0;
let autoUpdater = null;

try {
  ({ autoUpdater } = require('electron-updater'));
} catch (err) {
  autoUpdater = null;
}

function getWindowDescriptor(win) {
  if (!win || win.isDestroyed()) return null;
  if (win === mainWindow) return { type: 'main', label: 'Main window' };
  if (win === chatWindow) return { type: 'chat', label: 'Chat window' };
  if (win === layoutWindow) return { type: 'layout', label: 'Layout map' };
  if (win === perfWindow) return { type: 'perf', label: 'Performance monitor' };
  const meta = linkWindowMeta.get(win);
  if (meta && meta.url) {
    return { type: 'link', id: meta.id || null, url: meta.url, label: summarizeUrl(meta.url) };
  }
  return { type: 'other', label: 'Window' };
}

function getWindowSnapshot(win) {
  const descriptor = getWindowDescriptor(win);
  if (!descriptor) return null;
  let bounds = null;
  let displayId = null;
  try { bounds = win.getBounds(); } catch (err) {}
  if (bounds) {
    try {
      const display = screen.getDisplayMatching(bounds);
      if (display && typeof display.id !== 'undefined') displayId = display.id;
    } catch (err) {}
  }
  let isMinimized = false;
  let isMaximized = false;
  try { isMinimized = typeof win.isMinimized === 'function' ? win.isMinimized() : false; } catch (err) {}
  try { isMaximized = typeof win.isMaximized === 'function' ? win.isMaximized() : false; } catch (err) {}
  return {
    windowId: win.id,
    type: descriptor.type,
    label: descriptor.label,
    id: descriptor.id || null,
    url: descriptor.url || null,
    bounds: bounds || null,
    displayId,
    isMinimized,
    isMaximized
  };
}

function getDisplaySnapshots() {
  try {
    return screen.getAllDisplays().map((display) => ({
      id: display.id,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor
    }));
  } catch (err) {
    return [];
  }
}

function buildWindowLayoutSnapshot() {
  const windows = [];
  const pushWindow = (win) => {
    const snapshot = getWindowSnapshot(win);
    if (snapshot) windows.push(snapshot);
  };
  if (mainWindow && !mainWindow.isDestroyed()) pushWindow(mainWindow);
  if (chatWindow && !chatWindow.isDestroyed()) pushWindow(chatWindow);
  if (layoutWindow && !layoutWindow.isDestroyed()) pushWindow(layoutWindow);
  if (perfWindow && !perfWindow.isDestroyed()) pushWindow(perfWindow);
  for (const win of linkWindows) {
    if (win && !win.isDestroyed()) pushWindow(win);
  }
  return {
    ts: new Date().toISOString(),
    displays: getDisplaySnapshots(),
    windows,
    focusedWindowId: focusedWindowInfo ? focusedWindowInfo.windowId : null,
    focusedWindow: focusedWindowInfo
  };
}

function sendLayoutSnapshot(targetWindow = layoutWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  const payload = buildWindowLayoutSnapshot();
  try { targetWindow.webContents.send('window-layout-snapshot', payload); } catch (err) {}
}

function scheduleLayoutSnapshot() {
  if (!layoutWindow || layoutWindow.isDestroyed()) return;
  if (layoutSnapshotTimer) return;
  layoutSnapshotTimer = setTimeout(() => {
    layoutSnapshotTimer = null;
    sendLayoutSnapshot(layoutWindow);
  }, 80);
}

function broadcastFocusedWindowChanged() {
  const payload = focusedWindowInfo;
  const targets = [mainWindow, chatWindow, layoutWindow, perfWindow]
    .filter((win) => win && !win.isDestroyed());
  targets.forEach((win) => {
    try { win.webContents.send('focused-window-changed', payload); } catch (err) {}
  });
  scheduleLayoutSnapshot();
}

function setFocusedWindow(win) {
  const nextSnapshot = win ? getWindowSnapshot(win) : null;
  const nextId = nextSnapshot ? nextSnapshot.windowId : null;
  const prevId = focusedWindowInfo ? focusedWindowInfo.windowId : null;
  focusedWindowInfo = nextSnapshot;
  if (nextId !== prevId) {
    broadcastFocusedWindowChanged();
  }
}

function trackWindowForLayout(win) {
  if (!win) return;
  const schedule = () => scheduleLayoutSnapshot();
  win.on('move', schedule);
  win.on('resize', schedule);
  win.on('show', schedule);
  win.on('hide', schedule);
  win.on('minimize', schedule);
  win.on('restore', schedule);
  win.on('maximize', schedule);
  win.on('unmaximize', schedule);
  win.on('closed', () => {
    scheduleLayoutSnapshot();
    if (focusedWindowInfo && focusedWindowInfo.windowId === win.id) {
      focusedWindowInfo = null;
      broadcastFocusedWindowChanged();
    }
  });
}

function shouldLogDataCollection() {
  return !!(appSettings && appSettings.telemetryEnabled);
}

function nextDataCollectionId() {
  dataCollectionSeq += 1;
  return `dc-${Date.now()}-${dataCollectionSeq}`;
}

function sanitizeHeaders(headers = {}) {
  const sanitized = {};
  const blocked = new Set(['authorization', 'cookie', 'set-cookie', 'proxy-authorization']);
  Object.entries(headers || {}).forEach(([key, value]) => {
    if (!key) return;
    if (blocked.has(String(key).toLowerCase())) return;
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) sanitized[key] = value.join('; ');
    else sanitized[key] = String(value);
  });
  return sanitized;
}

function emitDataCollectionEvent(kind, payload = {}) {
  const entry = Object.assign({
    id: nextDataCollectionId(),
    ts: new Date().toISOString(),
    kind
  }, payload);
  BrowserWindow.getAllWindows().forEach((w) => {
    try { w.webContents.send('data-collection-event', entry); } catch (err) {}
  });
}

function emitTelemetryStateSnapshot(source = 'init', enabledOverride) {
  const enabled = typeof enabledOverride === 'boolean'
    ? enabledOverride
    : !!(appSettings && appSettings.telemetryEnabled);
  emitDataCollectionEvent('telemetry-state', {
    source,
    enabled,
    submitURL: TELEMETRY_SUBMIT_URL,
    config: {
      productName: 'Transparent AI Client',
      companyName: 'Transparent AI Client',
      compress: true,
      uploadToServer: enabled
    },
    note: 'No extra app payload attached.'
  });
}

function applyTelemetryState(enabled) {
  if (!crashReporter || typeof crashReporter.start !== 'function') return;
  const uploadEnabled = !!enabled;
  try {
    if (!crashReporterInitialized) {
      crashReporter.start({
        productName: 'Transparent AI Client',
        companyName: 'Transparent AI Client',
        submitURL: TELEMETRY_SUBMIT_URL,
        uploadToServer: uploadEnabled,
        compress: true
      });
      crashReporterInitialized = true;
    } else if (typeof crashReporter.setUploadToServer === 'function') {
      crashReporter.setUploadToServer(uploadEnabled);
    }
  } catch (err) {
    console.error('Crash reporter error:', err);
  }
  try { emitTelemetryStateSnapshot('apply', uploadEnabled); } catch (err) {}
}

function normalizeTags(input) {
  if (input === undefined || input === null) return [];
  let source = [];
  if (Array.isArray(input)) {
    source = input;
  } else if (typeof input === 'string') {
    source = input.split(',');
  } else {
    return [];
  }
  const seen = new Set();
  const cleaned = [];
  for (const raw of source) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned;
}

function getLinkWindowOpacity(baseOpacity) {
  if (appSettings && appSettings.nativeTransparency) return 1;
  let normalized = typeof baseOpacity === 'number' ? baseOpacity : parseFloat(baseOpacity);
  if (isNaN(normalized)) normalized = 1;
  normalized = Math.max(0, Math.min(1, normalized));
  const eased = MIN_LINK_WINDOW_OPACITY + (1 - MIN_LINK_WINDOW_OPACITY) * Math.pow(normalized, 0.85);
  return Math.max(MIN_LINK_WINDOW_OPACITY, Math.min(1, Number(eased.toFixed(3))));
}

function applyOpacityToLinkWindows() {
  const effective = getLinkWindowOpacity(appOpacity);
  for (const win of linkWindows) {
    try {
      if (win && !win.isDestroyed() && typeof win.setOpacity === 'function') {
        win.setOpacity(effective);
      }
    } catch (err) {
      // ignore per-window failures
    }
  }
}

// Default app settings
const DEFAULT_SETTINGS = {
  appDisplayName: 'Transparent AI Client',
  appOpacity: 1.0,
  alwaysOnTop: false,
  nativeTransparency: false,
  injectResizers: true,
  linkSessionMode: 'shared',
  language: 'en',
  persistSettings: true,
  customDataFile: null,
  backgroundImagePath: null,
  // Folder sync settings
  useFolderSync: false,
  syncFolder: null,
  // Telemetry opt-in
  telemetryEnabled: false,
  // Developer tools
  developerMode: false,
  // Launch behavior
  launchOnStartup: false,
  // Last opened links (to restore on next launch)
  lastOpenedLinks: [],
  // Quick filter preferences
  pinnedTags: [],
  groupingPreference: 'none',
  // Saved workspace layouts
  workspaces: [],
  // Self chat notes
  selfChatNotes: [],
  selfChatRoomsV2: null
};

let appSettings = Object.assign({}, DEFAULT_SETTINGS);

function getDataFilePath() {
  try {
    const customPath = appSettings && typeof appSettings.customDataFile === 'string'
      ? appSettings.customDataFile.trim()
      : '';
    if (customPath) return customPath;
  } catch (err) {}
  return defaultDataFile;
}

function ensureLinksFileExists(targetPath = getDataFilePath()) {
  try {
    if (!targetPath) return;
    const dir = path.dirname(targetPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Error ensuring links file exists:', err);
    throw err;
  }
}

// Folder sync watcher state
let syncWatcher = null;
let lastSyncUpdatedAt = 0;

function createEmptyMetadata() {
  return {
    title: null,
    description: null,
    favicon: null,
    dominantColor: null,
    siteName: null,
    previewImage: null,
    sourceUrl: null,
    lastFetchedAt: null,
    error: null,
    retryCount: 0,
    nextRetryAt: null
  };
}

function createEmptyHealth() {
  return {
    status: 'unknown',
    statusCode: null,
    redirected: false,
    checkedAt: null,
    latency: null,
    error: null,
    retryCount: 0,
    nextRetryAt: null
  };
}

function sanitizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizePriority(value) {
  const normalized = String(value || '').toLowerCase();
  return ALLOWED_PRIORITIES.has(normalized) ? normalized : DEFAULT_PRIORITY;
}

function normalizeLinkSessionMode(value) {
  const normalized = String(value || '').toLowerCase();
  return LINK_SESSION_MODES.has(normalized) ? normalized : DEFAULT_SETTINGS.linkSessionMode;
}

function normalizeLanguage(value) {
  const normalized = String(value || '').toLowerCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : DEFAULT_SETTINGS.language;
}

function getLinkSessionPartition(mode, linkId) {
  const normalized = normalizeLinkSessionMode(mode);
  if (normalized === 'incognito') {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `temp-${stamp}-${rand}`;
  }
  if (normalized === 'per-link') {
    const numericId = Number(linkId);
    if (Number.isFinite(numericId) && numericId > 0) {
      return `persist:link-${Math.floor(numericId)}`;
    }
  }
  return null;
}

function normalizeLastOpenedAt(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function getSortValue(link, fallbackIndex = 0) {
  if (link && typeof link.sortOrder === 'number' && !isNaN(link.sortOrder)) return link.sortOrder;
  if (link && link.createdAt) {
    const ts = Date.parse(link.createdAt);
    if (!isNaN(ts)) return ts;
  }
  if (link && link.id) return Number(link.id);
  return fallbackIndex;
}

function normalizeLinkCollection(rawLinks) {
  if (!Array.isArray(rawLinks)) {
    return { normalized: [], changed: true };
  }
  let changed = false;
  const cloned = rawLinks.map((link) => Object.assign({}, link));
  cloned.forEach((link, idx) => {
    const nextLink = link;
    if (typeof nextLink.folder !== 'string') {
      nextLink.folder = sanitizeString(nextLink.folder);
      changed = true;
    } else {
      nextLink.folder = sanitizeString(nextLink.folder);
    }
    if (typeof nextLink.notes !== 'string') {
      nextLink.notes = sanitizeString(nextLink.notes);
      changed = true;
    } else {
      nextLink.notes = sanitizeString(nextLink.notes);
    }
    const desiredPriority = normalizePriority(nextLink.priority);
    if (nextLink.priority !== desiredPriority) {
      nextLink.priority = desiredPriority;
      changed = true;
    }
    if (!Array.isArray(nextLink.tags)) {
      nextLink.tags = normalizeTags(nextLink.tags);
      changed = true;
    }
    if (!nextLink.metadata || typeof nextLink.metadata !== 'object') {
      nextLink.metadata = createEmptyMetadata();
      changed = true;
    } else {
      nextLink.metadata = Object.assign(createEmptyMetadata(), nextLink.metadata);
    }
    if (!nextLink.health || typeof nextLink.health !== 'object') {
      nextLink.health = createEmptyHealth();
      changed = true;
    } else {
      nextLink.health = Object.assign(createEmptyHealth(), nextLink.health);
    }
    const normalizedOpenedAt = normalizeLastOpenedAt(nextLink.lastOpenedAt);
    if (nextLink.lastOpenedAt !== normalizedOpenedAt) {
      nextLink.lastOpenedAt = normalizedOpenedAt;
      changed = true;
    }
    const openCount = Number(nextLink.openCount);
    if (!Number.isFinite(openCount) || openCount < 0) {
      nextLink.openCount = 0;
      changed = true;
    } else if (nextLink.openCount !== openCount) {
      nextLink.openCount = openCount;
      changed = true;
    }
    if (typeof nextLink.sortOrder !== 'number' || isNaN(nextLink.sortOrder)) {
      nextLink.sortOrder = getSortValue(nextLink, idx + 1);
      changed = true;
    }
  });

  const ordered = cloned.slice().sort((a, b) => {
    return getSortValue(a) - getSortValue(b);
  });
  let cursor = 0;
  ordered.forEach((link) => {
    cursor += 10;
    if (link.sortOrder !== cursor) {
      link.sortOrder = cursor;
      changed = true;
    }
  });
  return { normalized: ordered, changed };
}

function getLinksNormalized() {
  const list = loadLinks();
  const { normalized, changed } = normalizeLinkCollection(list);
  if (changed) {
    saveLinks(normalized);
    return normalized;
  }
  scheduleBackgroundJobsForLinks(normalized);
  return normalized;
}

function getNextSortOrder(links = []) {
  let max = 0;
  for (const link of links) {
    if (!link || typeof link.sortOrder !== 'number') continue;
    if (link.sortOrder > max) max = link.sortOrder;
  }
  return max + 10;
}

function ensureBackgroundWorkersRunning() {
  if (!metadataTimer) {
    metadataTimer = setInterval(() => {
      try { processNextMetadataJob(); } catch (err) { console.error('Metadata job error:', err); }
    }, METADATA_POLL_INTERVAL_MS);
  }
  if (!healthTimer) {
    healthTimer = setInterval(() => {
      try { processNextHealthJob(); } catch (err) { console.error('Health job error:', err); }
    }, HEALTH_POLL_INTERVAL_MS);
  }
}

function scheduleBackgroundJobsForLinks(links = []) {
  if (!Array.isArray(links) || links.length === 0) return;
  ensureBackgroundWorkersRunning();
  const now = Date.now();
  links.forEach((link) => {
    queueMetadataJob(link, false, now);
    queueHealthJob(link, false, now);
  });
}

function queueMetadataJob(link, urgent = false, nowTs = Date.now()) {
  if (!link || !link.url || !link.id) return;
  const id = Number(link.id);
  const lastFetched = link.metadata && link.metadata.lastFetchedAt ? Date.parse(link.metadata.lastFetchedAt) : 0;
  const nextRetryAt = link.metadata && link.metadata.nextRetryAt ? Date.parse(link.metadata.nextRetryAt) : 0;
  const hasMetadata = !!(link.metadata && (link.metadata.title || link.metadata.description || link.metadata.favicon));
  const needsUpdate = !hasMetadata || !lastFetched || (nowTs - lastFetched) > METADATA_REFRESH_INTERVAL_MS;
  if (!urgent && nextRetryAt && nowTs < nextRetryAt) {
    scheduleRetry(metadataRetryTimers, id, nextRetryAt - nowTs, () => queueMetadataJobById(id, false));
    return;
  }
  if (!needsUpdate && !urgent) return;
  if (metadataPending.has(id) || metadataProcessing.has(id)) return;
  if (urgent) metadataQueue.unshift(id); else metadataQueue.push(id);
  metadataPending.add(id);
  ensureBackgroundWorkersRunning();
}

function queueHealthJob(link, urgent = false, nowTs = Date.now()) {
  if (!link || !link.url || !link.id) return;
  const id = Number(link.id);
  const lastChecked = link.health && link.health.checkedAt ? Date.parse(link.health.checkedAt) : 0;
  const nextRetryAt = link.health && link.health.nextRetryAt ? Date.parse(link.health.nextRetryAt) : 0;
  const needsUpdate = !lastChecked || (nowTs - lastChecked) > HEALTH_REFRESH_INTERVAL_MS || urgent;
  if (!urgent && nextRetryAt && nowTs < nextRetryAt) {
    scheduleRetry(healthRetryTimers, id, nextRetryAt - nowTs, () => queueHealthJobById(id, false));
    return;
  }
  if (!needsUpdate && !urgent) return;
  if (healthPending.has(id) || healthProcessing.has(id)) return;
  if (urgent) healthQueue.unshift(id); else healthQueue.push(id);
  healthPending.add(id);
  ensureBackgroundWorkersRunning();
}

function queueMetadataJobById(linkId, urgent = false) {
  const links = getLinksNormalized();
  const link = links.find((entry) => Number(entry.id) === Number(linkId));
  if (link) queueMetadataJob(link, urgent);
}

function queueHealthJobById(linkId, urgent = false) {
  const links = getLinksNormalized();
  const link = links.find((entry) => Number(entry.id) === Number(linkId));
  if (link) queueHealthJob(link, urgent);
}

function scheduleRetry(timerMap, linkId, delayMs, enqueue) {
  if (!delayMs || delayMs <= 0) return;
  if (timerMap.has(linkId)) return;
  const timer = setTimeout(() => {
    timerMap.delete(linkId);
    try { enqueue(); } catch (err) {}
  }, delayMs);
  timerMap.set(linkId, timer);
}

function computeBackoffMs(retryCount, baseMs, maxMs) {
  const exponent = Math.min(Number(retryCount) || 0, 6);
  const raw = Math.min(maxMs, baseMs * Math.pow(2, exponent));
  const jitter = Math.floor(raw * (0.1 * Math.random()));
  return raw + jitter;
}

function getNextRetryAtIso(retryCount, baseMs, maxMs) {
  const delay = computeBackoffMs(retryCount, baseMs, maxMs);
  return new Date(Date.now() + delay).toISOString();
}

function isSafeLinkUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    return SAFE_LINK_SCHEMES.has(parsed.protocol);
  } catch (err) {
    return false;
  }
}

function ensureLinkWindowCsp(linkWindow) {
  if (!linkWindow || linkWindow.isDestroyed()) return;
  const session = linkWindow.webContents.session;
  const webContentsId = linkWindow.webContents.id;
  let entry = linkWindowCspSessions.get(session);
  if (!entry) {
    const webContentsIds = new Set();
    const handler = (details, callback) => {
      if (!webContentsIds.has(details.webContentsId) || details.resourceType !== 'mainFrame') {
        callback({ cancel: false, responseHeaders: details.responseHeaders });
        return;
      }
      const headers = details.responseHeaders || {};
      const hasCsp = Object.keys(headers).some((key) => key.toLowerCase() === 'content-security-policy');
      if (!hasCsp) {
        headers['Content-Security-Policy'] = [LINK_WINDOW_CSP];
      }
      callback({ cancel: false, responseHeaders: headers });
    };
    session.webRequest.onHeadersReceived(handler);
    entry = { webContentsIds, handler };
    linkWindowCspSessions.set(session, entry);
  }
  entry.webContentsIds.add(webContentsId);
  linkWindow.on('closed', () => {
    entry.webContentsIds.delete(webContentsId);
  });
}

async function processNextMetadataJob() {
  if (!metadataQueue.length) return;
  const id = metadataQueue.shift();
  metadataPending.delete(id);
  if (metadataProcessing.has(id)) return;
  metadataProcessing.add(id);
  try {
    await refreshLinkMetadata(id);
  } catch (err) {
    console.error('Failed to refresh metadata:', err && err.message ? err.message : err);
  } finally {
    metadataProcessing.delete(id);
  }
}

async function processNextHealthJob() {
  if (!healthQueue.length) return;
  const id = healthQueue.shift();
  healthPending.delete(id);
  if (healthProcessing.has(id)) return;
  healthProcessing.add(id);
  try {
    await refreshLinkHealth(id);
  } catch (err) {
    console.error('Failed to refresh health:', err && err.message ? err.message : err);
  } finally {
    healthProcessing.delete(id);
  }
}

function httpRequest(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const shouldLog = shouldLogDataCollection();
    const requestId = shouldLog ? nextDataCollectionId() : null;
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const requestOptions = {
        method: options.method || 'GET',
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname || '/'}` + (parsed.search || ''),
        timeout: options.timeout || HTTP_TIMEOUT_MS,
        headers: Object.assign({
          'User-Agent': 'TransparentAIClient/2.0 (+https://github.com/brianw/plana)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*;q=0.8,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          Connection: 'close'
        }, options.headers || {})
      };
      if (shouldLog) {
        emitDataCollectionEvent('network-request', {
          requestId,
          purpose: options.purpose || 'unknown',
          method: requestOptions.method,
          url: targetUrl,
          headers: sanitizeHeaders(requestOptions.headers),
          timeoutMs: requestOptions.timeout,
          context: options.context || null
        });
      }
      const req = client.request(requestOptions, (res) => {
        let total = 0;
        const maxBytes = typeof options.maxBytes === 'number' ? options.maxBytes : MAX_METADATA_BYTES;
        const buffers = [];
        const collectBody = options.collectBody !== false;
        res.on('data', (chunk) => {
          total += chunk.length;
          if (!collectBody) return;
          if (total <= maxBytes) {
            buffers.push(chunk);
          } else if (buffers.length === 0) {
            buffers.push(chunk.slice(0, maxBytes));
          }
        });
        res.on('end', () => {
          if (shouldLog) {
            emitDataCollectionEvent('network-response', {
              requestId,
              statusCode: res.statusCode || null,
              contentType: (res.headers && res.headers['content-type']) || null,
              bytes: total,
              durationMs: Date.now() - startedAt
            });
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers || {},
            body: options.collectBody === false ? '' : Buffer.concat(buffers).toString('utf8')
          });
        });
      });
      req.on('error', (err) => {
        if (shouldLog) {
          emitDataCollectionEvent('network-error', {
            requestId,
            message: err && err.message ? err.message : String(err),
            durationMs: Date.now() - startedAt
          });
        }
        reject(err);
      });
      req.setTimeout(requestOptions.timeout, () => {
        try { req.destroy(new Error('Request timed out')); } catch (err) {}
      });
      req.end();
    } catch (err) {
      if (shouldLog) {
        emitDataCollectionEvent('network-error', {
          requestId,
          message: err && err.message ? err.message : String(err),
          durationMs: Date.now() - startedAt
        });
      }
      reject(err);
    }
  });
}

async function fetchWithRedirects(targetUrl, options = {}, depth = 0) {
  const maxRedirects = typeof options.maxRedirects === 'number' ? options.maxRedirects : 4;
  if (depth > maxRedirects) throw new Error('Too many redirects');
  const response = await httpRequest(targetUrl, options);
  const status = Number(response.statusCode || 0);
  if ([301, 302, 303, 307, 308].includes(status) && response.headers && response.headers.location) {
    const next = new URL(response.headers.location, targetUrl).toString();
    const redirected = await fetchWithRedirects(next, options, depth + 1);
    return Object.assign({}, redirected, { redirected: true, finalUrl: redirected.finalUrl || next });
  }
  return Object.assign({}, response, { redirected: depth > 0, finalUrl: targetUrl });
}

function extractAttr(tag, attrName) {
  if (!tag) return null;
  const regex = new RegExp(attrName + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s\"'=<>`]+))", 'i');
  const match = String(tag).match(regex);
  if (!match) return null;
  return match[2] || match[3] || match[4] || null;
}

function extractMetadataFromHtml(html, pageUrl) {
  const subset = typeof html === 'string' ? html.slice(0, 300000) : '';
  const metadata = createEmptyMetadata();
  const ogTitleTag = subset.match(/<meta[^>]+property=["']og:title["'][^>]*>/i);
  const ogDescTag = subset.match(/<meta[^>]+property=["']og:description["'][^>]*>/i);
  const ogImageTag = subset.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
  const ogSiteTag = subset.match(/<meta[^>]+property=["']og:site_name["'][^>]*>/i);
  const descTag = subset.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  const themeTag = subset.match(/<meta[^>]+name=["']theme-color["'][^>]*>/i);
  const titleMatch = subset.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  metadata.title = (extractAttr(ogTitleTag, 'content') || (titleMatch ? titleMatch[1] : '') || '').trim() || null;
  const description = (extractAttr(ogDescTag, 'content') || extractAttr(descTag, 'content') || '').trim();
  metadata.description = description || null;
  metadata.previewImage = (extractAttr(ogImageTag, 'content') || '').trim() || null;
  metadata.siteName = (extractAttr(ogSiteTag, 'content') || '').trim() || null;
  metadata.dominantColor = (extractAttr(themeTag, 'content') || '').trim() || null;
  const iconTag = subset.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i);
  const favicon = extractAttr(iconTag, 'href');
  try {
    if (favicon) metadata.favicon = new URL(favicon, pageUrl).toString();
    else metadata.favicon = new URL('/favicon.ico', pageUrl).toString();
  } catch (err) {
    metadata.favicon = null;
  }
  if (!metadata.siteName) {
    try {
      const parsed = new URL(pageUrl);
      metadata.siteName = parsed.hostname;
    } catch (err) {}
  }
  return metadata;
}

async function collectMetadataForUrl(targetUrl, context = null) {
  try {
    const response = await fetchWithRedirects(targetUrl, {
      method: 'GET',
      maxBytes: MAX_METADATA_BYTES,
      timeout: HTTP_TIMEOUT_MS,
      purpose: 'metadata',
      context
    });
    if (!response) return null;
    const contentType = (response.headers && response.headers['content-type']) || '';
    if (contentType && !/text\/html/i.test(contentType)) {
      return {
        title: null,
        description: null,
        favicon: null,
        dominantColor: null,
        siteName: null,
        previewImage: null,
        sourceUrl: response.finalUrl || targetUrl
      };
    }
    const metadata = extractMetadataFromHtml(response.body || '', response.finalUrl || targetUrl);
    metadata.sourceUrl = response.finalUrl || targetUrl;
    return metadata;
  } catch (err) {
    throw err;
  }
}

async function refreshLinkMetadata(linkId) {
  const links = getLinksNormalized();
  const idx = links.findIndex((l) => Number(l.id) === Number(linkId));
  if (idx === -1) return false;
  const link = links[idx];
  const metadata = Object.assign(createEmptyMetadata(), link.metadata || {});
  try {
    const info = await collectMetadataForUrl(link.url, { linkId: link.id });
    if (info) {
      link.metadata = Object.assign(metadata, info, {
        lastFetchedAt: new Date().toISOString(),
        error: null,
        retryCount: 0,
        nextRetryAt: null
      });
      let hostname = null;
      try { hostname = new URL(link.url).hostname; } catch (err) {}
      if (!link.title || (hostname && link.title === hostname)) {
        if (info.title) link.title = info.title;
      }
    } else {
      link.metadata = Object.assign(metadata, {
        lastFetchedAt: new Date().toISOString(),
        retryCount: 0,
        nextRetryAt: null
      });
    }
  } catch (err) {
    const retryCount = (metadata.retryCount || 0) + 1;
    link.metadata = Object.assign(metadata, {
      lastFetchedAt: new Date().toISOString(),
      error: err && err.message ? err.message : String(err),
      retryCount,
      nextRetryAt: getNextRetryAtIso(retryCount, METADATA_BACKOFF_BASE_MS, METADATA_BACKOFF_MAX_MS)
    });
  }
  links[idx] = link;
  saveLinks(links);
  if (link.metadata && link.metadata.nextRetryAt) {
    queueMetadataJob(link, false, Date.now());
  }
  return true;
}

async function refreshLinkHealth(linkId) {
  const links = getLinksNormalized();
  const idx = links.findIndex((l) => Number(l.id) === Number(linkId));
  if (idx === -1) return false;
  const link = links[idx];
  const health = Object.assign(createEmptyHealth(), link.health || {});
  try {
    const started = Date.now();
    const response = await fetchWithRedirects(link.url, {
      method: 'HEAD',
      collectBody: false,
      timeout: 8000,
      purpose: 'health',
      context: { linkId: link.id }
    });
    health.statusCode = response.statusCode || null;
    health.redirected = !!response.redirected;
    health.checkedAt = new Date().toISOString();
    health.latency = Date.now() - started;
    const code = Number(response.statusCode || 0);
    if (code >= 200 && code < 300) health.status = 'ok';
    else if (code >= 300 && code < 400) health.status = 'redirected';
    else if (code >= 400 && code < 500) health.status = 'warning';
    else if (code >= 500) health.status = 'error';
    else health.status = 'unknown';
    health.error = null;
    health.retryCount = 0;
    health.nextRetryAt = null;
  } catch (err) {
    health.status = 'broken';
    health.error = err && err.message ? err.message : String(err);
    health.checkedAt = new Date().toISOString();
    health.retryCount = (health.retryCount || 0) + 1;
    health.nextRetryAt = getNextRetryAtIso(health.retryCount, HEALTH_BACKOFF_BASE_MS, HEALTH_BACKOFF_MAX_MS);
  }
  link.health = health;
  links[idx] = link;
  saveLinks(links);
  if (link.health && link.health.nextRetryAt) {
    queueHealthJob(link, false, Date.now());
  }
  return true;
}

function notifyLinksChanged() {
  BrowserWindow.getAllWindows().forEach((w) => {
    try { w.webContents.send('links-changed'); } catch (err) {}
  });
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertLinksToCsv(links = []) {
  const header = [
    'id',
    'url',
    'title',
    'tags',
    'folder',
    'notes',
    'priority',
    'favorite',
    'pinned',
    'createdAt',
    'updatedAt'
  ];
  const rows = [header.join(',')];
  links.forEach((link) => {
    const tags = Array.isArray(link.tags) ? link.tags.join('|') : '';
    rows.push([
      escapeCsvValue(link.id),
      escapeCsvValue(link.url),
      escapeCsvValue(link.title),
      escapeCsvValue(tags),
      escapeCsvValue(link.folder || ''),
      escapeCsvValue(link.notes || ''),
      escapeCsvValue(link.priority || DEFAULT_PRIORITY),
      escapeCsvValue(link.favorite ? '1' : '0'),
      escapeCsvValue(link.pinned ? '1' : '0'),
      escapeCsvValue(link.createdAt || ''),
      escapeCsvValue(link.updatedAt || '')
    ].join(','));
  });
  return rows.join('\n');
}

function parseCsv(content) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const cells = [];
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      cells.push(current);
      rows.push(cells.slice());
      cells.length = 0;
      current = '';
      continue;
    }
    current += char;
  }
  if (current.length || cells.length) {
    cells.push(current);
    rows.push(cells.slice());
  }
  return rows.filter(row => row.length);
}

function csvRecords(content) {
  const rows = parseCsv(content);
  if (!rows.length) return [];
  const header = rows.shift().map((h) => h.trim());
  return rows.map((row) => {
    const record = {};
    header.forEach((key, idx) => {
      record[key] = row[idx] !== undefined ? row[idx] : '';
    });
    return record;
  });
}

// Initialize links storage
function initializeLinksStorage() {
  try {
    ensureLinksFileExists();
  } catch (err) {
    // already logged
  }
}

// Load links from storage
function loadLinks() {
  try {
    const file = getDataFilePath();
    ensureLinksFileExists(file);
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading links:', error);
    return [];
  }
}

// Helper: compute sync file path when folder sync is enabled
function getSyncFilePath() {
  try {
    if (appSettings && appSettings.useFolderSync && appSettings.syncFolder) {
      return path.join(appSettings.syncFolder, 'links.json');
    }
  } catch (err) {}
  return null;
}

// Save links to storage (both local and optionally sync folder)
function saveLinks(links) {
  try {
    // Always keep local copy for app usage
    const file = getDataFilePath();
    ensureLinksFileExists(file);
    fs.writeFileSync(file, JSON.stringify(links, null, 2));

    // If folder sync enabled, write a wrapper with updatedAt so other devices can detect changes
    const syncPath = getSyncFilePath();
    if (syncPath) {
      const wrapper = { updatedAt: Date.now(), links };
      try { fs.writeFileSync(syncPath, JSON.stringify(wrapper, null, 2)); lastSyncUpdatedAt = wrapper.updatedAt; } catch (err) { console.error('Error writing sync file:', err); }
    }
    scheduleBackgroundJobsForLinks(Array.isArray(links) ? links : []);
    notifyLinksChanged();
  } catch (error) {
    console.error('Error saving links:', error);
  }
}

// Close and clean up all open link windows
function closeAllLinkWindows() {
  for (const win of Array.from(linkWindows)) {
    try { win.close(); } catch (err) {}
  }
}

// Persist the set of currently open link windows so we can restore them on next launch
function persistOpenLinksState() {
  try {
    const openLinks = [];
    for (const [win, meta] of linkWindowMeta.entries()) {
      if (!win || win.isDestroyed()) continue;
      if (!meta || !meta.url) continue;
      openLinks.push({ id: meta.id || null, url: meta.url });
    }
    // Remove duplicates (by id or url)
    const deduped = [];
    const seen = new Set();
    for (const l of openLinks) {
      const key = l.id ? `id:${l.id}` : `url:${l.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(l);
    }
    appSettings.lastOpenedLinks = deduped;
    if (appSettings.persistSettings) saveSettings();
  } catch (err) {
    console.error('Error persisting open links state:', err);
  }
}

function getDefaultMainWindowBounds(win) {
  const fallbackDisplay = screen.getPrimaryDisplay();
  let display = fallbackDisplay;
  try {
    if (win) display = screen.getDisplayMatching(win.getBounds());
  } catch (err) {}
  const workArea = display && display.workArea
    ? display.workArea
    : { x: 0, y: 0, width: DEFAULT_MAIN_WINDOW_WIDTH, height: DEFAULT_MAIN_WINDOW_HEIGHT };
  const width = DEFAULT_MAIN_WINDOW_WIDTH;
  const height = DEFAULT_MAIN_WINDOW_HEIGHT;
  const x = Math.round(workArea.x + Math.max(0, (workArea.width - width) / 2));
  const y = Math.round(workArea.y + Math.max(0, (workArea.height - height) / 2));
  return { x, y, width, height };
}

function createWindow() {
  const useNativeTransparency = !!appSettings.nativeTransparency;
  mainWindow = new BrowserWindow({
    width: DEFAULT_MAIN_WINDOW_WIDTH,
    height: DEFAULT_MAIN_WINDOW_HEIGHT,
    center: true,
    transparent: useNativeTransparency,
    frame: !useNativeTransparency,
    backgroundColor: useNativeTransparency ? '#00000000' : '#111111',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });
  trackWindowForLayout(mainWindow);
  scheduleLayoutSnapshot();

  // Ensure main window honors global opacity
    // Notify main renderer of current app opacity so it can apply background-only transparency
    mainWindow.webContents.on('did-finish-load', () => {
      try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
      try { emitTelemetryStateSnapshot('window-ready'); } catch (err) {}
      logPerf('main-window did-finish-load');
      pushPerfEvent('main-window did-finish-load');
    });
  if (PERF_BENCH) {
    mainWindow.once('ready-to-show', () => logPerf('main-window ready-to-show'));
  }
  mainWindow.once('ready-to-show', () => pushPerfEvent('main-window ready-to-show'));

  mainWindow.loadFile('index.html');

  // Open dev tools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.close();
    }
    if (layoutWindow && !layoutWindow.isDestroyed()) {
      layoutWindow.close();
    }
  });

}

function openChatWindow() {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.focus();
    return true;
  }
  const useNativeTransparency = !!appSettings.nativeTransparency;
  chatWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 720,
    minHeight: 520,
    transparent: useNativeTransparency,
    frame: !useNativeTransparency,
    backgroundColor: useNativeTransparency ? '#00000000' : '#0b1018',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });
  trackWindowForLayout(chatWindow);
  scheduleLayoutSnapshot();

  chatWindow.webContents.on('did-finish-load', () => {
    try { chatWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
    try { emitTelemetryStateSnapshot('chat-window-ready'); } catch (err) {}
  });

  chatWindow.loadFile('index.html', { query: { chat: '1' } });

  chatWindow.on('closed', function () {
    chatWindow = null;
  });

  return true;
}

function openLayoutWindow() {
  if (layoutWindow && !layoutWindow.isDestroyed()) {
    try { layoutWindow.focus(); } catch (err) {}
    return true;
  }
  layoutWindow = new BrowserWindow({
    width: 860,
    height: 560,
    minWidth: 520,
    minHeight: 360,
    transparent: false,
    frame: true,
    backgroundColor: '#0f1216',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    title: 'Window layout map',
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-layout.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  layoutWindow.loadFile(path.join(__dirname, 'layout.html'));
  layoutWindow.webContents.on('did-finish-load', () => {
    sendLayoutSnapshot(layoutWindow);
  });
  layoutWindow.on('closed', () => {
    layoutWindow = null;
  });
  trackWindowForLayout(layoutWindow);
  return true;
}

// Window bounds helpers for renderer processes
ipcMain.handle('get-window-bounds', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  return win.getBounds();
});

ipcMain.handle('get-window-work-area', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  try {
    const bounds = win.getBounds();
    let display = null;
    try {
      if (bounds) display = screen.getDisplayMatching(bounds);
    } catch (err) {}
    if (!display) display = screen.getPrimaryDisplay();
    const workArea = display && display.workArea
      ? display.workArea
      : { x: 0, y: 0, width: DEFAULT_MAIN_WINDOW_WIDTH, height: DEFAULT_MAIN_WINDOW_HEIGHT };
    return workArea;
  } catch (err) {
    return null;
  }
});

ipcMain.handle('set-window-bounds', (event, bounds) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !bounds) return false;
  try {
    win.setBounds(bounds);
    return true;
  } catch (err) {
    console.error('Error setting bounds:', err);
    return false;
  }
});
 
// Move window by delta
ipcMain.handle('move-window', (event, { dx = 0, dy = 0 } = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    return true;
  } catch (err) {
    console.error('Error moving window:', err);
    return false;
  }
});
 
// Toggle maximize / restore
ipcMain.handle('toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    return true;
  } catch (err) {
    console.error('Error toggling maximize:', err);
    return false;
  }
});

ipcMain.handle('reset-window-bounds', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    if (win.isMaximized && win.isMaximized()) win.unmaximize();
    if (win.isFullScreen && win.isFullScreen()) win.setFullScreen(false);
    win.setBounds(getDefaultMainWindowBounds(win));
    return true;
  } catch (err) {
    console.error('Error resetting window bounds:', err);
    return false;
  }
});
 
app.on('browser-window-focus', (_event, win) => {
  setFocusedWindow(win);
});

app.on('browser-window-blur', (_event, win) => {
  if (focusedWindowInfo && win && focusedWindowInfo.windowId === win.id) {
    focusedWindowInfo = null;
    broadcastFocusedWindowChanged();
  }
});

app.on('ready', () => {
  initializeLinksStorage();
  // load settings before creating windows
  try { loadSettings(); } catch (err) { /* ignore */ }
  try { applyTelemetryState(!!appSettings.telemetryEnabled); } catch (err) {}
  if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
  logPerf('app ready');
  pushPerfEvent('app ready');
  createWindow();
  // Restore the last opened link (if any) after the main window is ready
  try { reopenLastLinksIfAvailable(); } catch (err) {}
  try { ensureBackgroundWorkersRunning(); } catch (err) {}
  try { initAutoUpdater(); } catch (err) {}
  if (appSettings.developerMode) openPerfWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  persistOpenLinksState();
  closeAllLinkWindows();
  if (layoutWindow && !layoutWindow.isDestroyed()) {
    layoutWindow.close();
  }
  if (metadataTimer) clearInterval(metadataTimer);
  if (healthTimer) clearInterval(healthTimer);
});

// IPC handlers
ipcMain.handle('get-links', () => {
  return getLinksNormalized();
});

ipcMain.handle('add-link', (event, link) => {
  if (!link || !link.url) return null;
  try { new URL(link.url); } catch (err) { return null; }
  const links = getLinksNormalized();
  const normalizedTags = normalizeTags(link && link.tags);
  let derivedTitle = '';
  try { derivedTitle = new URL(link.url).hostname; } catch (err) { derivedTitle = link.url; }
  const folder = sanitizeString(link && link.folder);
  const notes = sanitizeString(link && link.notes);
  const priority = normalizePriority(link && link.priority);
  const newLink = {
    id: Date.now(),
    url: link.url,
    title: sanitizeString(link && link.title) || derivedTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: false,
    tags: normalizedTags,
    pinned: !!(link && link.pinned),
    folder,
    notes,
    priority,
    openCount: 0,
    lastOpenedAt: null,
    sortOrder: getNextSortOrder(links),
    metadata: createEmptyMetadata(),
    health: createEmptyHealth()
  };
  links.push(newLink);
  saveLinks(links);
  return newLink;
});

ipcMain.handle('toggle-favorite', (event, id) => {
  try {
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === Number(id));
    if (idx === -1) return false;
    links[idx].favorite = !links[idx].favorite;
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) { return false; }
});

ipcMain.handle('update-link', (event, payload = {}) => {
  try {
    const id = payload && payload.id ? Number(payload.id) : null;
    if (!id) return false;
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === Number(id));
    if (idx === -1) return false;
    if (payload.url !== undefined) {
      if (!payload.url) return false;
      new URL(payload.url);
      links[idx].url = payload.url;
    }
    if (payload.title !== undefined) {
      const title = sanitizeString(payload.title);
      if (title) links[idx].title = title;
    }
    if (payload.tags !== undefined) {
      links[idx].tags = normalizeTags(payload.tags);
    }
    if (payload.pinned !== undefined) {
      links[idx].pinned = !!payload.pinned;
    }
    if (payload.folder !== undefined) {
      links[idx].folder = sanitizeString(payload.folder);
    }
    if (payload.notes !== undefined) {
      links[idx].notes = sanitizeString(payload.notes);
    }
    if (payload.priority !== undefined) {
      links[idx].priority = normalizePriority(payload.priority);
    }
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) {
    console.error('Error updating link:', err);
    return false;
  }
});

ipcMain.handle('bulk-delete', (event, ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const links = getLinksNormalized();
    const remaining = links.filter(l => !ids.includes(l.id));
    saveLinks(remaining);
    return true;
  } catch (err) { return false; }
});

ipcMain.handle('set-link-pinned', (event, id, pinned) => {
  try {
    const targetId = Number(id);
    if (!targetId) return false;
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === targetId);
    if (idx === -1) return false;
    links[idx].pinned = !!pinned;
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) {
    console.error('Error pinning link:', err);
    return false;
  }
});

ipcMain.handle('bulk-update-tags', (event, ids = [], tags = [], mode = 'replace') => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const normalizedTags = normalizeTags(tags);
    const idSet = new Set(ids.map(id => Number(id)));
    const links = getLinksNormalized();
    let changed = false;
    for (const link of links) {
      if (!idSet.has(Number(link.id))) continue;
      if (mode === 'append') {
        const merged = normalizeTags([...(link.tags || []), ...normalizedTags]);
        link.tags = merged;
      } else {
        link.tags = normalizedTags;
      }
      link.updatedAt = new Date().toISOString();
      changed = true;
    }
    if (changed) saveLinks(links);
    return changed;
  } catch (err) {
    console.error('Error bulk updating tags:', err);
    return false;
  }
});

ipcMain.handle('reorder-links', (event, orderedIds = []) => {
  try {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return false;
    const normalizedIds = orderedIds.map((id) => Number(id)).filter((id) => !isNaN(id));
    if (!normalizedIds.length) return false;
    const links = getLinksNormalized();
    const idSet = new Set(normalizedIds);
    const idToLink = new Map();
    links.forEach((link) => idToLink.set(Number(link.id), link));
    const ordered = [];
    normalizedIds.forEach((id) => {
      const link = idToLink.get(id);
      if (link) ordered.push(link);
    });
    const remainder = links.filter((link) => !idSet.has(Number(link.id)));
    const finalOrder = ordered.concat(remainder);
    let cursor = 0;
    finalOrder.forEach((link) => {
      cursor += 10;
      link.sortOrder = cursor;
    });
    saveLinks(finalOrder);
    return true;
  } catch (err) {
    console.error('Error reordering links:', err);
    return false;
  }
});

ipcMain.handle('refresh-link-metadata', (event, id) => {
  try {
    const links = getLinksNormalized();
    const link = links.find((item) => Number(item.id) === Number(id));
    if (!link) return false;
    queueMetadataJob(link, true);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('refresh-link-health', (event, id) => {
  try {
    const links = getLinksNormalized();
    const link = links.find((item) => Number(item.id) === Number(id));
    if (!link) return false;
    queueHealthJob(link, true);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('peek-clipboard-link', () => {
  try {
    const text = clipboard.readText();
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch (err) {
    return null;
  }
});

ipcMain.handle('export-links-csv', async () => {
  try {
    const links = getLinksNormalized();
    const res = await dialog.showSaveDialog({
      title: 'Export links (CSV)',
      defaultPath: path.join(app.getPath('documents'), 'plana-links.csv'),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, convertLinksToCsv(links), 'utf8');
    return res.filePath;
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return null;
  }
});

ipcMain.handle('import-links-csv', async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return 0;
    const raw = fs.readFileSync(res.filePaths[0], 'utf8');
    const records = csvRecords(raw);
    if (!records.length) return 0;
    const links = getLinksNormalized();
    const existingUrls = new Set(links.map((link) => link.url));
    const existingIds = new Set(links.map((link) => Number(link.id)));
    let added = 0;
    for (const record of records) {
      const url = sanitizeString(record.url || record.URL);
      if (!url) continue;
      try { new URL(url); } catch (err) { continue; }
      if (existingUrls.has(url)) continue;
      let id = Number(record.id);
      if (!id || existingIds.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000) + added;
      }
      const tags = record.tags ? record.tags.split('|').map((t) => t.trim()).filter(Boolean) : [];
      const favValue = String(record.favorite || record.Favorite || '').toLowerCase();
      const pinnedValue = String(record.pinned || record.Pinned || '').toLowerCase();
      const link = {
        id,
        url,
        title: sanitizeString(record.title || record.Title) || url,
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: favValue === '1' || favValue === 'true',
        pinned: pinnedValue === '1' || pinnedValue === 'true',
        tags: normalizeTags(tags),
        folder: sanitizeString(record.folder || record.Folder),
        notes: sanitizeString(record.notes || record.Notes),
        priority: normalizePriority(record.priority || record.Priority),
        sortOrder: getNextSortOrder(links),
        metadata: createEmptyMetadata(),
        health: createEmptyHealth()
      };
      links.push(link);
      existingUrls.add(url);
      existingIds.add(id);
      added++;
    }
    if (added) saveLinks(links);
    return added;
  } catch (err) {
    console.error('Error importing CSV:', err);
    return 0;
  }
});

// Export links: show save dialog and write JSON
ipcMain.handle('export-links', async (event) => {
  try {
    const links = getLinksNormalized();
    const res = await dialog.showSaveDialog({
      title: 'Export links',
      defaultPath: path.join(app.getPath('documents'), 'plana-links.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, JSON.stringify(links, null, 2), 'utf8');
    return res.filePath;
  } catch (err) { console.error(err); return null; }
});

// Import links: show open dialog, read file and merge by id (add new)
ipcMain.handle('import-links', async (event) => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return null;
    const raw = fs.readFileSync(res.filePaths[0], 'utf8');
  let imported = JSON.parse(raw);
  // accept either an array of links or a wrapper { updatedAt, links }
  if (imported && typeof imported === 'object' && Array.isArray(imported.links)) imported = imported.links;
  if (!Array.isArray(imported)) return null;
  const links = getLinksNormalized();
    const existingIds = new Set(links.map(l => Number(l.id)));
    const existingUrls = new Set(links.map(l => l.url));
    for (const item of imported) {
      const url = sanitizeString(item && item.url);
      if (!url || existingUrls.has(url)) continue;
      try { new URL(url); } catch (err) { continue; }
      let id = Number(item && item.id);
      if (!id || existingIds.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      const normalizedTags = normalizeTags(item && item.tags);
      const newItem = {
        id,
        url,
        title: sanitizeString(item && item.title) || url,
        createdAt: item && item.createdAt ? item.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: !!(item && item.favorite),
        tags: normalizedTags,
        pinned: !!(item && item.pinned),
        folder: sanitizeString(item && item.folder),
        notes: sanitizeString(item && item.notes),
        priority: normalizePriority(item && item.priority),
        sortOrder: getNextSortOrder(links),
        metadata: Object.assign(createEmptyMetadata(), item && item.metadata ? item.metadata : {}),
        health: Object.assign(createEmptyHealth(), item && item.health ? item.health : {})
      };
      links.push(newItem);
      existingIds.add(id);
      existingUrls.add(url);
    }
    saveLinks(links);
    return true;
  } catch (err) { console.error(err); return null; }
});

// Manual backup: keep last N revisions in appData/backups
ipcMain.handle('manual-backup', (event, keepN = 5) => {
  try {
    const links = getLinksNormalized();
    const backupsDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const filename = `links-${Date.now()}.json`;
    const filepath = path.join(backupsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(links, null, 2), 'utf8');
    // prune
    const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('links-')).map(f => ({ f, t: fs.statSync(path.join(backupsDir, f)).mtimeMs }));
    files.sort((a, b) => b.t - a.t);
    for (let i = keepN; i < files.length; i++) {
      try { fs.unlinkSync(path.join(backupsDir, files[i].f)); } catch (e) {}
    }
    return filepath;
  } catch (err) { console.error(err); return null; }
});

ipcMain.handle('delete-link', (event, id) => {
  let links = getLinksNormalized();
  links = links.filter(link => link.id !== id);
  saveLinks(links);
  return true;
});

ipcMain.handle('open-link-external', (event, url) => {
  try {
    if (!url) return false;
    new URL(url);
    shell.openExternal(url);
    return true;
  } catch (err) {
    console.error('Error opening link externally:', err);
    return false;
  }
});

ipcMain.handle('copy-link', (event, url) => {
  try {
    if (!url) return false;
    clipboard.writeText(String(url));
    return true;
  } catch (err) {
    console.error('Error copying link:', err);
    return false;
  }
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
  persistOpenLinksState();
  closeAllLinkWindows();
  if (layoutWindow && !layoutWindow.isDestroyed()) {
    layoutWindow.close();
  }
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

ipcMain.handle('open-chat-window', () => {
  return openChatWindow();
});

ipcMain.handle('open-layout-window', () => {
  return openLayoutWindow();
});

ipcMain.handle('get-focused-window', () => {
  return focusedWindowInfo;
});

ipcMain.handle('close-current-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  win.close();
  return true;
});

ipcMain.handle('minimize-current-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  win.minimize();
  return true;
});

function recordLinkOpen(id, url) {
  try {
    const links = getLinksNormalized();
    let idx = -1;
    if (id) {
      idx = links.findIndex(l => Number(l.id) === Number(id));
    }
    if (idx === -1 && url) {
      idx = links.findIndex(l => l.url === url);
    }
    if (idx === -1) return;
    const link = links[idx];
    const count = Number(link.openCount);
    link.openCount = Number.isFinite(count) && count >= 0 ? count + 1 : 1;
    link.lastOpenedAt = new Date().toISOString();
    link.updatedAt = new Date().toISOString();
    saveLinks(links);
  } catch (err) {
    console.error('Error recording open stats:', err);
  }
}

function openLinkWindow(idOrUrl, maybeUrl, options = {}) {
  // Handler supports two calling conventions for backward compatibility:
  // - open-link(id, url) where id is numeric
  // - open-link(url) older callers
  let id = null;
  let url = null;
  // If a url is provided as the second argument, always treat it as the URL (even if id is null)
  if (typeof maybeUrl === 'string') {
    if (typeof idOrUrl === 'number' || typeof idOrUrl === 'string') id = Number(idOrUrl);
    url = maybeUrl;
  } else {
    url = idOrUrl;
  }

  // Guard against missing/invalid urls
  if (!url || typeof url !== 'string') return false;
  if (!isSafeLinkUrl(url)) return false;

  // Find saved bounds for this link id if available
  let savedBounds = null;
  const overrideBounds = options && options.bounds && typeof options.bounds === 'object'
    ? options.bounds
    : null;
  if (overrideBounds) {
    savedBounds = overrideBounds;
  }
  try {
    if (!savedBounds && id) {
      const links = getLinksNormalized();
      const found = links.find(l => Number(l.id) === Number(id));
      if (found && found.lastBounds) savedBounds = found.lastBounds;
    }
  } catch (err) {}

  const sessionMode = normalizeLinkSessionMode(
    options && options.sessionMode ? options.sessionMode : appSettings.linkSessionMode
  );
  const sessionPartition = getLinkSessionPartition(sessionMode, id);
  const webPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload-link.js')
  };
  if (sessionPartition) webPreferences.partition = sessionPartition;

  const useNativeTransparency = !!appSettings.nativeTransparency;
  let winOpts = {
    width: 1000,
    height: 800,
    transparent: useNativeTransparency,
    frame: !useNativeTransparency,
    resizable: true,
    movable: true,
    backgroundColor: useNativeTransparency ? '#00000000' : '#111111',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    webPreferences
  };

  if (savedBounds) {
    // apply saved bounds
    winOpts.x = savedBounds.x;
    winOpts.y = savedBounds.y;
    winOpts.width = savedBounds.width || winOpts.width;
    winOpts.height = savedBounds.height || winOpts.height;
  }

  recordLinkOpen(id, url);

  let linkWindow = new BrowserWindow(winOpts);
  linkWindowMeta.set(linkWindow, { id: id || null, url });
  trackWindowForLayout(linkWindow);
  const linkOpenStart = PERF_BENCH ? process.hrtime.bigint() : null;
  const linkLabel = summarizeUrl(url);
  if (PERF_BENCH && linkOpenStart) {
    linkWindow.once('ready-to-show', () => logPerf(`link-window ready-to-show (${url})`, linkOpenStart));
    linkWindow.webContents.once('did-finish-load', () => logPerf(`link-window did-finish-load (${url})`, linkOpenStart));
  }
  linkWindow.once('ready-to-show', () => {
    pushPerfEvent('link-window ready-to-show', { url: linkLabel });
  });
  linkWindow.webContents.once('did-finish-load', () => {
    pushPerfEvent('link-window did-finish-load', { url: linkLabel });
  });

  try {
    if (typeof linkWindow.setOpacity === 'function') {
      const targetOpacity = appSettings.nativeTransparency ? 1 : getLinkWindowOpacity(appOpacity);
      linkWindow.setOpacity(targetOpacity);
    }
  } catch (err) {
    // ignore opacity failures on unsupported platforms
  }

  if (savedBounds) {
    try {
      const rawBounds = {};
      if (typeof savedBounds.x === 'number' && !isNaN(savedBounds.x)) rawBounds.x = Math.floor(savedBounds.x);
      if (typeof savedBounds.y === 'number' && !isNaN(savedBounds.y)) rawBounds.y = Math.floor(savedBounds.y);
      if (typeof savedBounds.width === 'number' && !isNaN(savedBounds.width)) rawBounds.width = Math.max(1, Math.floor(savedBounds.width));
      if (typeof savedBounds.height === 'number' && !isNaN(savedBounds.height)) rawBounds.height = Math.max(1, Math.floor(savedBounds.height));
      if (Object.keys(rawBounds).length) linkWindow.setBounds(rawBounds);
    } catch (err) { /* ignore invalid saved bounds */ }
  }

  ensureLinkWindowCsp(linkWindow);

  // Force target=_blank / window.open navigations to stay in the same window (e.g., Google account switchers)
  try {
    linkWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      if (!isSafeLinkUrl(targetUrl)) return { action: 'deny' };
      try { if (targetUrl) linkWindow.loadURL(targetUrl); } catch (err) {}
      return { action: 'deny' };
    });
  } catch (err) {
    // Fallback for older Electron versions
    linkWindow.webContents.on('new-window', (event, targetUrl) => {
      event.preventDefault();
      if (!isSafeLinkUrl(targetUrl)) return;
      try { if (targetUrl) linkWindow.loadURL(targetUrl); } catch (e) {}
    });
  }

  linkWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isSafeLinkUrl(targetUrl)) event.preventDefault();
  });

  // Load the URL directly
  linkWindow.loadURL(url);

  // Apply current app opacity immediately
  try {
     // Let the link window's preload script apply background-only opacity (it listens to app-opacity-changed)
     linkWindow.webContents.send('app-opacity-changed', appOpacity);
  } catch (err) { /* ignore if unsupported */ }

  // Keep track of open link windows so we can update opacity later
  linkWindows.add(linkWindow);

  // Remember the last opened link so we can restore it on next launch
  try {
    linkWindowMeta.set(linkWindow, { id: id || null, url });
    appSettings.lastOpenedLinks = Array.from(linkWindowMeta.values())
      .filter(v => v && v.url)
      .map(v => ({ id: v.id || null, url: v.url }));
    if (appSettings.persistSettings) saveSettings();
  } catch (err) {}
  scheduleLayoutSnapshot();

  // Save and persist window bounds for this link id when moved/resized (debounced)
  if (id) {
    let saveTimer = null;
    const saveBounds = () => {
      try {
        if (!linkWindow || linkWindow.isDestroyed()) return;
        const b = linkWindow.getBounds();
        const links = getLinksNormalized();
        const idx = links.findIndex(l => Number(l.id) === Number(id));
        if (idx !== -1) {
          links[idx].lastBounds = { x: b.x, y: b.y, width: b.width, height: b.height };
          links[idx].updatedAt = new Date().toISOString();
          saveLinks(links);
        }
      } catch (err) {}
    };

    const scheduleSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveBounds, 500);
    };

    linkWindow.on('move', scheduleSave);
    linkWindow.on('resize', scheduleSave);
    linkWindow.on('close', () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      // save final bounds synchronously
      try { saveBounds(); } catch (e) {}
    });
  }

  linkWindow.on('closed', function () {
    linkWindows.delete(linkWindow);
    linkWindowMeta.delete(linkWindow);
    linkWindow = null;
  });

  return true;
}

function getOpenLinkWindowsSnapshot() {
  const snapshots = [];
  for (const win of linkWindows) {
    if (!win || win.isDestroyed()) continue;
    const meta = linkWindowMeta.get(win);
    if (!meta || !meta.url) continue;
    let bounds = null;
    try { bounds = win.getBounds(); } catch (err) {}
    snapshots.push({
      id: meta.id || null,
      url: meta.url,
      bounds: bounds || null
    });
  }
  return snapshots;
}

function openWorkspaceById(workspaceId) {
  if (!workspaceId) return false;
  const list = Array.isArray(appSettings.workspaces) ? appSettings.workspaces : [];
  const workspace = list.find((entry) => String(entry.id) === String(workspaceId));
  if (!workspace || !Array.isArray(workspace.items)) return false;

  const openById = new Map();
  const openByUrl = new Map();
  for (const win of linkWindows) {
    if (!win || win.isDestroyed()) continue;
    const meta = linkWindowMeta.get(win);
    if (!meta || !meta.url) continue;
    if (meta.id) openById.set(String(meta.id), win);
    openByUrl.set(String(meta.url), win);
  }

  workspace.items.forEach((item) => {
    if (!item || !item.url) return;
    const existing = (item.id && openById.get(String(item.id))) || openByUrl.get(String(item.url));
    if (existing && !existing.isDestroyed()) {
      if (item.bounds) {
        try { existing.setBounds(item.bounds); } catch (err) {}
      }
      try { existing.focus(); } catch (err) {}
      return;
    }
    openLinkWindow(item.id || null, item.url, { bounds: item.bounds || null });
  });

  try {
    workspace.lastOpenedAt = new Date().toISOString();
    appSettings.workspaces = list.map((entry) => entry.id === workspace.id ? workspace : entry);
    if (appSettings.persistSettings) saveSettings();
  } catch (err) {}

  return true;
}

ipcMain.handle('open-link', (event, idOrUrl, maybeUrl, options) => {
  return openLinkWindow(idOrUrl, maybeUrl, options);
});

ipcMain.on('perf:renderer-ready', (event, sinceMs) => {
  if (PERF_BENCH) {
    logPerf('renderer-ready (ipc)');
    if (typeof sinceMs === 'number' && !Number.isNaN(sinceMs)) {
      console.log(`[perf] renderer-ready (renderer): ${sinceMs.toFixed(2)} ms`);
    }
  }
  if (typeof sinceMs === 'number' && !Number.isNaN(sinceMs)) {
    pushPerfEvent('renderer-ready', { ms: Number(sinceMs.toFixed(2)) }, 'renderer');
  } else {
    pushPerfEvent('renderer-ready', null, 'renderer');
  }
});

ipcMain.on('perf:event', (event, payload) => {
  if (!payload || !payload.type) return;
  pushPerfEvent(payload.type, payload.payload || null, 'renderer');
});

ipcMain.handle('perf-history', () => {
  return perfEvents.slice();
});

ipcMain.handle('link-go-back', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  const wc = win.webContents;
  if (wc && wc.canGoBack()) {
    wc.goBack();
    return true;
  }
  return false;
});

ipcMain.handle('link-go-forward', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  const wc = win.webContents;
  if (wc && wc.canGoForward()) {
    wc.goForward();
    return true;
  }
  return false;
});

ipcMain.handle('link-reload', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return false;
  const wc = win.webContents;
  if (!wc) return false;
  try {
    wc.reload();
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('link-open-external', (event, url) => {
  try {
    const target = url || (event.sender ? event.sender.getURL() : '');
    if (!target) return false;
    new URL(target);
    shell.openExternal(target);
    return true;
  } catch (err) {
    console.error('Error opening link externally:', err);
    return false;
  }
});

ipcMain.handle('link-copy-url', (event, url) => {
  try {
    const target = url || (event.sender ? event.sender.getURL() : '');
    if (!target) return false;
    clipboard.writeText(String(target));
    return true;
  } catch (err) {
    console.error('Error copying link url:', err);
    return false;
  }
});

ipcMain.handle('link-copy-selection', (_event, text) => {
  try {
    const selection = typeof text === 'string' ? text : '';
    if (!selection) return false;
    clipboard.writeText(selection);
    return true;
  } catch (err) {
    console.error('Error copying selection:', err);
    return false;
  }
});

ipcMain.handle('get-open-link-windows', () => {
  return getOpenLinkWindowsSnapshot();
});

ipcMain.handle('get-window-layout-snapshot', () => {
  return buildWindowLayoutSnapshot();
});

ipcMain.handle('open-workspace', (event, workspaceId) => {
  return openWorkspaceById(workspaceId);
});

// Try to restore the last opened links when the app launches
function reopenLastLinksIfAvailable() {
  try {
    const lastList = Array.isArray(appSettings.lastOpenedLinks) ? appSettings.lastOpenedLinks : [];
    if (!lastList.length) return;
    const links = getLinksNormalized();
    const byId = new Map();
    for (const l of links) byId.set(Number(l.id), l);

    lastList.forEach(entry => {
      if (!entry || !entry.url) return;
      let targetUrl = entry.url;
      if (entry.id) {
        const found = byId.get(Number(entry.id));
        if (found && found.url) targetUrl = found.url;
      }
      openLinkWindow(entry.id || null, targetUrl);
    });
  } catch (err) { /* ignore */ }
}

// Set opacity for all existing windows
ipcMain.handle('set-app-opacity', (event, value) => {
  try {
    if (typeof value !== 'number') value = parseFloat(value);
    if (isNaN(value)) return false;
    value = Math.max(0, Math.min(1, value));
    appOpacity = value;
    // Mirror to settings and persist if enabled
    appSettings.appOpacity = appOpacity;
    if (appSettings.persistSettings) saveSettings();

    // Update main window
      // Tell renderers to update their background-only opacity
      BrowserWindow.getAllWindows().forEach(w => {
        try { w.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
      });

    // Ensure link windows honor the new opacity at the native window level
    applyOpacityToLinkWindows();

    return true;
  } catch (err) {
    console.error('Error setting app opacity:', err);
    return false;
  }
});

ipcMain.handle('get-app-opacity', () => {
  return appOpacity;
});

// Settings persistence & helpers
function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) {
      // write defaults if persist setting is enabled
      fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
      return appSettings;
    }
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    appSettings = Object.assign({}, DEFAULT_SETTINGS, parsed);
    appSettings.linkSessionMode = normalizeLinkSessionMode(appSettings.linkSessionMode);
    appSettings.language = normalizeLanguage(appSettings.language);
    // reflect appOpacity from settings
    if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
    // Normalize last opened links (support legacy single object)
    if (appSettings.lastOpenedLink && !Array.isArray(appSettings.lastOpenedLinks)) {
      const legacy = appSettings.lastOpenedLink;
      if (legacy && legacy.url) appSettings.lastOpenedLinks = [{ id: legacy.id || null, url: legacy.url }];
    }
    if (!Array.isArray(appSettings.lastOpenedLinks)) appSettings.lastOpenedLinks = [];
    if (!Array.isArray(appSettings.workspaces)) appSettings.workspaces = [];
    // Keep launch-on-startup in sync with OS login item
    if (typeof appSettings.launchOnStartup !== 'boolean') {
      appSettings.launchOnStartup = getLaunchOnStartupState();
      if (appSettings.persistSettings) saveSettings();
    } else {
      setLaunchOnStartup(appSettings.launchOnStartup);
    }
    try { ensureLinksFileExists(getDataFilePath()); } catch (err) {}
    return appSettings;
  } catch (err) {
    console.error('Error loading settings:', err);
    appSettings = Object.assign({}, DEFAULT_SETTINGS);
    try { ensureLinksFileExists(defaultDataFile); } catch (e) {}
    return appSettings;
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

// Manage OS-level login item so the app can start with the computer
function setLaunchOnStartup(enabled) {
  try {
    if (typeof app.setLoginItemSettings !== 'function') return false;
    const opts = { openAtLogin: !!enabled, path: process.execPath };
    // Avoid duplicate launches with portable builds by passing no args
    if (process.platform === 'win32') opts.args = [];
    app.setLoginItemSettings(opts);
    return true;
  } catch (err) {
    console.error('Error updating launch on startup:', err);
    return false;
  }
}

function getLaunchOnStartupState() {
  try {
    if (typeof app.getLoginItemSettings !== 'function') return !!appSettings.launchOnStartup;
    const info = app.getLoginItemSettings();
    return !!(info && info.openAtLogin);
  } catch (err) {
    return !!appSettings.launchOnStartup;
  }
}

ipcMain.handle('get-setting', (event, key) => {
  if (!key) return null;
  return appSettings[key];
});

ipcMain.handle('get-all-settings', () => {
  return appSettings;
});

ipcMain.handle('read-locale', (event, lang) => {
  try {
    const normalized = normalizeLanguage(lang);
    const file = path.join(__dirname, 'locales', `${normalized}.json`);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    return null;
  }
});

ipcMain.handle('set-setting', (event, key, value) => {
  if (!key) return false;
  let nextValue = value;
  if (key === 'appDisplayName') {
    const normalized = sanitizeString(value);
    nextValue = normalized || DEFAULT_SETTINGS.appDisplayName;
  }
  if (key === 'customDataFile') {
    const normalized = (typeof value === 'string') ? value.trim() : '';
    nextValue = normalized || null;
    try {
      ensureLinksFileExists(nextValue || defaultDataFile);
    } catch (err) {
      return false;
    }
  }
  if (key === 'backgroundImagePath') {
    const normalized = (typeof value === 'string') ? value.trim() : '';
    if (normalized && !fs.existsSync(normalized)) return false;
    nextValue = normalized || null;
  }
  if (key === 'workspaces') {
    if (!Array.isArray(value)) return false;
    nextValue = value;
  }
  if (key === 'linkSessionMode') {
    nextValue = normalizeLinkSessionMode(value);
  }
  if (key === 'language') {
    nextValue = normalizeLanguage(value);
  }
  appSettings[key] = nextValue;
  // Persist settings if enabled
  if (appSettings.persistSettings) saveSettings();

  // react to certain setting changes immediately
  try {
    if (key === 'alwaysOnTop') {
      // update main window
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(!!value);
      if (chatWindow && !chatWindow.isDestroyed()) chatWindow.setAlwaysOnTop(!!value);
      if (perfWindow && !perfWindow.isDestroyed()) perfWindow.setAlwaysOnTop(!!value);
      // update link windows
      for (const win of linkWindows) {
        if (win && !win.isDestroyed()) win.setAlwaysOnTop(!!value);
      }
    }

    if (key === 'customDataFile') {
      initializeLinksStorage();
      notifyLinksChanged();
    }

    if (key === 'appOpacity') {
      // keep appOpacity in sync
      const v = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(v)) {
        appOpacity = Math.max(0, Math.min(1, v));
        // Notify renderers to update their background opacity (main renderer and link preloads will react)
        if (mainWindow && !mainWindow.isDestroyed()) {
          try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
        }
        for (const win of linkWindows) {
          if (!win || win.isDestroyed()) continue;
          try {
            win.webContents.send('app-opacity-changed', appOpacity);
          } catch (e) {}
        }
        try { applyOpacityToLinkWindows(); } catch (e) {}
      }
    }

    if (key === 'nativeTransparency') {
      try { applyOpacityToLinkWindows(); } catch (e) {}
    }

    if (key === 'launchOnStartup') {
      setLaunchOnStartup(!!value);
    }

    if (key === 'telemetryEnabled') {
      applyTelemetryState(!!value);
    }

    if (key === 'developerMode') {
      if (value) openPerfWindow();
      else closePerfWindow();
    }
  } catch (err) { /* ignore */ }

  // If folder sync settings changed, start/stop watcher accordingly
  try {
    if (key === 'useFolderSync' || key === 'syncFolder') {
      if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher();
      else stopSyncWatcher();
    }
  } catch (err) {}
  try {
    if (key === 'useFolderSync' && appSettings.useFolderSync && appSettings.syncFolder) {
      // push current local links into sync file so the chosen folder has the latest state
      try { const latest = getLinksNormalized(); saveLinks(latest); } catch (e) {}
    }
  } catch (err) {}

  // Broadcast change to all windows
  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('setting-changed', key, appSettings[key]); } catch (e) {}
  });

  return true;
});

// Expose a reset endpoint
ipcMain.handle('reset-settings', () => {
  appSettings = Object.assign({}, DEFAULT_SETTINGS);
  saveSettings();
  try { ensureLinksFileExists(defaultDataFile); } catch (e) {}
  // Also reset OS login item toggle
  try { setLaunchOnStartup(!!appSettings.launchOnStartup); } catch (e) {}
  // Clear any remembered last-opened links
  try { appSettings.lastOpenedLinks = []; } catch (e) {}
  try { applyTelemetryState(!!appSettings.telemetryEnabled); } catch (e) {}

  // apply to windows
  try { appOpacity = appSettings.appOpacity; } catch (e) {}
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
      mainWindow.webContents.send('app-opacity-changed', appOpacity);
    } catch (e) {}
  }
  if (perfWindow && !perfWindow.isDestroyed()) {
    try {
      perfWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
    } catch (e) {}
  }
  for (const win of linkWindows) {
    if (!win || win.isDestroyed()) continue;
    try {
      win.setAlwaysOnTop(appSettings.alwaysOnTop);
      win.webContents.send('app-opacity-changed', appOpacity);
    } catch (e) {}
  }
  try { applyOpacityToLinkWindows(); } catch (e) {}

  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('settings-reset', appSettings); } catch (e) {}
  });
  try { notifyLinksChanged(); } catch (e) {}
  closePerfWindow();

  return appSettings;
});

// Start the sync watcher for syncFolder if enabled
function startSyncWatcher() {
  try {
    stopSyncWatcher();
    const syncPath = getSyncFilePath();
    if (!syncPath) return;
    // initialize lastSyncUpdatedAt from existing file
    try {
      if (fs.existsSync(syncPath)) {
        const data = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(data);
        lastSyncUpdatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
      }
    } catch (err) { lastSyncUpdatedAt = 0; }

    // Use fs.watchFile for robust cross-platform polling
    fs.watchFile(syncPath, { interval: 1500 }, (curr, prev) => {
      try {
        if (!fs.existsSync(syncPath)) return;
        const raw = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(raw);
        const updatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
        const remoteLinks = (parsed && Array.isArray(parsed.links)) ? parsed.links : [];
        if (updatedAt && updatedAt > lastSyncUpdatedAt) {
          // Update local copy and notify renderers
          const normalized = normalizeLinkCollection(remoteLinks).normalized;
          try {
            const file = getDataFilePath();
            ensureLinksFileExists(file);
            fs.writeFileSync(file, JSON.stringify(normalized, null, 2));
          } catch (err) {}
          lastSyncUpdatedAt = updatedAt;
          scheduleBackgroundJobsForLinks(normalized);
          notifyLinksChanged();
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    syncWatcher = true;
  } catch (err) {
    console.error('Error starting sync watcher:', err);
  }
}

function stopSyncWatcher() {
  try {
    const syncPath = getSyncFilePath();
    if (syncPath && fs.existsSync(syncPath)) {
      try { fs.unwatchFile(syncPath); } catch (e) {}
    }
    syncWatcher = null;
    lastSyncUpdatedAt = 0;
  } catch (err) {}
}

// IPC: open folder picker for user to choose a sync folder
ipcMain.handle('choose-sync-folder', async () => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      const chosen = res.filePaths[0];
      appSettings.syncFolder = chosen;
      if (appSettings.persistSettings) saveSettings();
      // start watcher if enabled
      if (appSettings.useFolderSync) startSyncWatcher();
      return chosen;
    }
    return null;
  } catch (err) {
    console.error('Error choosing sync folder:', err);
    return null;
  }
});

ipcMain.handle('get-sync-folder', () => {
  return appSettings.syncFolder || null;
});

ipcMain.handle('choose-links-file', async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'promptToCreate'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: getDataFilePath()
    });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      return res.filePaths[0];
    }
    return null;
  } catch (err) {
    console.error('Error choosing links file:', err);
    return null;
  }
});

ipcMain.handle('choose-background-image', async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
      defaultPath: app.getPath('pictures')
    });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      return res.filePaths[0];
    }
    return null;
  } catch (err) {
    console.error('Error choosing background image:', err);
    return null;
  }
});

ipcMain.handle('get-default-links-file', () => {
  return defaultDataFile;
});

ipcMain.handle('reveal-links-file', () => {
  try {
    const target = getDataFilePath();
    if (target) shell.showItemInFolder(target);
    return target || null;
  } catch (err) {
    console.error('Error revealing links file:', err);
    return null;
  }
});

// Ensure watcher starts on app ready if enabled
app.on('ready', () => {
  try { if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher(); } catch (e) {}
});

function initAutoUpdater() {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.on('error', (err) => {
    console.error('Auto update error:', err && err.message ? err.message : err);
  });
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error('Auto update check failed:', err && err.message ? err.message : err);
  });
}
