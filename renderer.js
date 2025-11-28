const urlInput = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const addBtn = document.getElementById('addBtn');
const linksList = document.getElementById('linksList');
const emptyState = document.getElementById('emptyState');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const opacityRange = document.getElementById('opacityRange');
const opacityVal = document.getElementById('opacityVal');

// Load links on startup
loadLinks();

// Event listeners
addBtn.addEventListener('click', addLink);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addLink();
  }
});

titleInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addLink();
  }
});

minimizeBtn.addEventListener('click', () => {
  window.electron.minimizeWindow();
});

closeBtn.addEventListener('click', () => {
  window.electron.closeWindow();
});

// Settings button toggles the options panel
settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (settingsPanel.classList.contains('hidden')) settingsPanel.classList.remove('hidden');
  else settingsPanel.classList.add('hidden');
});

// Close settings panel if user clicks outside
document.addEventListener('click', (e) => {
  if (!settingsPanel.classList.contains('hidden') && !settingsPanel.contains(e.target) && e.target !== settingsBtn) {
    settingsPanel.classList.add('hidden');
  }
});

// Initialize opacity control
async function initOpacityControl() {
  try {
    if (!opacityRange) return;
    let current = 1.0;
    if (window.electron && typeof window.electron.getAppOpacity === 'function') {
      const val = await window.electron.getAppOpacity();
      if (typeof val === 'number') current = val;
    }
    opacityRange.value = current;
    opacityVal.innerText = Math.round(current * 100) + '%';

    opacityRange.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      opacityVal.innerText = Math.round(v * 100) + '%';
    });

    opacityRange.addEventListener('change', async (e) => {
      const v = parseFloat(e.target.value);
      if (window.electron && typeof window.electron.setAppOpacity === 'function') {
        await window.electron.setAppOpacity(v);
      }
    });

    // Listen for changes broadcast from the main process
    if (window.electron && typeof window.electron.onAppOpacityChanged === 'function') {
      window.electron.onAppOpacityChanged((val) => {
        try {
          opacityRange.value = val;
          opacityVal.innerText = Math.round(val * 100) + '%';
        } catch (err) {}
      });
    }
  } catch (err) {
    // ignore if APIs not present
  }
}

initOpacityControl();

// Resizers
const resizers = document.querySelectorAll('.resizer');

// Mouse-based resizing for frameless window
resizers.forEach(resizer => {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startBounds = null;
  const edge = resizer.dataset.edge;

  const onMouseMove = async (e) => {
    if (!isResizing || !startBounds) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const bounds = Object.assign({}, startBounds);

    // Adjust bounds based on which edge/corner is being dragged
    if (edge.includes('e')) {
      bounds.width = Math.max(200, startBounds.width + dx);
    }
    if (edge.includes('s')) {
      bounds.height = Math.max(120, startBounds.height + dy);
    }
    if (edge.includes('w')) {
      bounds.width = Math.max(200, startBounds.width - dx);
      bounds.x = startBounds.x + dx;
    }
    if (edge.includes('n')) {
      bounds.height = Math.max(120, startBounds.height - dy);
      bounds.y = startBounds.y + dy;
    }

    await window.windowManager.setBounds(bounds);
  };

  resizer.addEventListener('mousedown', async (ev) => {
    ev.preventDefault();
    isResizing = true;
    startX = ev.clientX;
    startY = ev.clientY;
    startBounds = await window.windowManager.getBounds();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', () => {
      isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
  });
});

// Keyboard resize now handled in preload for consistent behavior across windows

async function loadLinks() {
  const links = await window.electron.getLinks();
  renderLinks(links);
}

async function addLink() {
  const url = urlInput.value.trim();
  const title = titleInput.value.trim();

  if (!url) {
    alert('Please enter a URL');
    return;
  }

  try {
    // Validate URL
    new URL(url);
  } catch (error) {
    alert('Please enter a valid URL');
    return;
  }

  const link = {
    url: url,
    title: title
  };

  await window.electron.addLink(link);
  urlInput.value = '';
  titleInput.value = '';
  urlInput.focus();
  loadLinks();
}

async function deleteLink(id) {
  if (confirm('Delete this link?')) {
    await window.electron.deleteLink(id);
    loadLinks();
  }
}

function renderLinks(links) {
  linksList.innerHTML = '';

  if (links.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  links.forEach(link => {
    const linkElement = document.createElement('div');
    linkElement.className = 'link-item';
    linkElement.innerHTML = `
      <div class="link-content" onclick="window.electron.openLink('${link.url}')">
        <div class="link-title">${link.title}</div>
        <div class="link-url">${link.url}</div>
      </div>
      <button class="delete-btn" onclick="deleteLink(${link.id})">Delete</button>
    `;
    linksList.appendChild(linkElement);
  });
}
