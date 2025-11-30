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
const alwaysOnTopChk = document.getElementById('alwaysOnTopChk');
const injectResizersChk = document.getElementById('injectResizersChk');
const persistSettingsChk = document.getElementById('persistSettingsChk');
const launchOnStartupChk = document.getElementById('launchOnStartupChk');
const leftQuarterChk = document.getElementById('leftQuarterChk');
const leftThirdChk = document.getElementById('leftThirdChk');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Load links on startup
loadLinks();

let currentLinks = [];

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
    // apply background-only opacity on main window; map slider value to a subtle alpha
    try { document.documentElement.style.setProperty('--bg-opacity', (current * 0.06).toString()); } catch (e) {}
    try { document.documentElement.style.setProperty('--bg-blur', Math.max(8, Math.round(current * 22)) + 'px'); } catch (e) {}

    opacityRange.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      opacityVal.innerText = Math.round(v * 100) + '%';
      try { document.documentElement.style.setProperty('--bg-opacity', (v * 0.06).toString()); } catch (e) {}
      try { document.documentElement.style.setProperty('--bg-blur', Math.max(8, Math.round(v * 22)) + 'px'); } catch (e) {}
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
          try { document.documentElement.style.setProperty('--bg-opacity', (val * 0.06).toString()); } catch (e) {}
          try { document.documentElement.style.setProperty('--bg-blur', Math.max(8, Math.round(val * 22)) + 'px'); } catch (e) {}
        } catch (err) {}
      });
    }
  } catch (err) {
    // ignore if APIs not present
  }
}

initOpacityControl();

// Initialize other settings UI
async function initSettingsUI() {
  try {
    if (!window.electron || typeof window.electron.getAllSettings !== 'function') return;
    const s = await window.electron.getAllSettings();
    if (!s) return;

    // Set UI states
    if (typeof s.alwaysOnTop === 'boolean') alwaysOnTopChk.checked = s.alwaysOnTop;
    if (typeof s.injectResizers === 'boolean') injectResizersChk.checked = s.injectResizers;
    if (typeof s.persistSettings === 'boolean') persistSettingsChk.checked = s.persistSettings;
    if (typeof s.launchOnStartup === 'boolean') launchOnStartupChk.checked = s.launchOnStartup;
    if (typeof s.leftQuarterShortcut === 'boolean') leftQuarterChk.checked = s.leftQuarterShortcut;
    if (typeof s.leftThirdShortcut === 'boolean') leftThirdChk.checked = s.leftThirdShortcut;

    // Wire up change listeners
    alwaysOnTopChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('alwaysOnTop', !!e.target.checked);
    });

    injectResizersChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('injectResizers', !!e.target.checked);
    });

    persistSettingsChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('persistSettings', !!e.target.checked);
    });

    launchOnStartupChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('launchOnStartup', !!e.target.checked);
    });

    leftQuarterChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('leftQuarterShortcut', !!e.target.checked);
    });

    leftThirdChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('leftThirdShortcut', !!e.target.checked);
    });

    // Folder sync UI
    const useFolderSyncChk = document.getElementById('useFolderSyncChk');
    const syncFolderPath = document.getElementById('syncFolderPath');
    const chooseSyncFolderBtn = document.getElementById('chooseSyncFolderBtn');

    try {
      const useSync = await window.electron.getSetting('useFolderSync');
      const folder = await window.electron.getSyncFolder();
      if (typeof useSync === 'boolean') useFolderSyncChk.checked = useSync;
      syncFolderPath.innerText = folder || 'Not set';
    } catch (err) { /* ignore */ }

    useFolderSyncChk.addEventListener('change', async (e) => {
      const enabled = !!e.target.checked;
      await window.electron.setSetting('useFolderSync', enabled);
    });

    chooseSyncFolderBtn.addEventListener('click', async () => {
      const chosen = await window.electron.chooseSyncFolder();
      if (chosen) {
        syncFolderPath.innerText = chosen;
        // persist folder path in settings so main can find it
        await window.electron.setSetting('syncFolder', chosen);
        // if folder sync is enabled, ask main to start watching (main handles this when setting syncFolder)
      }
    });

    resetSettingsBtn.addEventListener('click', async () => {
      if (!confirm('Reset settings to defaults?')) return;
      const newSettings = await window.electron.resetSettings();
        if (newSettings) {
        // update UI to reflect defaults
        opacityRange.value = newSettings.appOpacity;
        opacityVal.innerText = Math.round(newSettings.appOpacity * 100) + '%';
          try { document.documentElement.style.setProperty('--bg-opacity', (newSettings.appOpacity * 0.06).toString()); } catch (e) {}
        alwaysOnTopChk.checked = newSettings.alwaysOnTop;
        injectResizersChk.checked = newSettings.injectResizers;
        persistSettingsChk.checked = newSettings.persistSettings;
        // reflect new boolean settings into UI
        leftQuarterChk.checked = !!newSettings.leftQuarterShortcut;
        leftThirdChk.checked = !!newSettings.leftThirdShortcut;
        launchOnStartupChk.checked = !!newSettings.launchOnStartup;
      }
    });

    // Listen to setting changes from main (applies if other windows change settings)
    if (typeof window.electron.onSettingChanged === 'function') {
      window.electron.onSettingChanged((key, value) => {
        try {
          if (key === 'appOpacity') {
            opacityRange.value = value;
            opacityVal.innerText = Math.round(value * 100) + '%';
            try { document.documentElement.style.setProperty('--bg-opacity', (value * 0.06).toString()); } catch (e) {}
          }
          if (key === 'leftQuarterShortcut') leftQuarterChk.checked = !!value;
          if (key === 'leftThirdShortcut') leftThirdChk.checked = !!value;
          if (key === 'alwaysOnTop') alwaysOnTopChk.checked = !!value;
          if (key === 'injectResizers') injectResizersChk.checked = !!value;
          if (key === 'persistSettings') persistSettingsChk.checked = !!value;
          if (key === 'launchOnStartup') launchOnStartupChk.checked = !!value;
        } catch (err) {}
      });
    }
  } catch (err) {
    // ignore if APIs not present
  }
}

initSettingsUI();

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
  currentLinks = links || [];
  renderLinks(currentLinks);
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

  if (!links || links.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

    links.forEach(link => {
    const linkElement = document.createElement('div');
    linkElement.className = 'link-item';
    linkElement.innerHTML = `
      <div class="link-select"><input type="checkbox" class="select-checkbox" data-id="${link.id}"></div>
      <div class="link-content">
        <div class="link-title">${link.title} ${link.favorite ? '<span class="fav">★</span>' : ''}</div>
        <div class="link-url">${link.url}</div>
      </div>
      <div class="link-actions">
        <button class="fav-btn" data-id="${link.id}">${link.favorite ? 'Unfav' : 'Fav'}</button>
        <button class="delete-btn" data-id="${link.id}">Delete</button>
      </div>
    `;
    linksList.appendChild(linkElement);

    // open link on click, pass id so main can restore bounds
    const contentEl = linkElement.querySelector('.link-content');
    if (contentEl) contentEl.addEventListener('click', () => {
      try { window.electron.openLinkWithId(Number(link.id), link.url); } catch (e) { window.electron.openLink(link.url); }
    });
  });

  // Wire up action buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.getAttribute('data-id'));
      if (confirm('Delete this link?')) {
        await window.electron.deleteLink(id);
        loadLinks();
      }
    });
  });

  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number(e.currentTarget.getAttribute('data-id'));
      await window.electron.toggleFavorite(id);
      loadLinks();
    });
  });
}

// Listen for external sync updates
if (window.electron && typeof window.electron.onLinksChanged === 'function') {
  window.electron.onLinksChanged(() => {
    try { loadLinks(); } catch (e) {}
  });
}

// Search
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return renderLinks(currentLinks);
    const filtered = currentLinks.filter(l => (l.title && l.title.toLowerCase().includes(q)) || (l.url && l.url.toLowerCase().includes(q)) || (l.tags && l.tags.join(' ').toLowerCase().includes(q)));
    renderLinks(filtered);
  });
}

// Bulk action buttons
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const backupBtn = document.getElementById('backupBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

if (exportBtn) exportBtn.addEventListener('click', async () => {
  const path = await window.electron.exportLinks();
  if (path) alert('Exported to: ' + path);
});

if (importBtn) importBtn.addEventListener('click', async () => {
  const ok = await window.electron.importLinks();
  if (ok) { alert('Import complete'); loadLinks(); }
});

if (backupBtn) backupBtn.addEventListener('click', async () => {
  const fp = await window.electron.manualBackup(5);
  if (fp) alert('Backup saved: ' + fp);
});

if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('.select-checkbox:checked')).map(cb => Number(cb.getAttribute('data-id')));
  if (checked.length === 0) { alert('No items selected'); return; }
  if (!confirm(`Delete ${checked.length} selected links?`)) return;
  await window.electron.bulkDelete(checked);
  loadLinks();
});

// Telemetry opt-in
const telemetryChk = document.getElementById('telemetryChk');
if (telemetryChk) {
  (async () => {
    try {
      const val = await window.electron.getSetting('telemetryEnabled');
      telemetryChk.checked = !!val;
    } catch (err) {}
  })();
  telemetryChk.addEventListener('change', async (e) => {
    await window.electron.setSetting('telemetryEnabled', !!e.target.checked);
  });
}

// Listen for external sync updates
if (window.electron && typeof window.electron.onLinksChanged === 'function') {
  window.electron.onLinksChanged(() => {
    try { loadLinks(); } catch (e) {}
  });
}
