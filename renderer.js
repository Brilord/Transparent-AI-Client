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
