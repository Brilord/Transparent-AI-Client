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
