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
const tagsInput = document.getElementById('tagsInput');
const tagFiltersEl = document.getElementById('tagFilters');
const clearTagFiltersBtn = document.getElementById('clearTagFiltersBtn');
const bulkTagBtn = document.getElementById('bulkTagBtn');

function applyBackgroundVisuals(rawValue) {
  try {
    const parsed = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
    const clamped = isNaN(parsed) ? 1 : Math.max(0, Math.min(1, parsed));
    const nearZero = clamped <= 0.01;
    const bgAlpha = nearZero ? 0 : 0.02 + (clamped * 0.08);
    const blurSize = nearZero ? 38 : Math.round(12 + (clamped * 26));
    document.documentElement.style.setProperty('--bg-opacity', bgAlpha.toFixed(3));
    document.documentElement.style.setProperty('--bg-blur', Math.max(8, blurSize) + 'px');
    const surfaceAlpha = nearZero ? 0 : Math.min(0.95, 0.35 + clamped * 0.6);
    const cardAlpha = nearZero ? 0 : Math.min(0.35, 0.08 + clamped * 0.18);
    const inputAlpha = nearZero ? 0 : Math.min(0.4, 0.06 + clamped * 0.2);
    const chromeAlpha = nearZero ? 0.08 : Math.min(0.5, 0.2 + clamped * 0.3);
    const borderAlpha = nearZero ? 0.28 : Math.min(0.2, 0.1 + clamped * 0.1);
    const cardBorderAlpha = nearZero ? 0.24 : Math.min(0.35, 0.2 + clamped * 0.08);
    const inputBorderAlpha = nearZero ? 0.3 : Math.min(0.4, 0.3 + clamped * 0.08);
    document.documentElement.style.setProperty('--surface-alpha', surfaceAlpha.toFixed(3));
    document.documentElement.style.setProperty('--card-alpha', cardAlpha.toFixed(3));
    document.documentElement.style.setProperty('--input-alpha', inputAlpha.toFixed(3));
    document.documentElement.style.setProperty('--chrome-alpha', chromeAlpha.toFixed(3));
    document.documentElement.style.setProperty('--panel-border-alpha', borderAlpha.toFixed(3));
    document.documentElement.style.setProperty('--card-border-alpha', cardBorderAlpha.toFixed(3));
    document.documentElement.style.setProperty('--input-border-alpha', inputBorderAlpha.toFixed(3));
    if (document.body) {
      document.body.classList.toggle('transparent-mode', nearZero);
    }
  } catch (err) {}
}

// Load links on startup
loadLinks();

let currentLinks = [];
let searchQuery = '';
let activeTagFilter = null;

function normalizeTagsInput(raw) {
  if (!raw) return [];
  const seen = new Set();
  const tags = [];
  raw.split(',').forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(trimmed);
  });
  return tags;
}

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#39;';
      default: return char;
    }
  });
}

function formatTagsForInput(tags) {
  if (!Array.isArray(tags)) return '';
  return tags.join(', ');
}

function getSelectedLinkIds() {
  return Array.from(document.querySelectorAll('.select-checkbox:checked'))
    .map((cb) => Number(cb.getAttribute('data-id')))
    .filter((id) => Number.isFinite(id));
}

function renderTagFilters() {
  if (!tagFiltersEl) return;
  tagFiltersEl.innerHTML = '';
  const tagCounts = new Map();
  currentLinks.forEach((link) => {
    (link.tags || []).forEach((tag) => {
      if (!tag) return;
      const key = tag;
      tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
    });
  });

  if (tagCounts.size === 0) {
    activeTagFilter = null;
    const emptyChip = document.createElement('span');
    emptyChip.className = 'tag-chip muted';
    emptyChip.textContent = 'No tags yet';
    tagFiltersEl.appendChild(emptyChip);
    if (clearTagFiltersBtn) clearTagFiltersBtn.disabled = true;
    return;
  }

  if (activeTagFilter && !tagCounts.has(activeTagFilter)) {
    activeTagFilter = null;
  }

  const sorted = Array.from(tagCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sorted.forEach(([tag]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-chip selectable' + (activeTagFilter === tag ? ' active' : '');
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      activeTagFilter = activeTagFilter === tag ? null : tag;
      renderTagFilters();
      renderLinks();
    });
    tagFiltersEl.appendChild(btn);
  });
  if (clearTagFiltersBtn) clearTagFiltersBtn.disabled = !activeTagFilter;
}

function getFilteredLinks() {
  let filtered = currentLinks.slice();
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((l) => {
      const matchesTitle = l.title && l.title.toLowerCase().includes(query);
      const matchesUrl = l.url && l.url.toLowerCase().includes(query);
      const matchesTags = Array.isArray(l.tags) && l.tags.join(' ').toLowerCase().includes(query);
      return matchesTitle || matchesUrl || matchesTags;
    });
  }
  if (activeTagFilter) {
    const target = activeTagFilter.toLowerCase();
    filtered = filtered.filter((l) => Array.isArray(l.tags) && l.tags.some((tag) => tag.toLowerCase() === target));
  }
  return filtered;
}

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
    applyBackgroundVisuals(current);

    opacityRange.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      opacityVal.innerText = Math.round(v * 100) + '%';
      applyBackgroundVisuals(v);
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
          applyBackgroundVisuals(val);
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
    if (typeof s.injectResizers === 'boolean') {
      injectResizersChk.checked = s.injectResizers;
      applyResizerVisibility(!!s.injectResizers);
    }
    if (typeof s.persistSettings === 'boolean') persistSettingsChk.checked = s.persistSettings;
    if (typeof s.launchOnStartup === 'boolean') launchOnStartupChk.checked = s.launchOnStartup;
    if (typeof s.leftQuarterShortcut === 'boolean') leftQuarterChk.checked = s.leftQuarterShortcut;
    if (typeof s.leftThirdShortcut === 'boolean') leftThirdChk.checked = s.leftThirdShortcut;

    // Wire up change listeners
    alwaysOnTopChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('alwaysOnTop', !!e.target.checked);
    });

    injectResizersChk.addEventListener('change', async (e) => {
      const enabled = !!e.target.checked;
      await window.electron.setSetting('injectResizers', enabled);
      applyResizerVisibility(enabled);
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
          applyBackgroundVisuals(newSettings.appOpacity);
        alwaysOnTopChk.checked = newSettings.alwaysOnTop;
        injectResizersChk.checked = newSettings.injectResizers;
        applyResizerVisibility(!!newSettings.injectResizers);
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
            applyBackgroundVisuals(value);
          }
          if (key === 'leftQuarterShortcut') leftQuarterChk.checked = !!value;
          if (key === 'leftThirdShortcut') leftThirdChk.checked = !!value;
          if (key === 'alwaysOnTop') alwaysOnTopChk.checked = !!value;
          if (key === 'injectResizers') {
            injectResizersChk.checked = !!value;
            applyResizerVisibility(!!value);
          }
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
const resizers = Array.from(document.querySelectorAll('.resizer'));
let resizersEnabled = true;

function applyResizerVisibility(enabled) {
  resizersEnabled = !!enabled;
  resizers.forEach((resizer) => {
    if (!resizer) return;
    resizer.style.display = resizersEnabled ? '' : 'none';
  });
}

applyResizerVisibility(true);

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
      bounds.width = Math.max(1, startBounds.width + dx);
    }
    if (edge.includes('s')) {
      bounds.height = Math.max(1, startBounds.height + dy);
    }
    if (edge.includes('w')) {
      bounds.width = Math.max(1, startBounds.width - dx);
      bounds.x = startBounds.x + dx;
    }
    if (edge.includes('n')) {
      bounds.height = Math.max(1, startBounds.height - dy);
      bounds.y = startBounds.y + dy;
    }

    await window.windowManager.setBounds(bounds);
  };

  resizer.addEventListener('mousedown', async (ev) => {
    if (!resizersEnabled) return;
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
  currentLinks = Array.isArray(links) ? links : [];
  renderTagFilters();
  renderLinks();
}

async function addLink() {
  const url = urlInput.value.trim();
  const title = titleInput.value.trim();
  const tags = tagsInput ? normalizeTagsInput(tagsInput.value) : [];

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
    url,
    title,
    tags
  };

  await window.electron.addLink(link);
  urlInput.value = '';
  titleInput.value = '';
  if (tagsInput) tagsInput.value = '';
  urlInput.focus();
  loadLinks();
}

async function deleteLink(id) {
  if (confirm('Delete this link?')) {
    await window.electron.deleteLink(id);
    loadLinks();
  }
}

function renderLinks() {
  linksList.innerHTML = '';

  const filtered = getFilteredLinks();
  if (!filtered || filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  const pinned = filtered.filter((link) => link.pinned);
  const others = filtered.filter((link) => !link.pinned);

  if (pinned.length) {
    const heading = document.createElement('div');
    heading.className = 'link-section-heading';
    heading.textContent = 'Pinned';
    linksList.appendChild(heading);
    pinned.forEach((link) => linksList.appendChild(buildLinkElement(link)));
  }

  if (others.length) {
    if (pinned.length) {
      const heading = document.createElement('div');
      heading.className = 'link-section-heading';
      heading.textContent = 'All links';
      linksList.appendChild(heading);
    }
    others.forEach((link) => linksList.appendChild(buildLinkElement(link)));
  }
}

function buildLinkElement(link) {
  const linkElement = document.createElement('div');
  linkElement.className = 'link-item';
  linkElement.dataset.id = link.id;

  const titleText = escapeHtml(link.title || link.url);
  const urlText = escapeHtml(link.url);
  const tags = (link.tags && link.tags.length)
    ? link.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')
    : '<span class="tag-chip muted">No tags</span>';
  const badges = [
    link.favorite ? '<span class="badge favorite-badge">Favorite</span>' : '',
    link.pinned ? '<span class="badge pinned-badge">Pinned</span>' : ''
  ].join('');

  linkElement.innerHTML = `
    <div class="link-select"><input type="checkbox" class="select-checkbox" data-id="${link.id}"></div>
    <div class="link-body">
      <div class="link-display">
        <div class="link-title-row">
          <div class="link-title">${titleText}</div>
          <div class="link-badges">${badges}</div>
        </div>
        <div class="link-url">${urlText}</div>
        <div class="link-tags">${tags}</div>
      </div>
      <div class="link-actions">
        <button class="action-btn open-btn" data-id="${link.id}">Open window</button>
        <button class="action-btn browser-btn" data-id="${link.id}">Open browser</button>
        <button class="action-btn copy-btn" data-id="${link.id}">Copy</button>
        <button class="action-btn edit-btn" data-id="${link.id}">Edit</button>
        <button class="action-btn pin-btn" data-id="${link.id}">${link.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="action-btn fav-btn" data-id="${link.id}">${link.favorite ? 'Unfav' : 'Fav'}</button>
        <button class="action-btn delete-btn danger" data-id="${link.id}">Delete</button>
      </div>
      <div class="link-edit hidden">
        <div class="edit-grid">
          <label>Title<input type="text" class="edit-title"></label>
          <label>URL<input type="text" class="edit-url"></label>
          <label>Tags<input type="text" class="edit-tags" placeholder="Comma separated"></label>
        </div>
        <div class="edit-actions">
          <button class="action-btn save-edit-btn">Save</button>
          <button class="action-btn ghost cancel-edit-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  const displayEl = linkElement.querySelector('.link-display');
  if (displayEl) {
    displayEl.addEventListener('click', () => {
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
    });
  }

  const openBtn = linkElement.querySelector('.open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
    });
  }

  const browserBtn = linkElement.querySelector('.browser-btn');
  if (browserBtn) {
    browserBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.openInBrowser(link.url);
    });
  }

  const copyBtn = linkElement.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.copyLink(link.url);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = original; }, 1200);
    });
  }

  const deleteBtn = linkElement.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this link?')) return;
      await window.electron.deleteLink(link.id);
      loadLinks();
    });
  }

  const favBtn = linkElement.querySelector('.fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.toggleFavorite(link.id);
      loadLinks();
    });
  }

  const pinBtn = linkElement.querySelector('.pin-btn');
  if (pinBtn) {
    pinBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.setLinkPinned(link.id, !link.pinned);
      loadLinks();
    });
  }

  const editBtn = linkElement.querySelector('.edit-btn');
  const editContainer = linkElement.querySelector('.link-edit');
  const editTitleInput = linkElement.querySelector('.edit-title');
  const editUrlInput = linkElement.querySelector('.edit-url');
  const editTagsInput = linkElement.querySelector('.edit-tags');
  const saveEditBtn = linkElement.querySelector('.save-edit-btn');
  const cancelEditBtn = linkElement.querySelector('.cancel-edit-btn');

  if (editTitleInput) editTitleInput.value = link.title || '';
  if (editUrlInput) editUrlInput.value = link.url || '';
  if (editTagsInput) editTagsInput.value = formatTagsForInput(link.tags);

  const setEditing = (editing) => {
    if (!editContainer) return;
    if (editing) {
      linkElement.classList.add('editing');
      editContainer.classList.remove('hidden');
      if (editTitleInput) editTitleInput.focus();
    } else {
      linkElement.classList.remove('editing');
      editContainer.classList.add('hidden');
      if (editTitleInput) editTitleInput.value = link.title || '';
      if (editUrlInput) editUrlInput.value = link.url || '';
      if (editTagsInput) editTagsInput.value = formatTagsForInput(link.tags);
    }
  };

  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const toggled = !linkElement.classList.contains('editing');
      setEditing(toggled);
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
    });
  }

  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const updated = {
        id: link.id,
        title: editTitleInput ? editTitleInput.value.trim() : link.title,
        url: editUrlInput ? editUrlInput.value.trim() : link.url,
        tags: editTagsInput ? normalizeTagsInput(editTagsInput.value) : link.tags
      };
      if (!updated.url) {
        alert('URL is required');
        return;
      }
      const ok = await window.electron.updateLink(updated);
      if (ok) {
        setEditing(false);
        loadLinks();
      }
    });
  }

  return linkElement;
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
    searchQuery = e.target.value || '';
    renderLinks();
  });
}

if (clearTagFiltersBtn) {
  clearTagFiltersBtn.addEventListener('click', () => {
    activeTagFilter = null;
    renderTagFilters();
    renderLinks();
  });
}

if (bulkTagBtn) {
  bulkTagBtn.addEventListener('click', async () => {
    const ids = getSelectedLinkIds();
    if (ids.length === 0) {
      alert('No items selected');
      return;
    }
    const value = prompt('Enter comma-separated tags to apply to selected links. Leave blank to clear existing tags.');
    if (value === null) return;
    const tags = normalizeTagsInput(value);
    await window.electron.bulkUpdateTags(ids, tags);
    loadLinks();
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
  const checked = getSelectedLinkIds();
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
