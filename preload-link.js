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
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check whether the app settings allow injecting resizers into remote pages
    let inject = true;
    try {
      const val = await ipcRenderer.invoke('get-setting', 'injectResizers');
      if (typeof val === 'boolean') inject = val;
    } catch (err) { /* ignore and default to true */ }
    if (!inject) return; // do not inject resizers when disabled

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
          if (edge.includes('e')) bounds.width = Math.max(200, startBounds.width + dx);
          if (edge.includes('s')) bounds.height = Math.max(120, startBounds.height + dy);
          if (edge.includes('w')) { bounds.width = Math.max(200, startBounds.width - dx); bounds.x = startBounds.x + dx; }
          if (edge.includes('n')) { bounds.height = Math.max(120, startBounds.height - dy); bounds.y = startBounds.y + dy; }
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
        bounds.width = Math.max(200, bounds.width - step);
        break;
      case 'ArrowRight':
        bounds.width = bounds.width + step;
        break;
      case 'ArrowUp':
        bounds.height = Math.max(120, bounds.height - step);
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
      }
    }
  } catch (err) {
    // ignore
  }
});
