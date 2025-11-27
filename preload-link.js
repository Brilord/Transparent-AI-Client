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
