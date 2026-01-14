const { ipcRenderer } = require('electron');

// Link windows use the OS chrome for dragging/resizing; keep keyboard helpers for precision moves.

const centerWindow = async () => {
  const bounds = await ipcRenderer.invoke('get-window-bounds');
  const workArea = await ipcRenderer.invoke('get-window-work-area');
  if (!bounds || !workArea) return;
  const width = Math.max(1, Math.min(bounds.width, workArea.width));
  const height = Math.max(1, Math.min(bounds.height, workArea.height));
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + (workArea.height - height) / 2);
  await ipcRenderer.invoke('set-window-bounds', { ...bounds, x, y, width, height });
};

const isEditableTarget = (target) => {
  if (!target) return false;
  const tag = String(target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!target.isContentEditable;
};

const snapWindowToThird = async (position) => {
  const workArea = await ipcRenderer.invoke('get-window-work-area');
  if (!workArea) return;
  const width = Math.max(1, Math.round(workArea.width / 3));
  const height = Math.max(1, Math.round(workArea.height));
  let x = workArea.x;
  if (position === 'right') x = workArea.x + width * 2;
  if (position === 'center') x = workArea.x + width;
  const bounds = {
    x: Math.round(x),
    y: Math.round(workArea.y),
    width,
    height
  };
  await ipcRenderer.invoke('set-window-bounds', bounds);
};

const snapWindowToCorner = async (corner) => {
  const workArea = await ipcRenderer.invoke('get-window-work-area');
  if (!workArea) return;
  const width = Math.max(1, Math.round(workArea.width / 2));
  const height = Math.max(1, Math.round(workArea.height / 2));
  const rightX = workArea.x + workArea.width - width;
  const bottomY = workArea.y + workArea.height - height;
  let x = workArea.x;
  let y = workArea.y;
  if (corner.includes('right')) x = rightX;
  if (corner.includes('bottom')) y = bottomY;
  const bounds = {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height
  };
  await ipcRenderer.invoke('set-window-bounds', bounds);
};

// Keyboard resize for link windows: Ctrl+Alt + Arrow keys
document.addEventListener('keydown', async (e) => {
  if (!(e.ctrlKey && e.altKey)) return;
  const step = 20;
  try {
    const bounds = await ipcRenderer.invoke('get-window-bounds');
    if (!bounds) return;
    switch (e.key) {
      case 'ArrowLeft':
        bounds.width = Math.max(1, bounds.width - step);
        break;
      case 'ArrowRight':
        bounds.width = bounds.width + step;
        break;
      case 'ArrowUp':
        bounds.height = Math.max(1, bounds.height - step);
        break;
      case 'ArrowDown':
        bounds.height = bounds.height + step;
        break;
      default:
        return;
    }
    e.preventDefault();
    await ipcRenderer.invoke('set-window-bounds', bounds);
  } catch (err) {
    // ignore
  }
});

// Additional keybindings for link windows
document.addEventListener('keydown', async (e) => {
  try {
    // Center window: Ctrl+Alt+C
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      await centerWindow();
      return;
    }

    // Navigate back/forward (macOS): Cmd+[ / Cmd+]
    if (e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (e.key === '[' || e.code === 'BracketLeft') {
        e.preventDefault();
        await ipcRenderer.invoke('link-go-back');
        return;
      }
      if (e.key === ']' || e.code === 'BracketRight') {
        e.preventDefault();
        await ipcRenderer.invoke('link-go-forward');
        return;
      }
    }

    // Navigate back/forward: Alt+Left / Alt+Right
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        await ipcRenderer.invoke('link-go-back');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        await ipcRenderer.invoke('link-go-forward');
        return;
      }
    }

    // Link actions: Alt+R/B/C/S (avoid hijacking form inputs)
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && !isEditableTarget(e.target)) {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        await ipcRenderer.invoke('link-reload');
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        await ipcRenderer.invoke('link-open-external', location.href);
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        await ipcRenderer.invoke('link-copy-url', location.href);
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        const selection = getSelectedText();
        e.preventDefault();
        if (!selection || !selection.trim()) return;
        await ipcRenderer.invoke('link-copy-selection', selection);
        return;
      }
    }

    // Snap left third: Alt+4
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4')) {
      e.preventDefault();
      await snapWindowToThird('left');
      return;
    }

    // Snap right third: Alt+6
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && (e.key === '6' || e.code === 'Digit6' || e.code === 'Numpad6')) {
      e.preventDefault();
      await snapWindowToThird('right');
      return;
    }

    // Snap corners: Alt+7/9/1/3
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      if (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7') {
        e.preventDefault();
        await snapWindowToCorner('top-left');
        return;
      }
      if (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9') {
        e.preventDefault();
        await snapWindowToCorner('top-right');
        return;
      }
      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        await snapWindowToCorner('bottom-left');
        return;
      }
      if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault();
        await snapWindowToCorner('bottom-right');
        return;
      }
    }

    // Move window: Ctrl+Alt+Shift + Arrow
    if (e.ctrlKey && e.altKey && e.shiftKey) {
      const moveStep = 20;
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowLeft': dx = -moveStep; break;
        case 'ArrowRight': dx = moveStep; break;
        case 'ArrowUp': dy = -moveStep; break;
        case 'ArrowDown': dy = moveStep; break;
        default: return;
      }
      e.preventDefault();
      await ipcRenderer.invoke('move-window', { dx, dy });
      return;
    }

    // Toggle maximize: Ctrl+Alt+M
    if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      await ipcRenderer.invoke('toggle-maximize');
      return;
    }

  } catch (err) {
    // ignore
  }
});

// Mouse back/forward buttons (XButton1/XButton2)
document.addEventListener('mouseup', async (e) => {
  if (e.button !== 3 && e.button !== 4) return;
  try {
    if (e.button === 3) await ipcRenderer.invoke('link-go-back');
    if (e.button === 4) await ipcRenderer.invoke('link-go-forward');
    e.preventDefault();
  } catch (err) {
    // ignore
  }
});

// Lightweight nav overlay ----------------------------------------------------
const NAV_STYLE_ID = 'plana-link-nav-style';
const NAV_ID = 'plana-link-nav';
let navHideTimer = null;

function mountNavStyles() {
  if (!document || !document.head) return false;
  if (document.getElementById(NAV_STYLE_ID)) return true;
  const styleEl = document.createElement('style');
  styleEl.id = NAV_STYLE_ID;
  styleEl.textContent = `
#${NAV_ID} {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(12, 16, 26, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px) saturate(140%);
  z-index: 2147483646;
  transition: opacity 180ms ease, transform 180ms ease;
}
#${NAV_ID}.plana-nav-hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
  pointer-events: none;
}
#${NAV_ID} button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
}
#${NAV_ID} button:hover {
  background: rgba(255, 255, 255, 0.18);
}
`;
  document.head.appendChild(styleEl);
  return true;
}

function createNavBar() {
  if (!document || document.getElementById(NAV_ID)) return;
  if (!mountNavStyles()) return;
  const nav = document.createElement('div');
  nav.id = NAV_ID;
  nav.className = 'plana-nav-hidden';
  nav.innerHTML = `
    <button data-action="back">Back</button>
    <button data-action="forward">Forward</button>
    <button data-action="reload">Reload</button>
    <button data-action="browser">Browser</button>
    <button data-action="copy">Copy URL</button>
    <button data-action="copy-selection">Copy text</button>
  `;

  nav.addEventListener('click', async (e) => {
    const target = e.target;
    if (!target || !target.dataset) return;
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'back') await ipcRenderer.invoke('link-go-back');
    if (action === 'forward') await ipcRenderer.invoke('link-go-forward');
    if (action === 'reload') await ipcRenderer.invoke('link-reload');
    if (action === 'browser') await ipcRenderer.invoke('link-open-external', location.href);
    if (action === 'copy') {
      await ipcRenderer.invoke('link-copy-url', location.href);
      const original = target.textContent;
      target.textContent = 'Copied';
      setTimeout(() => { target.textContent = original; }, 900);
    }
    if (action === 'copy-selection') {
      const selection = getSelectedText();
      const original = target.textContent;
      if (!selection || !selection.trim()) {
        target.textContent = 'Select text';
        setTimeout(() => { target.textContent = original; }, 900);
        return;
      }
      const ok = await ipcRenderer.invoke('link-copy-selection', selection);
      target.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { target.textContent = original; }, 900);
    }
  });

  nav.addEventListener('mouseenter', () => showNav(nav));
  nav.addEventListener('mouseleave', () => scheduleHideNav(nav, 600));
  document.documentElement.appendChild(nav);
}

function getSelectedText() {
  try {
    const active = document.activeElement;
    if (active) {
      const tag = String(active.tagName || '').toUpperCase();
      if (tag === 'TEXTAREA') {
        const start = active.selectionStart;
        const end = active.selectionEnd;
        if (typeof start === 'number' && typeof end === 'number' && end > start) {
          return String(active.value || '').slice(start, end);
        }
      }
      if (tag === 'INPUT') {
        const type = String(active.type || '').toLowerCase();
        const allowed = new Set(['text', 'search', 'url', 'tel', 'email', 'number', 'password']);
        if (allowed.has(type)) {
          const start = active.selectionStart;
          const end = active.selectionEnd;
          if (typeof start === 'number' && typeof end === 'number' && end > start) {
            return String(active.value || '').slice(start, end);
          }
        }
      }
    }
  } catch (err) {
    // fall through to window selection
  }
  try {
    const selection = window.getSelection ? window.getSelection() : null;
    return selection ? selection.toString() : '';
  } catch (err) {
    return '';
  }
}

function showNav(navEl) {
  if (!navEl) return;
  navEl.classList.remove('plana-nav-hidden');
  if (navHideTimer) {
    clearTimeout(navHideTimer);
    navHideTimer = null;
  }
}

function scheduleHideNav(navEl, delay = 1200) {
  if (!navEl) return;
  if (navHideTimer) clearTimeout(navHideTimer);
  navHideTimer = setTimeout(() => {
    if (navEl.matches(':hover')) return;
    navEl.classList.add('plana-nav-hidden');
  }, delay);
}

document.addEventListener('mousemove', (e) => {
  const navEl = document.getElementById(NAV_ID);
  if (!navEl) return;
  if (e.clientY <= 28) {
    showNav(navEl);
  } else {
    scheduleHideNav(navEl, 1200);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => createNavBar(), { once: true });
} else {
  createNavBar();
}

// Remote resizer injection ---------------------------------------------------
const REMOTE_RESIZER_CLASS = 'plana-remote-resizer';
const remoteResizerConfig = {
  n: { style: { top: '0', left: '0', right: '0', height: '10px', cursor: 'ns-resize' } },
  s: { style: { bottom: '0', left: '0', right: '0', height: '10px', cursor: 'ns-resize' } },
  e: { style: { top: '0', bottom: '0', right: '0', width: '10px', cursor: 'ew-resize' } },
  w: { style: { top: '0', bottom: '0', left: '0', width: '10px', cursor: 'ew-resize' } },
  ne: { style: { top: '0', right: '0', width: '16px', height: '16px', cursor: 'nesw-resize' } },
  nw: { style: { top: '0', left: '0', width: '16px', height: '16px', cursor: 'nwse-resize' } },
  se: { style: { bottom: '0', right: '0', width: '16px', height: '16px', cursor: 'nwse-resize' } },
  sw: { style: { bottom: '0', left: '0', width: '16px', height: '16px', cursor: 'nesw-resize' } }
};

let remoteResizersEnabled = false;
const remoteResizerHandles = [];

const startRemoteResize = async (edge, startEvent) => {
  startEvent.preventDefault();
  const startBounds = await ipcRenderer.invoke('get-window-bounds');
  if (!startBounds) return;
  const startX = startEvent.clientX;
  const startY = startEvent.clientY;

  const onMouseMove = async (moveEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    const bounds = Object.assign({}, startBounds);
    if (edge.includes('e')) bounds.width = Math.max(1, startBounds.width + dx);
    if (edge.includes('s')) bounds.height = Math.max(1, startBounds.height + dy);
    if (edge.includes('w')) {
      bounds.width = Math.max(1, startBounds.width - dx);
      bounds.x = startBounds.x + dx;
    }
    if (edge.includes('n')) {
      bounds.height = Math.max(1, startBounds.height - dy);
      bounds.y = startBounds.y + dy;
    }
    await ipcRenderer.invoke('set-window-bounds', bounds);
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp, { once: true });
};

function destroyRemoteResizers() {
  remoteResizerHandles.splice(0).forEach(({ element, onMouseDown }) => {
    if (element && onMouseDown) element.removeEventListener('mousedown', onMouseDown);
    if (element && element.parentNode) element.parentNode.removeChild(element);
  });
}

function mountRemoteResizers() {
  if (!remoteResizersEnabled || remoteResizerHandles.length) return;
  const target = document.body || document.documentElement;
  if (!target) {
    document.addEventListener('DOMContentLoaded', () => mountRemoteResizers(), { once: true });
    return;
  }
  Object.keys(remoteResizerConfig).forEach((edge) => {
    const config = remoteResizerConfig[edge];
    const element = document.createElement('div');
    element.dataset.edge = edge;
    element.className = `${REMOTE_RESIZER_CLASS} ${REMOTE_RESIZER_CLASS}-${edge}`;
    const style = Object.assign({
      position: 'fixed',
      zIndex: '2147483646',
      background: 'transparent',
      pointerEvents: 'auto',
      userSelect: 'none',
      touchAction: 'none'
    }, config.style);
    Object.keys(style).forEach((key) => {
      element.style[key] = style[key];
    });
    const onMouseDown = (event) => startRemoteResize(edge, event);
    element.addEventListener('mousedown', onMouseDown);
    target.appendChild(element);
    remoteResizerHandles.push({ element, onMouseDown });
  });
}

function updateRemoteResizersState(enabled) {
  remoteResizersEnabled = !!enabled;
  if (!remoteResizersEnabled) {
    destroyRemoteResizers();
  } else {
    mountRemoteResizers();
  }
}

ipcRenderer.on('setting-changed', (_event, key, value) => {
  if (key === 'injectResizers') {
    updateRemoteResizersState(!!value);
  }
});

(async () => {
  try {
    const enabled = await ipcRenderer.invoke('get-setting', 'injectResizers');
    updateRemoteResizersState(enabled !== false);
  } catch (err) {
    // ignore
  }
})();

// Adaptive readability helpers ------------------------------------------------
const READABILITY_STYLE_ID = 'plana-link-readability-style';
const READABILITY_STYLE_CONTENT = `
:root {
  --plana-link-overlay-alpha: 0.68;
  --plana-link-blur: 18px;
  --plana-link-base-font-scale: 1rem;
}
html.plana-readability {
  color-scheme: dark;
}
html.plana-readability body {
  position: relative;
  z-index: 0;
  background: rgba(5, 8, 18, var(--plana-link-overlay-alpha)) !important;
  color: rgba(248, 250, 255, 0.96) !important;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.55);
  letter-spacing: 0.01em;
  line-height: 1.55;
  font-size: var(--plana-link-base-font-scale);
  -webkit-font-smoothing: antialiased;
  backdrop-filter: blur(calc(var(--plana-link-blur) * 0.3));
}
html.plana-readability body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(circle at 22% 18%, rgba(110, 160, 255, 0.15), transparent 45%), radial-gradient(circle at 80% 8%, rgba(255, 140, 210, 0.08), transparent 40%), rgba(3, 5, 12, var(--plana-link-overlay-alpha));
  filter: blur(var(--plana-link-blur));
}
html.plana-readability p,
html.plana-readability li,
html.plana-readability label,
html.plana-readability span,
html.plana-readability td,
html.plana-readability th {
  color: inherit !important;
  font-size: calc(var(--plana-link-base-font-scale) * 1.02);
  line-height: 1.65;
}
html.plana-readability h1,
html.plana-readability h2,
html.plana-readability h3,
html.plana-readability h4,
html.plana-readability h5,
html.plana-readability h6 {
  color: #ffffff !important;
  letter-spacing: 0.04em;
  text-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
html.plana-readability a {
  color: #8fd1ff !important;
  text-decoration-color: rgba(143, 209, 255, 0.7) !important;
}
html.plana-readability a:hover {
  color: #d3ecff !important;
  text-decoration-color: rgba(211, 236, 255, 0.9) !important;
}
html.plana-readability ::selection {
  background: rgba(143, 209, 255, 0.35);
  color: #05080e;
}
html.plana-readability img,
html.plana-readability video,
html.plana-readability canvas {
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(2, 4, 8, 0.65);
}
html.plana-readability button,
html.plana-readability input,
html.plana-readability textarea,
html.plana-readability select {
  background: rgba(10, 14, 22, 0.68) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: rgba(248, 250, 255, 0.95) !important;
  caret-color: rgba(248, 250, 255, 0.95) !important;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 8px 24px rgba(3, 4, 8, 0.4);
}
html.plana-readability ::placeholder {
  color: rgba(240, 244, 255, 0.6) !important;
}
html.plana-readability-intensive body {
  color: rgba(255, 255, 255, 0.98) !important;
}
html.plana-readability-intensive *,
html.plana-readability-intensive ::placeholder {
  text-shadow: 0 0 16px rgba(0, 0, 0, 0.65) !important;
}
`;

let readabilityStylesMounted = false;
let pendingOpacityValue = null;
let nativeTransparencyEnabled = false;
let pendingTransparencyValue = null;
let pendingWindowControlsValue = true;

const TRANSPARENT_STYLE_ID = 'plana-link-transparent-style';
const TRANSPARENT_STYLE_CONTENT = `
html, body {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
body::before,
body::after,
html::before,
html::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  opacity: 1 !important;
}
* {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
*:before,
*:after,
*::before,
*::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
canvas,
video {
  background: transparent !important;
}
[style*="background"],
[style*="background-color"],
[style*="background-image"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}
body *:not(svg):not(svg *) {
  backdrop-filter: none !important;
}
`;

const WINDOW_BAR_STYLE_ID = 'plana-link-windowbar-style';
const WINDOW_BAR_ID = 'plana-link-windowbar';
const WINDOW_BAR_STYLE_CONTENT = `
#${WINDOW_BAR_ID} {
  position: fixed;
  top: 10px;
  right: 10px;
  left: auto;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 6px;
  border-radius: 12px;
  background: rgba(12, 16, 24, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px) saturate(140%);
  z-index: 2147483647;
  -webkit-app-region: drag;
  user-select: none;
  font-family: "Segoe UI", sans-serif;
  color: rgba(255, 255, 255, 0.85);
  pointer-events: auto;
}
#${WINDOW_BAR_ID} .plana-bar-title {
  display: none;
}
#${WINDOW_BAR_ID} .plana-bar-actions {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}
#${WINDOW_BAR_ID} button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
}
#${WINDOW_BAR_ID} button:hover {
  background: rgba(255, 255, 255, 0.18);
}
#${WINDOW_BAR_ID} button.plana-bar-close:hover {
  background: rgba(255, 80, 80, 0.7);
  border-color: rgba(255, 80, 80, 0.9);
}
`;

function tryMountReadabilityStyles() {
  if (readabilityStylesMounted) return true;
  if (!document) return false;
  const target = document.head || document.documentElement;
  if (!target) return false;
  if (document.getElementById(READABILITY_STYLE_ID)) {
    readabilityStylesMounted = true;
    return true;
  }
  try {
    const styleEl = document.createElement('style');
    styleEl.id = READABILITY_STYLE_ID;
    styleEl.textContent = READABILITY_STYLE_CONTENT;
    target.appendChild(styleEl);
    readabilityStylesMounted = true;
    return true;
  } catch (err) {
    return false;
  }
}

function applyReadabilityVisuals(rawOpacity) {
  if (!document || !document.documentElement) return;
  if (nativeTransparencyEnabled) {
    const docEl = document.documentElement;
    docEl.classList.remove('plana-readability', 'plana-readability-intensive');
    docEl.style.removeProperty('--plana-link-overlay-alpha');
    docEl.style.removeProperty('--plana-link-blur');
    docEl.style.removeProperty('--plana-link-base-font-scale');
    return;
  }
  let numeric = typeof rawOpacity === 'number' ? rawOpacity : parseFloat(rawOpacity);
  if (isNaN(numeric)) numeric = 1;
  const clamped = Math.max(0, Math.min(1, numeric));
  const docEl = document.documentElement;
  const needsReadability = clamped < 0.995;
  if (!needsReadability) {
    docEl.classList.remove('plana-readability', 'plana-readability-intensive');
    docEl.style.removeProperty('--plana-link-overlay-alpha');
    docEl.style.removeProperty('--plana-link-blur');
    docEl.style.removeProperty('--plana-link-base-font-scale');
    return;
  }
  const overlayAlpha = 0.52 + (1 - clamped) * 0.3;
  const blurRadius = 14 + (1 - clamped) * 14;
  const fontScale = 1 + (1 - clamped) * 0.12;
  docEl.classList.add('plana-readability');
  docEl.classList.toggle('plana-readability-intensive', clamped <= 0.35);
  docEl.style.setProperty('--plana-link-overlay-alpha', overlayAlpha.toFixed(3));
  docEl.style.setProperty('--plana-link-blur', blurRadius.toFixed(1) + 'px');
  docEl.style.setProperty('--plana-link-base-font-scale', fontScale.toFixed(3) + 'rem');
}

function handleOpacityUpdate(value) {
  pendingOpacityValue = value;
  if (nativeTransparencyEnabled) {
    applyReadabilityVisuals(value);
    return;
  }
  if (!tryMountReadabilityStyles()) return;
  applyReadabilityVisuals(value);
}

function applyLinkTransparency(enabled) {
  const shouldEnable = !!enabled;
  nativeTransparencyEnabled = shouldEnable;
  pendingTransparencyValue = shouldEnable;
  if (!document || !document.head) return;
  const existing = document.getElementById(TRANSPARENT_STYLE_ID);
  if (!shouldEnable) {
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    return;
  }
  if (existing) return;
  const styleEl = document.createElement('style');
  styleEl.id = TRANSPARENT_STYLE_ID;
  styleEl.textContent = TRANSPARENT_STYLE_CONTENT;
  document.head.appendChild(styleEl);
}

function applyWindowControls(enabled) {
  const shouldEnable = !!enabled;
  pendingWindowControlsValue = shouldEnable;
  if (!document || !document.head || !document.body) return;

  const existingBar = document.getElementById(WINDOW_BAR_ID);
  if (!shouldEnable) {
    if (existingBar && existingBar.parentNode) existingBar.parentNode.removeChild(existingBar);
    const existingStyle = document.getElementById(WINDOW_BAR_STYLE_ID);
    if (existingStyle && existingStyle.parentNode) existingStyle.parentNode.removeChild(existingStyle);
    return;
  }

  if (!document.getElementById(WINDOW_BAR_STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = WINDOW_BAR_STYLE_ID;
    styleEl.textContent = WINDOW_BAR_STYLE_CONTENT;
    document.head.appendChild(styleEl);
  }

  if (existingBar) return;
  const bar = document.createElement('div');
  bar.id = WINDOW_BAR_ID;
  bar.innerHTML = `
    <div class="plana-bar-title">Link Window</div>
    <div class="plana-bar-actions">
      <button class="plana-bar-min" title="Minimize">–</button>
      <button class="plana-bar-max" title="Maximize">□</button>
      <button class="plana-bar-close" title="Close">×</button>
    </div>
  `;

  const minBtn = bar.querySelector('.plana-bar-min');
  const maxBtn = bar.querySelector('.plana-bar-max');
  const closeBtn = bar.querySelector('.plana-bar-close');
  if (minBtn) {
    minBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await ipcRenderer.invoke('minimize-current-window');
    });
  }
  if (maxBtn) {
    maxBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await ipcRenderer.invoke('toggle-maximize');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await ipcRenderer.invoke('close-current-window');
    });
  }

  document.body.appendChild(bar);
}

function ensureLinkTransparencyReady() {
  if (!document || !document.head) return;
  if (pendingTransparencyValue === null || pendingTransparencyValue === undefined) return;
  applyLinkTransparency(pendingTransparencyValue);
}

function ensureLinkWindowControlsReady() {
  if (!document || !document.head || !document.body) return;
  if (pendingWindowControlsValue === null || pendingWindowControlsValue === undefined) return;
  applyWindowControls(pendingWindowControlsValue);
}

const ensureReadabilityReady = () => {
  if (!tryMountReadabilityStyles()) return;
  if (pendingOpacityValue !== null && pendingOpacityValue !== undefined) {
    applyReadabilityVisuals(pendingOpacityValue);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ensureReadabilityReady();
    ensureLinkTransparencyReady();
    ensureLinkWindowControlsReady();
  }, { once: true });
} else {
  ensureReadabilityReady();
  ensureLinkTransparencyReady();
  ensureLinkWindowControlsReady();
}

ipcRenderer.on('app-opacity-changed', (_event, value) => {
  handleOpacityUpdate(value);
});

ipcRenderer.on('setting-changed', (_event, key, value) => {
  if (key === 'nativeTransparency') {
    applyLinkTransparency(!!value);
    applyWindowControls(true);
    handleOpacityUpdate(pendingOpacityValue);
  }
});

(async () => {
  try {
    const currentOpacity = await ipcRenderer.invoke('get-app-opacity');
    handleOpacityUpdate(currentOpacity);
  } catch (err) {
    // ignore inability to fetch opacity
  }
})();

(async () => {
  try {
    const enabled = await ipcRenderer.invoke('get-setting', 'nativeTransparency');
    applyLinkTransparency(!!enabled);
    applyWindowControls(true);
  } catch (err) {
    // ignore
  }
})();
