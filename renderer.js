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
const folderInput = document.getElementById('folderInput');
const notesInput = document.getElementById('notesInput');
const prioritySelect = document.getElementById('prioritySelect');
const tagFiltersEl = document.getElementById('tagFilters');
const clearTagFiltersBtn = document.getElementById('clearTagFiltersBtn');
const bulkTagBtn = document.getElementById('bulkTagBtn');
const clipboardBanner = document.getElementById('clipboardBanner');
const clipboardBannerValue = document.getElementById('clipboardBannerValue');
const useClipboardLinkBtn = document.getElementById('useClipboardLinkBtn');
const dismissClipboardBannerBtn = document.getElementById('dismissClipboardBannerBtn');
const searchModeToggle = document.getElementById('searchModeToggle');
const groupingSelect = document.getElementById('groupingSelect');
const dropOverlay = document.getElementById('dropOverlay');

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
const activeTagFilters = new Set();
let pinnedTags = [];
let searchMode = 'fuzzy';
let groupingMode = 'none';
let clipboardCandidate = null;
let clipboardDismissedToken = null;

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
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (tagCounts.size === 0) {
    activeTagFilters.clear();
    const emptyChip = document.createElement('span');
    emptyChip.className = 'tag-chip muted';
    emptyChip.textContent = 'No tags yet';
    tagFiltersEl.appendChild(emptyChip);
    if (clearTagFiltersBtn) clearTagFiltersBtn.disabled = true;
    return;
  }

  // Drop filters for tags that no longer exist
  Array.from(activeTagFilters).forEach((tag) => {
    if (!tagCounts.has(tag)) activeTagFilters.delete(tag);
  });

  const normalizedPinned = new Set(pinnedTags.map((tag) => tag.toLowerCase()));
  const sorted = Array.from(tagCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const pinnedList = [];
  const regularList = [];
  sorted.forEach(([tag, count]) => {
    const target = normalizedPinned.has(tag.toLowerCase()) ? pinnedList : regularList;
    target.push([tag, count]);
  });

  const renderSection = (label, items) => {
    if (!items.length) return;
    const section = document.createElement('div');
    section.className = 'tag-filter-section';
    if (label) {
      const heading = document.createElement('span');
      heading.className = 'tag-section-label';
      heading.textContent = label;
      section.appendChild(heading);
    }
    const chipRow = document.createElement('div');
    chipRow.className = 'tag-chip-row';
    items.forEach(([tag, count]) => {
      const button = document.createElement('button');
      button.type = 'button';
      const isActive = activeTagFilters.has(tag);
      const isPinned = normalizedPinned.has(tag.toLowerCase());
      button.className = `tag-chip selectable${isActive ? ' active' : ''}${isPinned ? ' pinned' : ''}`;
      button.dataset.tag = tag;
      button.title = isPinned ? 'Pinned tag • right-click to unpin' : 'Right-click to pin';
      button.innerHTML = `<span class="tag-chip-label">${escapeHtml(tag)}<span class="tag-count">${count}</span></span>` + (isPinned ? '<span class="tag-pin">★</span>' : '');
      button.addEventListener('click', () => {
        if (activeTagFilters.has(tag)) activeTagFilters.delete(tag);
        else activeTagFilters.add(tag);
        renderTagFilters();
        renderLinks();
      });
      button.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        await togglePinnedTag(tag);
      });
      chipRow.appendChild(button);
    });
    section.appendChild(chipRow);
    tagFiltersEl.appendChild(section);
  };

  renderSection(pinnedList.length ? 'Pinned tags' : null, pinnedList);
  renderSection('All tags', regularList);
  if (clearTagFiltersBtn) clearTagFiltersBtn.disabled = activeTagFilters.size === 0;
}

async function togglePinnedTag(tag) {
  const normalized = tag.toLowerCase();
  const exists = pinnedTags.some((t) => t.toLowerCase() === normalized);
  pinnedTags = exists ? pinnedTags.filter((t) => t.toLowerCase() !== normalized) : [...pinnedTags, tag];
  renderTagFilters();
  try {
    await window.electron.setSetting('pinnedTags', pinnedTags);
  } catch (err) {}
}

function getFilteredLinks() {
  let filtered = currentLinks.slice();
  const query = searchQuery.trim();
  if (query) {
    if (searchMode === 'fuzzy') {
      const scored = filtered
        .map((link) => ({ link, score: computeFuzzyScore(link, query) }))
        .filter((entry) => entry.score > 0);
      scored.sort((a, b) => b.score - a.score);
      filtered = scored.map((entry) => entry.link);
    } else {
      const lower = query.toLowerCase();
      filtered = filtered.filter((link) => {
        const matchesTitle = link.title && link.title.toLowerCase().includes(lower);
        const matchesUrl = link.url && link.url.toLowerCase().includes(lower);
        const matchesTags = Array.isArray(link.tags) && link.tags.join(' ').toLowerCase().includes(lower);
        const matchesNotes = link.notes && link.notes.toLowerCase().includes(lower);
        return matchesTitle || matchesUrl || matchesTags || matchesNotes;
      });
    }
  }
  if (activeTagFilters.size) {
    const required = new Set(Array.from(activeTagFilters).map((tag) => tag.toLowerCase()));
    filtered = filtered.filter((link) => {
      const tagSet = new Set((link.tags || []).map((tag) => tag.toLowerCase()));
      for (const tag of required) {
        if (!tagSet.has(tag)) return false;
      }
      return true;
    });
  }
  return filtered;
}

function computeFuzzyScore(link, query) {
  const haystacks = [
    link.title || '',
    link.url || '',
    Array.isArray(link.tags) ? link.tags.join(' ') : '',
    link.notes || '',
    link.folder || ''
  ];
  let best = 0;
  haystacks.forEach((text) => {
    const score = fuzzyScore(text, query);
    if (score > best) best = score;
  });
  return best;
}

function fuzzyScore(text, query) {
  if (!text) return 0;
  const hay = text.toLowerCase();
  const needle = query.toLowerCase();
  let hi = 0;
  let ni = 0;
  let score = 0;
  let streak = 0;
  while (hi < hay.length && ni < needle.length) {
    if (hay[hi] === needle[ni]) {
      score += 5 + streak * 2;
      streak += 1;
      ni += 1;
    } else {
      streak = 0;
    }
    hi += 1;
  }
  if (ni < needle.length) return 0;
  return Math.max(score - (hay.length - needle.length), 1);
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

    if (Array.isArray(s.pinnedTags)) pinnedTags = s.pinnedTags.slice();
    if (groupingSelect) {
      groupingMode = typeof s.groupingPreference === 'string' ? s.groupingPreference : 'none';
      groupingSelect.value = groupingMode;
    }
    renderTagFilters();

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
          if (key === 'pinnedTags') {
            pinnedTags = Array.isArray(value) ? value : [];
            renderTagFilters();
          }
          if (key === 'groupingPreference') {
            groupingMode = value || 'none';
            if (groupingSelect) groupingSelect.value = groupingMode;
            renderLinks();
          }
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
  if (Array.isArray(links)) {
    currentLinks = links.slice().sort((a, b) => {
      const av = typeof a.sortOrder === 'number' ? a.sortOrder : (a.createdAt ? Date.parse(a.createdAt) : 0);
      const bv = typeof b.sortOrder === 'number' ? b.sortOrder : (b.createdAt ? Date.parse(b.createdAt) : 0);
      return av - bv;
    });
  } else {
    currentLinks = [];
  }
  renderTagFilters();
  renderLinks();
}

async function addLink() {
  const url = urlInput.value.trim();
  const title = titleInput.value.trim();
  const tags = tagsInput ? normalizeTagsInput(tagsInput.value) : [];
  const folder = folderInput ? folderInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';
  const priority = prioritySelect ? prioritySelect.value : 'normal';

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
    tags,
    folder,
    notes,
    priority
  };

  await window.electron.addLink(link);
  urlInput.value = '';
  titleInput.value = '';
  if (tagsInput) tagsInput.value = '';
  if (folderInput) folderInput.value = '';
  if (notesInput) notesInput.value = '';
  if (prioritySelect) prioritySelect.value = 'normal';
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
    pinned.forEach((link) => linksList.appendChild(buildLinkElement(link, { groupKey: 'pinned' })));
  }

  if (others.length) {
    const groupedEntries = getGroupedEntries(others);
    groupedEntries.forEach(({ label, items, groupKey }) => {
      if (!items.length) return;
      if (label) {
        const heading = document.createElement('div');
        heading.className = 'link-section-heading';
        heading.textContent = label;
        linksList.appendChild(heading);
      } else if (pinned.length) {
        const heading = document.createElement('div');
        heading.className = 'link-section-heading';
        heading.textContent = 'All links';
        linksList.appendChild(heading);
      }
      items.forEach((link) => {
        linksList.appendChild(buildLinkElement(link, { groupKey }));
      });
    });
  }
}

function getGroupedEntries(links) {
  if (groupingMode === 'folder') {
    const groups = new Map();
    links.forEach((link) => {
      const key = link.folder ? link.folder : 'No folder';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(link);
    });
    return Array.from(groups.entries()).map(([label, items]) => ({
      label: label,
      items,
      groupKey: `folder:${label || 'none'}`
    }));
  }
  if (groupingMode === 'tag') {
    const groups = new Map();
    links.forEach((link) => {
      const key = (link.tags && link.tags.length) ? link.tags[0] : 'No tag';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(link);
    });
    return Array.from(groups.entries()).map(([label, items]) => ({
      label: label,
      items,
      groupKey: `tag:${label || 'none'}`
    }));
  }
  return [{
    label: '',
    items: links,
    groupKey: 'default'
  }];
}

function buildLinkElement(link, options = {}) {
  const groupKey = options.groupKey || 'default';
  const linkElement = document.createElement('div');
  linkElement.className = 'link-item';
  linkElement.dataset.id = link.id;
  linkElement.dataset.groupKey = groupKey;

  const titleText = escapeHtml(link.title || link.url);
  const urlText = escapeHtml(link.url);
  const folderChip = link.folder ? `<span class="tag-chip folder-chip">${escapeHtml(link.folder)}</span>` : '';
  const tags = (link.tags && link.tags.length)
    ? link.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')
    : '<span class="tag-chip muted">No tags</span>';
  const metadataPreview = buildMetadataPreview(link);
  const notesBlock = link.notes ? `<div class="link-notes"><span>Notes:</span> ${escapeHtml(link.notes)}</div>` : '';
  const favicon = link.metadata && link.metadata.favicon
    ? `<img src="${escapeHtml(link.metadata.favicon)}" alt="" class="link-favicon">`
    : '';
  const siteName = link.metadata && link.metadata.siteName
    ? `<div class="link-site">${escapeHtml(link.metadata.siteName)}</div>`
    : '';
  const badges = [
    link.favorite ? '<span class="badge favorite-badge">Favorite</span>' : '',
    link.pinned ? '<span class="badge pinned-badge">Pinned</span>' : '',
    buildPriorityBadge(link.priority),
    buildHealthBadge(link.health)
  ].filter(Boolean).join('');

  linkElement.innerHTML = `
    <div class="link-select"><input type="checkbox" class="select-checkbox" data-id="${link.id}"></div>
    <div class="link-body">
      <div class="link-display">
        <div class="link-title-row">
          <div class="link-title">
            ${favicon}
            <div>
              <div class="link-title-text">${titleText}</div>
              ${siteName}
            </div>
          </div>
          <div class="link-badges">${badges}</div>
        </div>
        <div class="link-url">${urlText}</div>
        <div class="link-tags">${folderChip}${tags}</div>
        ${notesBlock}
        ${metadataPreview}
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
      <div class="link-meta-actions">
        <button class="icon-btn refresh-meta-btn" data-id="${link.id}">Refresh meta</button>
        <button class="icon-btn refresh-health-btn" data-id="${link.id}">Check health</button>
      </div>
      <div class="link-edit hidden">
        <div class="edit-grid">
          <label>Title<input type="text" class="edit-title"></label>
          <label>URL<input type="text" class="edit-url"></label>
          <label>Tags<input type="text" class="edit-tags" placeholder="Comma separated"></label>
          <label>Folder<input type="text" class="edit-folder" placeholder="Folder name"></label>
          <label>Priority
            <select class="edit-priority">
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label class="notes-label">Notes<textarea class="edit-notes" placeholder="Details, reminders..."></textarea></label>
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
  const editFolderInput = linkElement.querySelector('.edit-folder');
  const editPrioritySelect = linkElement.querySelector('.edit-priority');
  const editNotesInput = linkElement.querySelector('.edit-notes');
  const saveEditBtn = linkElement.querySelector('.save-edit-btn');
  const cancelEditBtn = linkElement.querySelector('.cancel-edit-btn');
  const refreshMetaBtn = linkElement.querySelector('.refresh-meta-btn');
  const refreshHealthBtn = linkElement.querySelector('.refresh-health-btn');

  if (editTitleInput) editTitleInput.value = link.title || '';
  if (editUrlInput) editUrlInput.value = link.url || '';
  if (editTagsInput) editTagsInput.value = formatTagsForInput(link.tags);
  if (editFolderInput) editFolderInput.value = link.folder || '';
  if (editPrioritySelect) editPrioritySelect.value = (link.priority || 'normal');
  if (editNotesInput) editNotesInput.value = link.notes || '';

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
      if (editFolderInput) editFolderInput.value = link.folder || '';
      if (editPrioritySelect) editPrioritySelect.value = (link.priority || 'normal');
      if (editNotesInput) editNotesInput.value = link.notes || '';
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
        tags: editTagsInput ? normalizeTagsInput(editTagsInput.value) : link.tags,
        folder: editFolderInput ? editFolderInput.value.trim() : link.folder,
        notes: editNotesInput ? editNotesInput.value.trim() : link.notes,
        priority: editPrioritySelect ? editPrioritySelect.value : link.priority
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

  if (refreshMetaBtn) {
    refreshMetaBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const original = refreshMetaBtn.textContent;
      refreshMetaBtn.textContent = 'Queued...';
      await window.electron.refreshLinkMetadata(link.id);
      setTimeout(() => { refreshMetaBtn.textContent = original; }, 800);
    });
  }

  if (refreshHealthBtn) {
    refreshHealthBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const original = refreshHealthBtn.textContent;
      refreshHealthBtn.textContent = 'Checking...';
      await window.electron.refreshLinkHealth(link.id);
      setTimeout(() => { refreshHealthBtn.textContent = original; }, 1000);
    });
  }

  if (currentLinks.length > 1) attachDragHandlers(linkElement, link, groupKey);

  return linkElement;
}

function buildPriorityBadge(priority) {
  const value = (priority || '').toLowerCase();
  if (value === 'high') return '<span class="badge priority-badge priority-high">High priority</span>';
  if (value === 'low') return '<span class="badge priority-badge priority-low">Low priority</span>';
  return '';
}

function buildMetadataPreview(link) {
  const metadata = link && link.metadata ? link.metadata : null;
  if (!metadata) return '';
  const description = metadata.description ? `<p>${escapeHtml(metadata.description)}</p>` : '';
  const site = metadata.siteName ? `<span class="meta-site">${escapeHtml(metadata.siteName)}</span>` : '';
  const favicon = metadata.favicon ? `<img src="${escapeHtml(metadata.favicon)}" alt="" class="meta-favicon">` : '';
  if (!description && !site && !favicon) return '';
  const accentColor = safeColorValue(metadata.dominantColor);
  const accent = accentColor ? ` style="--accent-color:${accentColor}"` : '';
  return `<div class="metadata-preview"${accent}>${favicon}<div class="metadata-copy">${site}${description}</div></div>`;
}

function safeColorValue(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  return '';
}

function describeHealth(health) {
  if (!health) return 'Never checked';
  const statusCode = health.statusCode ? `HTTP ${health.statusCode}` : '';
  const latency = typeof health.latency === 'number' ? `${health.latency}ms` : '';
  let checked = '';
  if (health.checkedAt) {
    try {
      const date = new Date(health.checkedAt);
      checked = `Checked ${date.toLocaleString()}`;
    } catch (err) {}
  }
  return [statusCode, latency, checked, health.error].filter(Boolean).join(' • ') || 'Health status unknown';
}

function buildHealthBadge(health) {
  if (!health) return '';
  const status = (health.status || 'unknown').toLowerCase();
  let label = 'Unknown';
  let className = 'health-unknown';
  if (status === 'ok') {
    label = 'Healthy';
    className = 'health-ok';
  } else if (status === 'redirected') {
    label = 'Redirects';
    className = 'health-redirect';
  } else if (status === 'warning') {
    label = 'Needs review';
    className = 'health-warning';
  } else if (status === 'error' || status === 'broken') {
    label = 'Needs attention';
    className = 'health-error';
  }
  const details = describeHealth(health);
  return `<span class="badge health-badge ${className}" title="${escapeHtml(details)}">${label}</span>`;
}

const dragState = {
  activeId: null,
  groupKey: null
};

function attachDragHandlers(element, link, groupKey) {
  if (!element) return;
  element.setAttribute('draggable', 'true');
  element.addEventListener('dragstart', (e) => {
    dragState.activeId = link.id;
    dragState.groupKey = groupKey;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('application/plana-link-id', String(link.id)); } catch (err) {}
    }
    element.classList.add('dragging');
  });
  element.addEventListener('dragend', () => {
    dragState.activeId = null;
    dragState.groupKey = null;
    element.classList.remove('dragging', 'drop-before', 'drop-after');
  });
  element.addEventListener('dragover', (e) => {
    if (!dragState.activeId || dragState.groupKey !== groupKey) return;
    e.preventDefault();
    const before = shouldDropBefore(e, element);
    element.classList.toggle('drop-before', before);
    element.classList.toggle('drop-after', !before);
  });
  element.addEventListener('dragleave', () => {
    element.classList.remove('drop-before', 'drop-after');
  });
  element.addEventListener('drop', async (e) => {
    if (!dragState.activeId || dragState.groupKey !== groupKey) return;
    e.preventDefault();
    element.classList.remove('drop-before', 'drop-after');
    const dropBefore = shouldDropBefore(e, element);
    const changed = reorderLocalLinks(dragState.activeId, link.id, dropBefore);
    if (changed) {
      try { await window.electron.reorderLinks(currentLinks.map((item) => item.id)); } catch (err) {}
      renderLinks();
    }
  });
}

function shouldDropBefore(event, element) {
  const rect = element.getBoundingClientRect();
  return (event.clientY - rect.top) < rect.height / 2;
}

function reorderLocalLinks(sourceId, targetId, dropBefore) {
  if (Number(sourceId) === Number(targetId)) return false;
  const working = currentLinks.slice();
  const sourceIdx = working.findIndex((item) => Number(item.id) === Number(sourceId));
  if (sourceIdx === -1) return false;
  const [moved] = working.splice(sourceIdx, 1);
  let insertIndex = working.findIndex((item) => Number(item.id) === Number(targetId));
  if (insertIndex === -1) insertIndex = working.length;
  if (!dropBefore) insertIndex += 1;
  working.splice(insertIndex, 0, moved);
  currentLinks = working;
  return true;
}

// Listen for external sync updates

// Search
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value || '';
    renderLinks();
  });
}

if (searchModeToggle) {
  const syncSearchModeLabel = () => {
    searchModeToggle.textContent = searchMode === 'fuzzy' ? 'Fuzzy search' : 'Exact search';
    searchModeToggle.classList.toggle('active', searchMode === 'fuzzy');
  };
  syncSearchModeLabel();
  searchModeToggle.addEventListener('click', () => {
    searchMode = searchMode === 'fuzzy' ? 'exact' : 'fuzzy';
    syncSearchModeLabel();
    renderLinks();
  });
}

if (groupingSelect) {
  groupingSelect.addEventListener('change', async (e) => {
    groupingMode = e.target.value || 'none';
    renderLinks();
    try { await window.electron.setSetting('groupingPreference', groupingMode); } catch (err) {}
  });
}

if (clearTagFiltersBtn) {
  clearTagFiltersBtn.addEventListener('click', () => {
    activeTagFilters.clear();
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
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importCsvBtn = document.getElementById('importCsvBtn');
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

if (exportCsvBtn) exportCsvBtn.addEventListener('click', async () => {
  const path = await window.electron.exportLinksCsv();
  if (path) alert('CSV exported to: ' + path);
});

if (importCsvBtn) importCsvBtn.addEventListener('click', async () => {
  const added = await window.electron.importLinksCsv();
  if (added > 0) { alert(`Imported ${added} links from CSV`); loadLinks(); }
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

if (useClipboardLinkBtn) {
  useClipboardLinkBtn.addEventListener('click', () => {
    if (!clipboardCandidate) return;
    urlInput.value = clipboardCandidate;
    urlInput.focus();
    clipboardDismissedToken = clipboardCandidate;
    clipboardCandidate = null;
    hideClipboardBanner();
  });
}

if (dismissClipboardBannerBtn) {
  dismissClipboardBannerBtn.addEventListener('click', () => {
    clipboardDismissedToken = clipboardCandidate;
    clipboardCandidate = null;
    hideClipboardBanner();
  });
}

window.addEventListener('focus', () => checkClipboardForLink(false));
checkClipboardForLink(true);
setInterval(() => checkClipboardForLink(false), 30000);

document.addEventListener('paste', (e) => {
  if (!e.clipboardData) return;
  const active = document.activeElement;
  if (active && ['INPUT', 'TEXTAREA'].includes(active.tagName)) return;
  const pasted = e.clipboardData.getData('text/plain');
  if (pasted && isValidUrlCandidate(pasted.trim())) {
    e.preventDefault();
    urlInput.value = pasted.trim();
    urlInput.focus();
  }
});

let dragOverlayDepth = 0;
document.addEventListener('dragover', (e) => {
  if (!hasExternalUrlPayload(e.dataTransfer)) return;
  e.preventDefault();
  dragOverlayDepth += 1;
  showDropOverlay();
});

document.addEventListener('dragleave', (e) => {
  if (!hasExternalUrlPayload(e.dataTransfer)) return;
  dragOverlayDepth = Math.max(0, dragOverlayDepth - 1);
  if (dragOverlayDepth === 0) hideDropOverlay();
});

document.addEventListener('drop', async (e) => {
  if (!hasExternalUrlPayload(e.dataTransfer)) return;
  e.preventDefault();
  dragOverlayDepth = 0;
  hideDropOverlay();
  const urls = extractUrlsFromDataTransfer(e.dataTransfer);
  if (!urls.length) return;
  for (const url of urls.slice(0, 20)) {
    await window.electron.addLink({
      url,
      title: '',
      tags: [],
      folder: folderInput ? folderInput.value.trim() : '',
      notes: notesInput ? notesInput.value.trim() : '',
      priority: prioritySelect ? prioritySelect.value : 'normal'
    });
  }
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

async function checkClipboardForLink(force = false) {
  if (!window.electron || typeof window.electron.peekClipboardLink !== 'function') return;
  try {
    const candidate = await window.electron.peekClipboardLink();
    if (!candidate) {
      if (force) hideClipboardBanner();
      return;
    }
    if (candidate === clipboardCandidate || candidate === clipboardDismissedToken) return;
    clipboardCandidate = candidate;
    showClipboardBanner(candidate);
  } catch (err) {}
}

function showClipboardBanner(url) {
  if (!clipboardBanner || !clipboardBannerValue) return;
  clipboardBannerValue.textContent = url;
  clipboardBanner.classList.remove('hidden');
}

function hideClipboardBanner() {
  if (clipboardBanner) clipboardBanner.classList.add('hidden');
  clipboardCandidate = null;
}

function hasExternalUrlPayload(dt) {
  if (!dt || !dt.types) return false;
  const types = Array.from(dt.types);
  if (types.includes('application/plana-link-id')) return false;
  return types.includes('text/uri-list') || types.includes('text/plain');
}

function extractUrlsFromDataTransfer(dt) {
  const urls = [];
  if (!dt) return urls;
  const uriList = dt.getData('text/uri-list');
  if (uriList) {
    uriList.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      if (isValidUrlCandidate(trimmed)) urls.push(trimmed);
    });
  }
  if (!urls.length) {
    const text = dt.getData('text/plain');
    if (text) {
      text.split(/\s+/).forEach((token) => {
        if (isValidUrlCandidate(token)) urls.push(token);
      });
    }
  }
  return Array.from(new Set(urls));
}

function showDropOverlay() {
  if (dropOverlay) dropOverlay.classList.remove('hidden');
}

function hideDropOverlay() {
  if (dropOverlay) dropOverlay.classList.add('hidden');
}

function isValidUrlCandidate(value) {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
}

// Listen for external sync updates
if (window.electron && typeof window.electron.onLinksChanged === 'function') {
  window.electron.onLinksChanged(() => {
    try { loadLinks(); } catch (e) {}
  });
}
