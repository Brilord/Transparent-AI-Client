const { ipcRenderer } = require('electron');

// Enable dragging for link windows via JS
let isDragging = false;
let startX = 0;
let startY = 0;

document.addEventListener('mousedown', (e) => {
  // Allow dragging from top 40px of window
  if (e.clientY < 40) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    ipcRenderer.send('drag-window', { deltaX, deltaY });
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

document.addEventListener('mouseleave', () => {
  isDragging = false;
});

// Insert resizers into external pages so users can resize link windows
// Cache latest app opacity messages and update overlay when possible
let __latestAppOpacity = null;
ipcRenderer.on('app-opacity-changed', (event, value) => {
  __latestAppOpacity = value;
  try {
    const overlay = document.getElementById('__pl_bg_overlay');
    if (overlay) {
      const alpha = Math.max(0, Math.min(1, value * 0.06));
      overlay.style.background = `rgba(255,255,255, ${alpha})`;
    }
  } catch (e) {}
});

window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create a background overlay element (so we can make background translucent without affecting page content)
    const ensureOverlay = async () => {
      try {
        let val = 1.0;
        try { const v = await ipcRenderer.invoke('get-app-opacity'); if (typeof v === 'number') val = v; } catch (e) {}
        // Use a subtle multiplier so full slider (1.0) maps to a light background alpha
        const alpha = Math.max(0, Math.min(1, val * 0.06));
        let overlay = document.getElementById('__pl_bg_overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = '__pl_bg_overlay';
          overlay.style.position = 'fixed';
          overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '-9999';
          // insert at start so it's typically behind page content
          document.documentElement.insertBefore(overlay, document.documentElement.firstChild);
        }
        // Use a slightly tinted frosted overlay and backdrop blur to simulate acrylic
        overlay.style.background = `linear-gradient(180deg, rgba(255,255,255, ${Math.max(0.02, alpha)}), rgba(255,255,255, ${Math.max(0.01, alpha * 0.7)}))`;
        // Backdrop blur of the page behind overlay creates a frosted effect
        overlay.style.backdropFilter = `blur(${Math.max(4, Math.round(alpha * 40))}px) saturate(120%)`;
        overlay.style.webkitBackdropFilter = overlay.style.backdropFilter;
      } catch (err) { /* ignore overlay failures */ }
    };

    // Apply initial overlay (use last message if received)
    if (__latestAppOpacity !== null) {
      try { const overlay = document.getElementById('__pl_bg_overlay'); if (!overlay) { await ensureOverlay(); } else { const alpha = Math.max(0, Math.min(1, __latestAppOpacity * 0.06)); overlay.style.background = `rgba(255,255,255, ${alpha})`; } } catch (e) {}
    } else {
      await ensureOverlay();
    }

    // Listen for future background-only opacity updates
    ipcRenderer.on('app-opacity-changed', (event, value) => {
      try {
        const alpha = Math.max(0, Math.min(1, value * 0.06));
        const overlay = document.getElementById('__pl_bg_overlay');
        if (overlay) {
          overlay.style.background = `linear-gradient(180deg, rgba(255,255,255, ${Math.max(0.02, alpha)}), rgba(255,255,255, ${Math.max(0.01, alpha * 0.7)}))`;
          const blurPx = Math.max(4, Math.round(alpha * 40));
          overlay.style.backdropFilter = `blur(${blurPx}px) saturate(120%)`;
          overlay.style.webkitBackdropFilter = overlay.style.backdropFilter;
        }
      } catch (e) {}
    });

    // Check whether the app settings allow injecting resizers into remote pages
    let inject = true;
    try {
      const val = await ipcRenderer.invoke('get-setting', 'injectResizers');
      if (typeof val === 'boolean') inject = val;
    } catch (err) { /* ignore and default to true */ }
    // only skip resizer injection — overlay is applied regardless
    if (!inject) {
      return;
    }

    const edges = ['n','e','s','w','ne','nw','se','sw'];
    edges.forEach(edge => {
      const el = document.createElement('div');
      el.className = `resizer resizer-${edge}`;
      el.dataset.edge = edge;
      // Basic transparent style to ensure visibility of cursor
      el.style.position = 'fixed';
      el.style.zIndex = 999999;
      el.style.background = 'transparent';
      if (edge === 'n' || edge === 's') { el.style.left = '0'; el.style.right = '0'; el.style.height = '8px'; el.style.cursor = 'ns-resize'; if (edge === 'n') el.style.top = '0'; else el.style.bottom = '0'; }
      if (edge === 'e' || edge === 'w') { el.style.top = '0'; el.style.bottom = '0'; el.style.width = '8px'; el.style.cursor = 'ew-resize'; if (edge === 'e') el.style.right = '0'; else el.style.left = '0'; }
      if (edge === 'ne' || edge === 'nw' || edge === 'se' || edge === 'sw') {
        el.style.width = '12px'; el.style.height = '12px';
        if (edge === 'ne') { el.style.right = '0'; el.style.top = '0'; el.style.cursor = 'nesw-resize'; }
        if (edge === 'nw') { el.style.left = '0'; el.style.top = '0'; el.style.cursor = 'nwse-resize'; }
        if (edge === 'se') { el.style.right = '0'; el.style.bottom = '0'; el.style.cursor = 'nwse-resize'; }
        if (edge === 'sw') { el.style.left = '0'; el.style.bottom = '0'; el.style.cursor = 'nesw-resize'; }
      }
      el.style.pointerEvents = 'auto';
      document.documentElement.appendChild(el);

      // Add handlers that communicate with main to resize
      let resizing = false;
      let sx = 0, sy = 0, startBounds = null;
      el.addEventListener('mousedown', async (ev) => {
        ev.preventDefault();
        resizing = true;
        sx = ev.clientX; sy = ev.clientY;
        startBounds = await ipcRenderer.invoke('get-window-bounds');

        const onMove = async (me) => {
          if (!resizing || !startBounds) return;
          const dx = me.clientX - sx; const dy = me.clientY - sy;
          const bounds = Object.assign({}, startBounds);
          if (edge.includes('e')) bounds.width = Math.max(1, startBounds.width + dx);
          if (edge.includes('s')) bounds.height = Math.max(1, startBounds.height + dy);
          if (edge.includes('w')) { bounds.width = Math.max(1, startBounds.width - dx); bounds.x = startBounds.x + dx; }
          if (edge.includes('n')) { bounds.height = Math.max(1, startBounds.height - dy); bounds.y = startBounds.y + dy; }
          await ipcRenderer.invoke('set-window-bounds', bounds);
        };

        const onUp = () => { resizing = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    });
  } catch (err) { /* ignore injection errors on some pages */ }
});

// Keyboard resize for link windows: Ctrl+Alt + Arrows
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
          try { const enabled = await ipcRenderer.invoke('get-setting', 'leftQuarterShortcut'); if (enabled) { await ipcRenderer.invoke('snap-window', 'left-quarter'); e.preventDefault(); } } catch (err) {}
          return;
        }
        case '7': {
          // left 1/3
          try { const enabled = await ipcRenderer.invoke('get-setting', 'leftThirdShortcut'); if (enabled) { await ipcRenderer.invoke('snap-window', 'left-third'); e.preventDefault(); } } catch (err) {}
          return;
        }
      }
    }
  } catch (err) {
    // ignore
  }
});
