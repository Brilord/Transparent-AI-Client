const { ipcRenderer } = require('electron');

// Link windows use the OS chrome for dragging/resizing; keep keyboard helpers for precision moves.

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

    // Snapping with numbers (Ctrl+Alt + 1..5)
    if (e.ctrlKey && e.altKey && !e.shiftKey) {
      switch (e.key) {
        case '1': await ipcRenderer.invoke('snap-window', 'left'); e.preventDefault(); return;
        case '2': await ipcRenderer.invoke('snap-window', 'right'); e.preventDefault(); return;
        case '3': await ipcRenderer.invoke('snap-window', 'top'); e.preventDefault(); return;
        case '4': await ipcRenderer.invoke('snap-window', 'bottom'); e.preventDefault(); return;
        case '5': await ipcRenderer.invoke('snap-window', 'center'); e.preventDefault(); return;
        case '6': {
          // left 1/4
          try {
            const enabled = await ipcRenderer.invoke('get-setting', 'leftQuarterShortcut');
            if (enabled) { await ipcRenderer.invoke('snap-window', 'left-quarter'); e.preventDefault(); }
          } catch (err) {}
          return;
        }
        case '7': {
          // left 1/3
          try {
            const enabled = await ipcRenderer.invoke('get-setting', 'leftThirdShortcut');
            if (enabled) { await ipcRenderer.invoke('snap-window', 'left-third'); e.preventDefault(); }
          } catch (err) {}
          return;
        }
      }
    }
  } catch (err) {
    // ignore
  }
});

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
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: rgba(248, 250, 255, 0.95) !important;
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
  if (!tryMountReadabilityStyles()) return;
  applyReadabilityVisuals(value);
}

const ensureReadabilityReady = () => {
  if (!tryMountReadabilityStyles()) return;
  if (pendingOpacityValue !== null && pendingOpacityValue !== undefined) {
    applyReadabilityVisuals(pendingOpacityValue);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureReadabilityReady, { once: true });
} else {
  ensureReadabilityReady();
}

ipcRenderer.on('app-opacity-changed', (_event, value) => {
  handleOpacityUpdate(value);
});

(async () => {
  try {
    const currentOpacity = await ipcRenderer.invoke('get-app-opacity');
    handleOpacityUpdate(currentOpacity);
  } catch (err) {
    // ignore inability to fetch opacity
  }
})();
