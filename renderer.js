const urlInput = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const addBtn = document.getElementById('addBtn');
const linksList = document.getElementById('linksList');
const emptyState = document.getElementById('emptyState');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');

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
