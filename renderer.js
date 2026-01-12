const urlInput = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const addBtn = document.getElementById('addBtn');
const importClipboardBtn = document.getElementById('importClipboardBtn');
const linksList = document.getElementById('linksList');
const emptyState = document.getElementById('emptyState');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsPanel = document.getElementById('settingsPanel');
const appTitleEl = document.getElementById('appTitle');
const appNameInput = document.getElementById('appNameInput');
const appNameSaveBtn = document.getElementById('appNameSaveBtn');
const appNameResetBtn = document.getElementById('appNameResetBtn');
const languageSelect = document.getElementById('languageSelect');
const selfChatBtn = document.getElementById('selfChatBtn');
const selfChatOverlay = document.getElementById('selfChatOverlay');
const selfChatPanel = document.getElementById('selfChatPanel');
const selfChatMessages = document.getElementById('selfChatMessages');
const selfChatInput = document.getElementById('selfChatInput');
const selfChatSendBtn = document.getElementById('selfChatSendBtn');
const selfChatCloseBtn = document.getElementById('selfChatCloseBtn');
const selfChatClearBtn = document.getElementById('selfChatClearBtn');
const selfChatChannelList = document.getElementById('selfChatChannelList');
const selfChatChannelSearch = document.getElementById('selfChatChannelSearch');
const selfChatChannelTitle = document.getElementById('selfChatChannelTitle');
const selfChatChannelTopic = document.getElementById('selfChatChannelTopic');
const selfChatNewChannelBtn = document.getElementById('selfChatNewChannelBtn');
const selfChatRenameChannelBtn = document.getElementById('selfChatRenameChannelBtn');
const selfChatDeleteChannelBtn = document.getElementById('selfChatDeleteChannelBtn');
const selfChatRoomForm = document.getElementById('selfChatRoomForm');
const selfChatRoomNameInput = document.getElementById('selfChatRoomNameInput');
const selfChatRoomCreateBtn = document.getElementById('selfChatRoomCreateBtn');
const selfChatRoomCancelBtn = document.getElementById('selfChatRoomCancelBtn');
const selfChatImageInput = document.getElementById('selfChatImageInput');
const selfChatAddImageBtn = document.getElementById('selfChatAddImageBtn');
const selfChatAttachmentPreview = document.getElementById('selfChatAttachmentPreview');
const selfChatPresetSelect = document.getElementById('selfChatPresetSelect');
const selfChatSystemPrompt = document.getElementById('selfChatSystemPrompt');
const selfChatUserPrompt = document.getElementById('selfChatUserPrompt');
const selfChatPromptInsertBtn = document.getElementById('selfChatPromptInsertBtn');
const selfChatPromptClearBtn = document.getElementById('selfChatPromptClearBtn');
const selfChatBuildContextBtn = document.getElementById('selfChatBuildContextBtn');
const selfChatInsertContextBtn = document.getElementById('selfChatInsertContextBtn');
const selfChatClearContextBtn = document.getElementById('selfChatClearContextBtn');
const selfChatContextInput = document.getElementById('selfChatContextInput');
const isChatOnlyWindow = new URLSearchParams(window.location.search).get('chat') === '1';
if (isChatOnlyWindow && document.body) {
  document.body.classList.add('chat-only');
}
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpPanel = document.getElementById('helpPanel');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const opacityRange = document.getElementById('opacityRange');
const opacityVal = document.getElementById('opacityVal');
const nativeTransparencyChk = document.getElementById('nativeTransparencyChk');
const alwaysOnTopChk = document.getElementById('alwaysOnTopChk');
const injectResizersChk = document.getElementById('injectResizersChk');
const linkSessionModeSelect = document.getElementById('linkSessionMode');
const persistSettingsChk = document.getElementById('persistSettingsChk');
const launchOnStartupChk = document.getElementById('launchOnStartupChk');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const openLayoutBtn = document.getElementById('openLayoutBtn');
const tagsInput = document.getElementById('tagsInput');
const folderInput = document.getElementById('folderInput');
const notesInput = document.getElementById('notesInput');
const prioritySelect = document.getElementById('prioritySelect');
const tagFiltersEl = document.getElementById('tagFilters');
const clearTagFiltersBtn = document.getElementById('clearTagFiltersBtn');
const bulkTagBtn = document.getElementById('bulkTagBtn');
const openAllBtn = document.getElementById('openAllBtn');
const restoreSelectedBtn = document.getElementById('restoreSelectedBtn');
const showDeletedBtn = document.getElementById('showDeletedBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const clipboardBanner = document.getElementById('clipboardBanner');
const clipboardBannerValue = document.getElementById('clipboardBannerValue');
const useClipboardLinkBtn = document.getElementById('useClipboardLinkBtn');
const dismissClipboardBannerBtn = document.getElementById('dismissClipboardBannerBtn');
const searchModeToggle = document.getElementById('searchModeToggle');
const groupingSelect = document.getElementById('groupingSelect');
const quickStatsEl = document.getElementById('quickStats');
const totalCountEl = document.getElementById('totalCount');
const pinnedCountEl = document.getElementById('pinnedCount');
const favoriteCountEl = document.getElementById('favoriteCount');
const metadataIndicator = document.getElementById('metadataIndicator');
const metadataIndicatorStatus = document.getElementById('metadataIndicatorStatus');
const healthIndicator = document.getElementById('healthIndicator');
const healthIndicatorStatus = document.getElementById('healthIndicatorStatus');
const workspaceList = document.getElementById('workspaceList');
const saveWorkspaceBtn = document.getElementById('saveWorkspaceBtn');
const quickAccessEl = document.getElementById('quickAccess');
const recentLinksEl = document.getElementById('recentLinks');
const frequentLinksEl = document.getElementById('frequentLinks');
const recentEmptyEl = document.getElementById('recentEmpty');
const frequentEmptyEl = document.getElementById('frequentEmpty');
const dropOverlay = document.getElementById('dropOverlay');
const commandPaletteOverlay = document.getElementById('commandPaletteOverlay');
const commandPalettePanel = document.getElementById('commandPalettePanel');
const commandPaletteInput = document.getElementById('commandPaletteInput');
const commandPaletteResults = document.getElementById('commandPaletteResults');
const commandPaletteCloseBtn = document.getElementById('commandPaletteCloseBtn');
const commandPaletteEditor = document.getElementById('commandPaletteEditor');
const paletteEditTitle = document.getElementById('paletteEditTitle');
const paletteEditUrl = document.getElementById('paletteEditUrl');
const paletteEditTags = document.getElementById('paletteEditTags');
const paletteEditFolder = document.getElementById('paletteEditFolder');
const paletteEditPriority = document.getElementById('paletteEditPriority');

const DEFAULT_APP_NAME = 'Transparent AI Client';
const DEFAULT_LANGUAGE = 'en';
const LOCALE_PATH = 'locales';
const LOCALE_FALLBACK = {
  'collapsible.collapse': 'Collapse',
  'collapsible.expand': 'Expand',
  'actions.fuzzySearch': 'Fuzzy search',
  'actions.exactSearch': 'Exact search'
};
let activeLanguage = DEFAULT_LANGUAGE;
let localeFallback = Object.assign({}, LOCALE_FALLBACK);
let localeStrings = Object.assign({}, LOCALE_FALLBACK);
const localeCache = new Map();

function normalizeLanguageCode(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : DEFAULT_LANGUAGE;
  return normalized === 'ko' ? 'ko' : 'en';
}

function formatMessage(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
    return String(vars[key]);
  });
}

function t(key, vars) {
  const template = localeStrings[key] || localeFallback[key] || key;
  return formatMessage(template, vars);
}

async function fetchLocale(lang) {
  const normalized = normalizeLanguageCode(lang);
  if (localeCache.has(normalized)) return localeCache.get(normalized);
  try {
    if (window.electron && typeof window.electron.readLocale === 'function') {
      const data = await window.electron.readLocale(normalized);
      if (data && typeof data === 'object') {
        localeCache.set(normalized, data);
        return data;
      }
    }
  } catch (err) {}
  try {
    const url = new URL(`${LOCALE_PATH}/${normalized}.json`, window.location.href);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Locale fetch failed');
    const data = await response.json();
    localeCache.set(normalized, data);
    return data;
  } catch (err) {
    return null;
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key || !('placeholder' in el)) return;
    el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    el.title = t(key);
  });
}

function refreshCollapsibleLabels() {
  collapsibleSections.forEach((section) => {
    if (!section) return;
    setSectionCollapsed(section, section.classList.contains('collapsed'), false);
  });
}

async function setLanguage(lang) {
  const normalized = normalizeLanguageCode(lang);
  activeLanguage = normalized;
  const fallback = await fetchLocale(DEFAULT_LANGUAGE);
  if (fallback) localeFallback = Object.assign({}, fallback);
  const current = normalized === DEFAULT_LANGUAGE ? fallback : await fetchLocale(normalized);
  localeStrings = Object.assign({}, localeFallback, current || {});
  applyTranslations();
  refreshCollapsibleLabels();
  applyLanguageSelection(normalized);
  syncSearchModeLabel();
  syncDeletedToggleLabel();
  try { renderTagFilters(); } catch (err) {}
  try { renderLinks(); } catch (err) {}
  try { renderQuickAccess(); } catch (err) {}
  try { renderQuickStats(); } catch (err) {}
}

function applyAppDisplayName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  const resolved = trimmed || DEFAULT_APP_NAME;
  if (appTitleEl) appTitleEl.textContent = resolved;
  document.title = resolved;
  if (appNameInput && document.activeElement !== appNameInput) {
    appNameInput.value = resolved;
  }
}

function applyLanguageSelection(value) {
  const normalized = normalizeLanguageCode(value);
  if (document.documentElement) {
    document.documentElement.lang = normalized;
  }
  if (languageSelect && document.activeElement !== languageSelect) {
    languageSelect.value = normalized;
  }
}
const paletteEditNotes = document.getElementById('paletteEditNotes');
const paletteEditSaveBtn = document.getElementById('paletteEditSaveBtn');
const paletteEditCancelBtn = document.getElementById('paletteEditCancelBtn');
const linksFilePathEl = document.getElementById('linksFilePath');
const chooseLinksFileBtn = document.getElementById('chooseLinksFileBtn');
const resetLinksFileBtn = document.getElementById('resetLinksFileBtn');
const openLinksFileBtn = document.getElementById('openLinksFileBtn');
const telemetryChk = document.getElementById('telemetryChk');
const developerModeChk = document.getElementById('developerModeChk');
const backgroundImagePathEl = document.getElementById('backgroundImagePath');
const chooseBackgroundBtn = document.getElementById('chooseBackgroundBtn');
const resetBackgroundBtn = document.getElementById('resetBackgroundBtn');
const dataCollectionStatus = document.getElementById('dataCollectionStatus');
const dataCollectionLog = document.getElementById('dataCollectionLog');
const dataCollectionEmpty = document.getElementById('dataCollectionEmpty');
const clearDataCollectionBtn = document.getElementById('clearDataCollectionBtn');
const collapsibleSections = Array.from(document.querySelectorAll('[data-collapsible]'));
const collapseStateKey = 'plana:collapsedSections';
let collapseState = {};
let initialRenderReported = false;
let developerModeEnabled = false;

function loadCollapseState() {
  try {
    const raw = localStorage.getItem(collapseStateKey);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveCollapseState() {
  try {
    localStorage.setItem(collapseStateKey, JSON.stringify(collapseState));
  } catch (err) {}
}

function setSectionCollapsed(section, collapsed, persist = true) {
  if (!section) return;
  section.classList.toggle('collapsed', collapsed);
  const toggle = section.querySelector('.section-toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.textContent = collapsed ? t('collapsible.expand') : t('collapsible.collapse');
  }
  if (!persist) return;
  const id = section.getAttribute('data-collapsible');
  if (!id) return;
  collapseState[id] = collapsed;
  saveCollapseState();
}

function initCollapsibleSections() {
  if (!collapsibleSections.length) return;
  collapseState = loadCollapseState();
  collapsibleSections.forEach((section) => {
    const toggle = section.querySelector('.section-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        setSectionCollapsed(section, !section.classList.contains('collapsed'), true);
      });
    }
    const id = section.getAttribute('data-collapsible');
    if (id && Object.prototype.hasOwnProperty.call(collapseState, id)) {
      setSectionCollapsed(section, !!collapseState[id], false);
    } else {
      setSectionCollapsed(section, false, false);
    }
  });
}

initCollapsibleSections();

function isEditableTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!target.isContentEditable;
}

function ensureSectionExpanded(id) {
  const section = document.querySelector(`[data-collapsible="${id}"]`);
  if (!section) return;
  if (section.classList.contains('collapsed')) {
    setSectionCollapsed(section, false, true);
  }
}

function toggleSettingsPanel() {
  if (!settingsPanel) return;
  settingsPanel.classList.toggle('hidden');
}

function toggleHelpOverlay() {
  if (!helpOverlay) return;
  if (helpOverlay.classList.contains('hidden')) openHelp();
  else closeHelp();
}

function focusCaptureInput() {
  if (!urlInput) return;
  ensureSectionExpanded('capture');
  urlInput.focus();
  if (typeof urlInput.select === 'function') urlInput.select();
}

function focusSearchInput() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  ensureSectionExpanded('links');
  input.focus();
  if (typeof input.select === 'function') input.select();
}

async function toggleSettingValue(key, checkbox) {
  if (!window.electron || typeof window.electron.setSetting !== 'function') return;
  let nextValue = null;
  if (checkbox) {
    nextValue = !checkbox.checked;
    checkbox.checked = nextValue;
  } else if (typeof window.electron.getSetting === 'function') {
    try {
      const current = await window.electron.getSetting(key);
      nextValue = !current;
    } catch (err) {
      nextValue = null;
    }
  }
  if (typeof nextValue === 'boolean') {
    await window.electron.setSetting(key, nextValue);
  }
}

async function adjustAppOpacity(delta) {
  if (!window.electron || typeof window.electron.getAppOpacity !== 'function') return;
  try {
    const current = await window.electron.getAppOpacity();
    if (typeof current !== 'number' || isNaN(current)) return;
    const nextValue = Math.max(0, Math.min(1, current + delta));
    await window.electron.setAppOpacity(nextValue);
  } catch (err) {
    // ignore
  }
}

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

let currentLinks = [];
let searchQuery = '';
const activeTagFilters = new Set();
let pinnedTags = [];
let searchMode = 'fuzzy';
let groupingMode = 'none';
let showDeleted = false;
let clipboardCandidate = null;
let clipboardDismissedToken = null;
let defaultLinksPath = null;
let workspaces = [];
let paletteResults = [];
let paletteSelection = 0;
let paletteEditingId = null;
let metadataActivityUntil = 0;
let healthActivityUntil = 0;
let lastMetadataStamp = 0;
let lastHealthStamp = 0;
let refreshIndicatorTimer = null;
const recentOpenHistory = new Map();
const RECENT_OPEN_UNDO_MS = 1000 * 60 * 5;

function syncSearchModeLabel() {
  if (!searchModeToggle) return;
  searchModeToggle.textContent = searchMode === 'fuzzy' ? t('actions.fuzzySearch') : t('actions.exactSearch');
  searchModeToggle.classList.toggle('active', searchMode === 'fuzzy');
}

function syncDeletedToggleLabel() {
  if (!showDeletedBtn) return;
  showDeletedBtn.textContent = showDeleted ? t('actions.showActive') : t('actions.showDeleted');
  showDeletedBtn.classList.toggle('active', showDeleted);
}

function syncBulkActionVisibility() {
  if (restoreSelectedBtn) restoreSelectedBtn.style.display = showDeleted ? '' : 'none';
  if (deleteSelectedBtn) deleteSelectedBtn.style.display = showDeleted ? 'none' : '';
  if (openAllBtn) openAllBtn.disabled = showDeleted;
  if (bulkTagBtn) bulkTagBtn.disabled = showDeleted;
}

function updateLinksFileDisplay(customPath) {
  if (!linksFilePathEl) return;
  if (customPath && customPath.trim()) {
    linksFilePathEl.textContent = customPath.trim();
  } else if (defaultLinksPath) {
    linksFilePathEl.textContent = t('settings.linksFileDefaultWithPath', { path: defaultLinksPath });
  } else {
    linksFilePathEl.textContent = t('settings.linksFileDefault');
  }
}

function normalizeBackgroundPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

function filePathToUrl(pathValue) {
  if (!pathValue) return '';
  const raw = String(pathValue).replace(/\\/g, '/');
  if (/^file:\/\//i.test(raw)) return raw;
  if (/^[a-zA-Z]:\//.test(raw)) {
    return `file:///${encodeURI(raw).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
  }
  return `file://${encodeURI(raw).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
}

function updateBackgroundDisplay(pathValue) {
  if (!backgroundImagePathEl) return;
  const normalized = normalizeBackgroundPath(pathValue);
  backgroundImagePathEl.textContent = normalized ? normalized : 'Default background';
}

function applyCustomBackground(pathValue) {
  const normalized = normalizeBackgroundPath(pathValue);
  updateBackgroundDisplay(normalized);
  const cssValue = normalized ? `url("${filePathToUrl(normalized)}")` : 'none';
  document.documentElement.style.setProperty('--custom-bg-image', cssValue);
}

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

function formatRelativeTime(ts) {
  if (!ts) return '';
  const parsed = Date.parse(ts);
  if (isNaN(parsed)) return '';
  const deltaMs = Date.now() - parsed;
  if (deltaMs < 60000) return t('time.justNow');
  if (deltaMs < 3600000) return t('time.minutesAgo', { count: Math.floor(deltaMs / 60000) });
  if (deltaMs < 86400000) return t('time.hoursAgo', { count: Math.floor(deltaMs / 3600000) });
  if (deltaMs < 86400000 * 7) return t('time.daysAgo', { count: Math.floor(deltaMs / 86400000) });
  return new Date(parsed).toLocaleDateString();
}

function getRecentLinks(limit = 5) {
  return currentLinks
    .filter((link) => !link.deletedAt && link.lastOpenedAt)
    .sort((a, b) => Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt))
    .slice(0, limit);
}

function getFrequentLinks(limit = 5) {
  return currentLinks
    .filter((link) => !link.deletedAt && (link.openCount || 0) > 0)
    .sort((a, b) => (b.openCount || 0) - (a.openCount || 0))
    .slice(0, limit);
}

function buildQuickAccessCard(link, metaText, options = {}) {
  const card = document.createElement('div');
  card.className = 'quick-access-card';
  card.dataset.id = link.id;

  const name = document.createElement('div');
  name.className = 'quick-access-name';
  name.textContent = link.title || link.url;
  card.appendChild(name);

  const url = document.createElement('div');
  url.className = 'quick-access-url';
  url.textContent = link.url;
  card.appendChild(url);

  if (metaText) {
    const meta = document.createElement('div');
    meta.className = 'quick-access-meta';
    meta.textContent = metaText;
    card.appendChild(meta);
  }

  const actions = document.createElement('div');
  actions.className = 'quick-access-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'action-btn';
  openBtn.textContent = t('actions.open');
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    recordLocalOpen(link.id);
    try {
      window.electron.openLinkWithId(Number(link.id), link.url);
    } catch (err) {
      window.electron.openLink(link.url);
    }
  });
  actions.appendChild(openBtn);

  const pinBtn = document.createElement('button');
  pinBtn.className = 'action-btn ghost';
  pinBtn.textContent = link.pinned ? t('actions.unpin') : t('actions.pin');
  pinBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await window.electron.setLinkPinned(link.id, !link.pinned);
    loadLinks();
  });
  actions.appendChild(pinBtn);

  if (options.undoAction && typeof options.undoAction.onClick === 'function') {
    const undoBtn = document.createElement('button');
    undoBtn.className = 'action-btn ghost';
    undoBtn.textContent = options.undoAction.label || t('actions.undo');
    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      options.undoAction.onClick();
    });
    actions.appendChild(undoBtn);
  }

  card.appendChild(actions);
  return card;
}

function renderQuickAccess() {
  if (!quickAccessEl || !recentLinksEl || !frequentLinksEl) return;

  const recents = getRecentLinks(5);
  const frequent = getFrequentLinks(5);

  recentLinksEl.innerHTML = '';
  frequentLinksEl.innerHTML = '';

  if (recents.length) {
    recents.forEach((link) => {
      const meta = link.lastOpenedAt ? t('quickAccess.lastOpened', { time: formatRelativeTime(link.lastOpenedAt) }) : '';
      const undoEntry = getUndoableOpen(link.id);
      const undoAction = undoEntry
        ? { label: t('actions.undo'), onClick: () => undoRecentOpen(link.id) }
        : null;
      recentLinksEl.appendChild(buildQuickAccessCard(link, meta, { undoAction }));
    });
    if (recentEmptyEl) recentEmptyEl.style.display = 'none';
  } else if (recentEmptyEl) {
    recentEmptyEl.style.display = 'block';
  }

  if (frequent.length) {
    frequent.forEach((link) => {
      const meta = t('quickAccess.openedCount', { count: link.openCount || 0 });
      frequentLinksEl.appendChild(buildQuickAccessCard(link, meta));
    });
    if (frequentEmptyEl) frequentEmptyEl.style.display = 'none';
  } else if (frequentEmptyEl) {
    frequentEmptyEl.style.display = 'block';
  }
}

function renderQuickStats() {
  if (!quickStatsEl || !totalCountEl || !pinnedCountEl || !favoriteCountEl) return;
  const activeLinks = currentLinks.filter((link) => !link.deletedAt);
  const total = activeLinks.length;
  const pinned = activeLinks.filter((link) => !!link.pinned).length;
  const favorites = activeLinks.filter((link) => !!link.favorite).length;
  totalCountEl.textContent = String(total);
  pinnedCountEl.textContent = String(pinned);
  favoriteCountEl.textContent = String(favorites);
}

function findLatestTimestamp(getter) {
  let latestMs = 0;
  let latestIso = '';
  currentLinks.forEach((link) => {
    const iso = getter(link);
    if (!iso) return;
    const parsed = Date.parse(iso);
    if (!isNaN(parsed) && parsed > latestMs) {
      latestMs = parsed;
      latestIso = iso;
    }
  });
  return { latestMs, latestIso };
}

function updateIndicator(indicatorEl, statusEl, options) {
  if (!indicatorEl || !statusEl) return;
  const { active, statusText, title } = options;
  indicatorEl.classList.toggle('active', !!active);
  statusEl.textContent = statusText;
  if (title) indicatorEl.title = title;
}

function updateRefreshIndicators() {
  if (!metadataIndicator || !metadataIndicatorStatus || !healthIndicator || !healthIndicatorStatus) return;
  const now = Date.now();
  const { latestMs: latestMetaMs, latestIso: latestMetaIso } = findLatestTimestamp(
    (link) => link && link.metadata && link.metadata.lastFetchedAt
  );
  const { latestMs: latestHealthMs, latestIso: latestHealthIso } = findLatestTimestamp(
    (link) => link && link.health && link.health.checkedAt
  );

  let metaQueued = false;
  let healthQueued = false;
  currentLinks.forEach((link) => {
    const metaNext = link && link.metadata && link.metadata.nextRetryAt;
    const healthNext = link && link.health && link.health.nextRetryAt;
    if (metaNext) {
      const ts = Date.parse(metaNext);
      if (!isNaN(ts) && ts > now) metaQueued = true;
    }
    if (healthNext) {
      const ts = Date.parse(healthNext);
      if (!isNaN(ts) && ts > now) healthQueued = true;
    }
  });

  if (latestMetaMs && latestMetaMs > lastMetadataStamp) {
    lastMetadataStamp = latestMetaMs;
    metadataActivityUntil = Math.max(metadataActivityUntil, now + 6000);
  }
  if (latestHealthMs && latestHealthMs > lastHealthStamp) {
    lastHealthStamp = latestHealthMs;
    healthActivityUntil = Math.max(healthActivityUntil, now + 6000);
  }

  const metadataActive = metaQueued || metadataActivityUntil > now;
  const healthActive = healthQueued || healthActivityUntil > now;

  const metaStatusIdle = latestMetaIso
    ? t('metadata.updated', { time: formatRelativeTime(latestMetaIso) })
    : t('status.notYet');
  const healthStatusIdle = latestHealthIso
    ? t('metadata.updated', { time: formatRelativeTime(latestHealthIso) })
    : t('status.notYet');
  const metaStatus = metaQueued ? t('status.queued') : (metadataActive ? t('status.refreshing') : metaStatusIdle);
  const healthStatus = healthQueued ? t('status.queued') : (healthActive ? t('status.refreshing') : healthStatusIdle);

  updateIndicator(metadataIndicator, metadataIndicatorStatus, {
    active: metadataActive,
    statusText: metaStatus,
    title: latestMetaIso
      ? t('metadata.indicatorTitleWithLast', { status: metaStatus, time: new Date(latestMetaIso).toLocaleString() })
      : t('metadata.indicatorTitle', { status: metaStatus })
  });
  updateIndicator(healthIndicator, healthIndicatorStatus, {
    active: healthActive,
    statusText: healthStatus,
    title: latestHealthIso
      ? t('health.indicatorTitleWithLast', { status: healthStatus, time: new Date(latestHealthIso).toLocaleString() })
      : t('health.indicatorTitle', { status: healthStatus })
  });

  if (metadataActive || healthActive) {
    if (!refreshIndicatorTimer) {
      refreshIndicatorTimer = setInterval(() => {
        updateRefreshIndicators();
        if (metadataActivityUntil <= Date.now() && healthActivityUntil <= Date.now()) {
          clearInterval(refreshIndicatorTimer);
          refreshIndicatorTimer = null;
        }
      }, 1000);
    }
  }
}

function bumpRefreshActivity(kind, ms = 4000) {
  const until = Date.now() + ms;
  if (kind === 'metadata') {
    metadataActivityUntil = Math.max(metadataActivityUntil, until);
  } else if (kind === 'health') {
    healthActivityUntil = Math.max(healthActivityUntil, until);
  }
  updateRefreshIndicators();
}

function recordLocalOpen(linkId) {
  const idx = currentLinks.findIndex((link) => Number(link.id) === Number(linkId));
  if (idx === -1) return;
  const link = Object.assign({}, currentLinks[idx]);
  if (link.deletedAt) return;
  recentOpenHistory.set(Number(linkId), {
    openCount: link.openCount || 0,
    lastOpenedAt: link.lastOpenedAt || null,
    ts: Date.now()
  });
  const count = Number(link.openCount);
  link.openCount = Number.isFinite(count) && count >= 0 ? count + 1 : 1;
  link.lastOpenedAt = new Date().toISOString();
  currentLinks[idx] = link;
  renderQuickAccess();
}

function getUndoableOpen(linkId) {
  const entry = recentOpenHistory.get(Number(linkId));
  if (!entry) return null;
  if ((Date.now() - entry.ts) > RECENT_OPEN_UNDO_MS) {
    recentOpenHistory.delete(Number(linkId));
    return null;
  }
  return entry;
}

async function undoRecentOpen(linkId) {
  const entry = getUndoableOpen(linkId);
  if (!entry || !window.electron || typeof window.electron.undoLinkOpen !== 'function') return;
  const ok = await window.electron.undoLinkOpen(linkId, {
    openCount: entry.openCount,
    lastOpenedAt: entry.lastOpenedAt
  });
  if (!ok) return;
  const idx = currentLinks.findIndex((link) => Number(link.id) === Number(linkId));
  if (idx !== -1) {
    currentLinks[idx] = Object.assign({}, currentLinks[idx], {
      openCount: entry.openCount,
      lastOpenedAt: entry.lastOpenedAt
    });
  }
  recentOpenHistory.delete(Number(linkId));
  renderQuickAccess();
  renderQuickStats();
}

function normalizeWorkspaces(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, idx) => {
    const name = entry && entry.name ? String(entry.name).trim() : t('workspaces.defaultName', { index: idx + 1 });
    const id = entry && entry.id ? entry.id : Date.now() + idx;
    const items = Array.isArray(entry && entry.items) ? entry.items : [];
    return {
      id,
      name,
      items,
      updatedAt: entry && entry.updatedAt ? entry.updatedAt : null,
      lastOpenedAt: entry && entry.lastOpenedAt ? entry.lastOpenedAt : null
    };
  });
}

function sortWorkspaces(list) {
  return list.slice().sort((a, b) => {
    const aTime = Date.parse(a.lastOpenedAt || a.updatedAt || 0);
    const bTime = Date.parse(b.lastOpenedAt || b.updatedAt || 0);
    return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
  });
}

function renderWorkspaces() {
  if (!workspaceList) return;
  workspaceList.innerHTML = '';
  if (!workspaces.length) {
    const empty = document.createElement('span');
    empty.className = 'tag-chip muted';
    empty.textContent = t('workspaces.none');
    workspaceList.appendChild(empty);
    return;
  }
  sortWorkspaces(workspaces).forEach((workspace) => {
    const chip = document.createElement('div');
    chip.className = 'workspace-chip';

    const name = document.createElement('span');
    name.textContent = workspace.name;
    chip.appendChild(name);

    const openBtn = document.createElement('button');
    openBtn.textContent = t('actions.open');
    openBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.openWorkspace(workspace.id);
      workspace.lastOpenedAt = new Date().toISOString();
      await window.electron.setSetting('workspaces', workspaces);
      renderWorkspaces();
      loadLinks();
    });
    chip.appendChild(openBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = t('actions.delete');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(t('confirm.deleteWorkspace', { name: workspace.name }))) return;
      workspaces = workspaces.filter((entry) => entry.id !== workspace.id);
      await window.electron.setSetting('workspaces', workspaces);
      renderWorkspaces();
    });
    chip.appendChild(deleteBtn);

    workspaceList.appendChild(chip);
  });
}

async function loadWorkspaces() {
  if (!window.electron || typeof window.electron.getSetting !== 'function') return;
  try {
    const stored = await window.electron.getSetting('workspaces');
    workspaces = normalizeWorkspaces(stored);
  } catch (err) {
    workspaces = [];
  }
  renderWorkspaces();
}

async function saveWorkspaceFromOpenWindows() {
  if (!window.electron || typeof window.electron.getOpenLinkWindows !== 'function') return;
  const openWindows = await window.electron.getOpenLinkWindows();
  if (!Array.isArray(openWindows) || openWindows.length === 0) {
    alert(t('alerts.noOpenWindows'));
    return;
  }
  const name = prompt(t('prompts.workspaceName'));
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const existingIdx = workspaces.findIndex((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
  if (existingIdx !== -1) {
    const ok = confirm(t('confirm.replaceWorkspace', { name: workspaces[existingIdx].name }));
    if (!ok) return;
  }

  const items = openWindows
    .filter((entry) => entry && entry.url)
    .map((entry) => ({
      id: entry.id || null,
      url: entry.url,
      bounds: entry.bounds || null
    }));

  const now = new Date().toISOString();
  const workspace = {
    id: existingIdx !== -1 ? workspaces[existingIdx].id : Date.now(),
    name: trimmed,
    items,
    updatedAt: now,
    lastOpenedAt: existingIdx !== -1 ? workspaces[existingIdx].lastOpenedAt : null
  };

  if (existingIdx !== -1) {
    workspaces.splice(existingIdx, 1, workspace);
  } else {
    workspaces = [workspace, ...workspaces];
  }

  await window.electron.setSetting('workspaces', workspaces);
  renderWorkspaces();
}

const selfChatSettingKey = 'selfChatRoomsV2';
const selfChatLegacyKey = 'selfChatNotes';
const selfChatLocalStorageKey = 'plana:selfChatRoomsV2';
const selfChatMaxEntries = 300;
const selfChatMaxChars = 2000;
const selfChatMaxRooms = 50;
const selfChatMaxImagesPerMessage = 4;
const selfChatMaxImageBytes = 2 * 1024 * 1024;
const promptPresets = [
  {
    id: 'research',
    system: 'You are a research assistant. Focus on accuracy, cite sources by title + URL, and surface unknowns.',
    user: 'Goal:\nAudience:\nScope:\nKey questions:\nOutput format:'
  },
  {
    id: 'summarize',
    system: 'You summarize clearly and concisely. Preserve key facts and avoid speculation.',
    user: 'Summarize for:\nLength:\nKey points to include:\nTone:'
  },
  {
    id: 'brainstorm',
    system: 'You are a creative ideation partner. Generate many options before refining.',
    user: 'Topic:\nConstraints:\nMust include:\nAvoid:\nOutput format:'
  },
  {
    id: 'email',
    system: 'You draft professional, friendly emails. Keep it concise and action-oriented.',
    user: 'Recipient:\nPurpose:\nKey details:\nCall to action:\nTone:'
  }
];
let selfChatState = null;
let selfChatRoomFilter = '';
let selfChatIdSeq = 0;
let selfChatPendingImages = [];

function createChatId(prefix) {
  selfChatIdSeq += 1;
  return `${prefix}-${Date.now()}-${selfChatIdSeq}`;
}

function getPromptPresetById(id) {
  return promptPresets.find((preset) => preset.id === id) || promptPresets[0];
}

function applyPromptPreset(presetId) {
  const preset = getPromptPresetById(presetId);
  if (!preset) return;
  if (selfChatSystemPrompt) selfChatSystemPrompt.value = preset.system || '';
  if (selfChatUserPrompt) selfChatUserPrompt.value = preset.user || '';
}

function buildPromptPayload() {
  const parts = [];
  const systemText = selfChatSystemPrompt ? selfChatSystemPrompt.value.trim() : '';
  const userText = selfChatUserPrompt ? selfChatUserPrompt.value.trim() : '';
  const contextText = selfChatContextInput ? selfChatContextInput.value.trim() : '';
  if (systemText) parts.push(`[System]\n${systemText}`);
  if (userText) parts.push(`[User]\n${userText}`);
  if (contextText) parts.push(`[Context]\n${contextText}`);
  return parts.join('\n\n').trim();
}

function insertPromptIntoInput() {
  if (!selfChatInput) return;
  const payload = buildPromptPayload();
  if (!payload) return;
  if (!selfChatInput.value.trim()) {
    selfChatInput.value = payload;
  } else {
    selfChatInput.value = `${selfChatInput.value.trim()}\n\n${payload}`;
  }
  selfChatInput.focus();
}

function clearPromptTools() {
  if (selfChatSystemPrompt) selfChatSystemPrompt.value = '';
  if (selfChatUserPrompt) selfChatUserPrompt.value = '';
  if (selfChatContextInput) selfChatContextInput.value = '';
}

function normalizeContextValue(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  return trimmed ? trimmed : '';
}

function buildLinkContextBlock(links) {
  if (!links.length) return '';
  const lines = [t('prompt.contextHeader')];
  links.forEach((link, idx) => {
    const title = normalizeContextValue(link.title) || normalizeContextValue(link.url);
    const url = normalizeContextValue(link.url);
    lines.push(`\n${idx + 1}. ${title}`);
    if (url) lines.push(`   URL: ${url}`);
    const siteName = normalizeContextValue(link.metadata && link.metadata.siteName);
    if (siteName) lines.push(`   Site: ${siteName}`);
    const description = normalizeContextValue(link.metadata && link.metadata.description);
    if (description) lines.push(`   Summary: ${description}`);
    const notes = normalizeContextValue(link.notes);
    if (notes) lines.push(`   Notes: ${notes}`);
    const folder = normalizeContextValue(link.folder);
    if (folder) lines.push(`   Folder: ${folder}`);
    const tags = Array.isArray(link.tags) && link.tags.length ? link.tags.join(', ') : '';
    if (tags) lines.push(`   Tags: ${tags}`);
    const priority = normalizeContextValue(link.priority);
    if (priority) lines.push(`   Priority: ${priority}`);
  });
  return lines.join('\n');
}

function buildContextFromSelection() {
  const ids = getSelectedLinkIds();
  if (!ids.length) {
    alert(t('alerts.noLinksForContext'));
    return;
  }
  const map = new Map(currentLinks.map((link) => [Number(link.id), link]));
  const selectedLinks = ids.map((id) => map.get(Number(id))).filter(Boolean);
  const contextBlock = buildLinkContextBlock(selectedLinks);
  if (selfChatContextInput) selfChatContextInput.value = contextBlock;
}

function insertContextIntoUserPrompt() {
  if (!selfChatUserPrompt || !selfChatContextInput) return;
  const contextText = selfChatContextInput.value.trim();
  if (!contextText) return;
  if (!selfChatUserPrompt.value.trim()) {
    selfChatUserPrompt.value = contextText;
  } else {
    selfChatUserPrompt.value = `${selfChatUserPrompt.value.trim()}\n\n${contextText}`;
  }
  selfChatUserPrompt.focus();
}

function normalizeSelfChatImages(raw) {
  if (!Array.isArray(raw)) return [];
  const images = [];
  raw.forEach((item) => {
    if (!item) return;
    if (typeof item === 'string') {
      const src = item.trim();
      if (!src) return;
      images.push({
        id: createChatId('img'),
        src,
        name: 'image',
        type: '',
        size: null
      });
      return;
    }
    if (typeof item === 'object' && typeof item.src === 'string') {
      const src = item.src.trim();
      if (!src) return;
      images.push({
        id: item.id ? String(item.id) : createChatId('img'),
        src,
        name: item.name ? String(item.name).trim() : 'image',
        type: item.type ? String(item.type) : '',
        size: typeof item.size === 'number' ? item.size : null
      });
    }
  });
  return images.slice(0, selfChatMaxImagesPerMessage);
}

function normalizeSelfChatEntries(raw) {
  if (!Array.isArray(raw)) return [];
  const normalized = [];
  raw.forEach((entry) => {
    if (typeof entry === 'string') {
      const text = entry.trim();
      if (!text) return;
      normalized.push({
        id: createChatId('msg'),
        text: text.slice(0, selfChatMaxChars),
        images: [],
        ts: null
      });
      return;
    }
    if (!entry || typeof entry !== 'object') return;
    const text = typeof entry.text === 'string' ? entry.text.trim() : '';
    const images = normalizeSelfChatImages(entry.images || entry.attachments || []);
    if (!text && !images.length) return;
    normalized.push({
      id: entry.id ? String(entry.id) : createChatId('msg'),
      text: text.slice(0, selfChatMaxChars),
      images,
      ts: entry.ts || null
    });
  });
  return normalized;
}

function createRoom(name, options = {}) {
  const cleanName = String(name || '').trim() || 'room';
  const messages = Array.isArray(options.messages) ? options.messages : [];
  const updatedAt = options.updatedAt || (messages.length ? messages[messages.length - 1].ts : null);
  return {
    id: createChatId('room'),
    name: cleanName,
    messages,
    createdAt: options.createdAt || new Date().toISOString(),
    updatedAt
  };
}

function createDefaultChatState() {
  const general = createRoom('general');
  return {
    version: 3,
    rooms: [general],
    activeRoomId: general.id
  };
}

function normalizeRoom(raw, idx) {
  if (!raw || typeof raw !== 'object') return null;
  const name = raw.name ? String(raw.name).trim() : `room-${idx + 1}`;
  const messages = normalizeSelfChatEntries(raw.messages || raw.entries || []);
  const updatedAt = raw.updatedAt || (messages.length ? messages[messages.length - 1].ts : null);
  return {
    id: raw.id ? String(raw.id) : createChatId('room'),
    name,
    messages,
    createdAt: raw.createdAt || null,
    updatedAt
  };
}

function normalizeLegacyChannel(raw, idx) {
  if (!raw || typeof raw !== 'object') return null;
  const name = raw.name ? String(raw.name).trim() : `room-${idx + 1}`;
  const messages = normalizeSelfChatEntries(raw.messages || raw.entries || []);
  const updatedAt = raw.updatedAt || (messages.length ? messages[messages.length - 1].ts : null);
  return {
    id: raw.id ? String(raw.id) : createChatId('legacy-ch'),
    name,
    messages,
    updatedAt
  };
}

function normalizeLegacyServer(raw, idx) {
  if (!raw || typeof raw !== 'object') return null;
  const name = raw.name ? String(raw.name).trim() : `Space ${idx + 1}`;
  const channels = Array.isArray(raw.channels) ? raw.channels.map(normalizeLegacyChannel).filter(Boolean) : [];
  const finalChannels = channels.length ? channels : [normalizeLegacyChannel({ name: 'lobby', messages: [] }, 0)].filter(Boolean);
  if (!finalChannels.length) return null;
  const lastActive = raw.lastActiveChannelId && finalChannels.some((ch) => ch.id === raw.lastActiveChannelId)
    ? raw.lastActiveChannelId
    : finalChannels[0].id;
  return {
    id: raw.id ? String(raw.id) : createChatId('legacy-srv'),
    name,
    channels: finalChannels,
    lastActiveChannelId: lastActive,
    createdAt: raw.createdAt || null
  };
}

function convertLegacyChatState(raw) {
  const servers = Array.isArray(raw.servers) ? raw.servers.map(normalizeLegacyServer).filter(Boolean) : [];
  if (!servers.length) return null;
  const rooms = [];
  let activeRoomId = null;
  servers.forEach((server) => {
    const usePrefix = server.channels.length > 1;
    server.channels.forEach((channel) => {
      const roomName = usePrefix ? `${server.name} / ${channel.name}` : server.name;
      const roomId = createChatId('room');
      rooms.push({
        id: roomId,
        name: roomName,
        messages: channel.messages,
        createdAt: server.createdAt || null,
        updatedAt: channel.updatedAt || null
      });
      if (raw.activeServerId === server.id && raw.activeChannelId === channel.id) {
        activeRoomId = roomId;
      }
    });
  });
  if (!rooms.length) return null;
  return {
    version: 3,
    rooms,
    activeRoomId: activeRoomId || rooms[0].id
  };
}

function normalizeSelfChatState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Array.isArray(raw.rooms)) {
    const rooms = raw.rooms.map(normalizeRoom).filter(Boolean);
    if (!rooms.length) return null;
    const activeRoomId = rooms.some((room) => room.id === raw.activeRoomId)
      ? raw.activeRoomId
      : rooms[0].id;
    return {
      version: 3,
      rooms,
      activeRoomId
    };
  }
  if (Array.isArray(raw.servers)) {
    return convertLegacyChatState(raw);
  }
  return null;
}

function loadSelfChatStateFromStorage() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(selfChatLocalStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeSelfChatState(parsed);
  } catch (err) {
    return null;
  }
}

function persistSelfChatStateToStorage(state) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(selfChatLocalStorageKey, JSON.stringify(state));
  } catch (err) {}
}

function getActiveRoom() {
  if (!selfChatState) return null;
  return selfChatState.rooms.find((room) => room.id === selfChatState.activeRoomId) || null;
}

function formatSelfChatTime(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString();
  } catch (err) {
    return '';
  }
}

function renderSelfChatRooms() {
  if (!selfChatChannelList) return;
  if (selfChatChannelSearch && selfChatChannelSearch.value !== selfChatRoomFilter) {
    selfChatChannelSearch.value = selfChatRoomFilter;
  }
  selfChatChannelList.innerHTML = '';
  if (!selfChatState || !selfChatState.rooms.length) {
    const empty = document.createElement('div');
    empty.className = 'chat-empty';
    empty.textContent = t('chat.roomsNone');
    selfChatChannelList.appendChild(empty);
    return;
  }
  const filter = selfChatRoomFilter.trim().toLowerCase();
  const rooms = filter
    ? selfChatState.rooms.filter((room) => room.name.toLowerCase().includes(filter))
    : selfChatState.rooms;
  if (!rooms.length) {
    const empty = document.createElement('div');
    empty.className = 'chat-empty';
    empty.textContent = t('chat.roomsNoMatch');
    selfChatChannelList.appendChild(empty);
    return;
  }
  rooms.forEach((room) => {
    const row = document.createElement('div');
    row.className = 'chat-channel';
    row.tabIndex = 0;
    if (room.id === selfChatState.activeRoomId) row.classList.add('active');

    const hash = document.createElement('span');
    hash.className = 'chat-channel-hash';
    hash.textContent = '#';
    row.appendChild(hash);

    const name = document.createElement('span');
    name.className = 'chat-channel-name';
    name.textContent = room.name;
    row.appendChild(name);

    const count = document.createElement('span');
    count.className = 'chat-channel-count';
    count.textContent = String(room.messages.length);
    row.appendChild(count);

    row.addEventListener('click', () => {
      setActiveRoom(room.id);
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') setActiveRoom(room.id);
    });
    selfChatChannelList.appendChild(row);
  });
}

function renderSelfChatHeader() {
  const room = getActiveRoom();
  if (selfChatChannelTitle) {
    selfChatChannelTitle.textContent = room ? room.name : t('chat.roomTitle');
  }
  if (selfChatChannelTopic) {
    if (!room) {
      selfChatChannelTopic.textContent = t('chat.pickRoom');
      return;
    }
    const messageCount = room.messages.length;
    let updatedLabel = t('chat.noUpdates');
    if (room.updatedAt) {
      const relative = formatRelativeTime(room.updatedAt);
      updatedLabel = relative ? `Updated ${relative}` : 'Updated recently';
    }
    selfChatChannelTopic.textContent = `${messageCount} message${messageCount === 1 ? '' : 's'} \u2022 ${updatedLabel}`;
  }
}

function renderSelfChatEntries() {
  if (!selfChatMessages) return;
  const room = getActiveRoom();
  if (!room || !room.messages.length) {
    const empty = document.createElement('div');
    empty.className = 'chat-empty';
    empty.textContent = room
      ? t('chat.noMessagesInRoom', { name: room.name })
      : t('chat.selectRoom');
    selfChatMessages.replaceChildren(empty);
    return;
  }
  const nodes = room.messages.map((entry, index) => {
    const row = document.createElement('div');
    row.className = 'chat-message';
    row.style.setProperty('--stagger', `${Math.min(index * 30, 240)}ms`);

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = t('chat.youInitial');
    row.appendChild(avatar);

    const body = document.createElement('div');
    body.className = 'chat-message-body';

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';

    const author = document.createElement('span');
    author.className = 'chat-message-author';
    author.textContent = t('chat.youLabel');
    meta.appendChild(author);

    const time = formatSelfChatTime(entry.ts);
    if (time) {
      const tsEl = document.createElement('span');
      tsEl.className = 'chat-time';
      tsEl.textContent = time;
      meta.appendChild(tsEl);
    }

    body.appendChild(meta);
    if (entry.text) {
      const text = document.createElement('div');
      text.className = 'chat-message-text';
      text.textContent = entry.text;
      body.appendChild(text);
    }
    if (Array.isArray(entry.images) && entry.images.length) {
      const imageWrap = document.createElement('div');
      imageWrap.className = 'chat-message-images';
      entry.images.forEach((image) => {
        if (!image || !image.src) return;
        const img = document.createElement('img');
        img.className = 'chat-message-image';
        img.src = image.src;
        img.alt = image.name || 'image';
        img.loading = 'lazy';
        imageWrap.appendChild(img);
      });
      if (imageWrap.childNodes.length) body.appendChild(imageWrap);
    }
    row.appendChild(body);

    return row;
  });
  selfChatMessages.replaceChildren(...nodes);
  selfChatMessages.scrollTop = selfChatMessages.scrollHeight;
}

function renderSelfChatAttachments() {
  if (!selfChatAttachmentPreview) return;
  if (!selfChatPendingImages.length) {
    selfChatAttachmentPreview.innerHTML = '';
    selfChatAttachmentPreview.classList.add('hidden');
    return;
  }
  const chips = selfChatPendingImages.map((image) => {
    const chip = document.createElement('div');
    chip.className = 'chat-attachment-chip';
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.name || 'image';
    chip.appendChild(img);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'chat-attachment-remove';
    remove.textContent = 'x';
    remove.title = 'Remove';
    remove.addEventListener('click', () => {
      selfChatPendingImages = selfChatPendingImages.filter((item) => item.id !== image.id);
      renderSelfChatAttachments();
    });
    chip.appendChild(remove);
    return chip;
  });
  selfChatAttachmentPreview.replaceChildren(...chips);
  selfChatAttachmentPreview.classList.remove('hidden');
}

function clearSelfChatAttachments() {
  selfChatPendingImages = [];
  renderSelfChatAttachments();
}

function openSelfChatRoomForm() {
  if (!selfChatRoomForm) return;
  if (selfChatState && selfChatState.rooms.length >= selfChatMaxRooms) {
    alert(t('alerts.maxRooms'));
    return;
  }
  selfChatRoomForm.classList.remove('hidden');
  if (selfChatRoomNameInput) {
    selfChatRoomNameInput.value = '';
    selfChatRoomNameInput.focus();
  }
}

function closeSelfChatRoomForm() {
  if (!selfChatRoomForm) return;
  selfChatRoomForm.classList.add('hidden');
  if (selfChatRoomNameInput) selfChatRoomNameInput.value = '';
}

function submitSelfChatRoomForm() {
  if (!selfChatState || !selfChatRoomNameInput) return;
  const trimmed = selfChatRoomNameInput.value.trim();
  if (!trimmed) {
    alert(t('alerts.roomNameRequired'));
    selfChatRoomNameInput.focus();
    return;
  }
  if (selfChatState.rooms.length >= selfChatMaxRooms) {
    alert(t('alerts.maxRooms'));
    return;
  }
  const room = createRoom(trimmed);
  selfChatState.rooms = [...selfChatState.rooms, room];
  selfChatState.activeRoomId = room.id;
  selfChatRoomFilter = '';
  if (selfChatChannelSearch) selfChatChannelSearch.value = '';
  renderSelfChat();
  persistSelfChatState();
  closeSelfChatRoomForm();
}

function renderSelfChat() {
  renderSelfChatRooms();
  renderSelfChatHeader();
  renderSelfChatEntries();
  renderSelfChatAttachments();
}

async function persistSelfChatState() {
  if (!selfChatState) return;
  persistSelfChatStateToStorage(selfChatState);
  if (!window.electron || typeof window.electron.setSetting !== 'function') return;
  try {
    await window.electron.setSetting(selfChatSettingKey, selfChatState);
  } catch (err) {}
}

function setActiveRoom(roomId) {
  if (!selfChatState) return;
  const room = selfChatState.rooms.find((entry) => entry.id === roomId);
  if (!room) return;
  selfChatRoomFilter = '';
  if (selfChatChannelSearch) selfChatChannelSearch.value = '';
  selfChatState.activeRoomId = room.id;
  clearSelfChatAttachments();
  renderSelfChatRooms();
  renderSelfChatHeader();
  renderSelfChatEntries();
  persistSelfChatState();
}

function addSelfChatEntry(text, images = []) {
  const trimmed = text.trim();
  const normalizedImages = normalizeSelfChatImages(images);
  if (!trimmed && !normalizedImages.length) return;
  const room = getActiveRoom();
  if (!room) return;
  const entry = {
    id: createChatId('msg'),
    text: trimmed.slice(0, selfChatMaxChars),
    images: normalizedImages,
    ts: new Date().toISOString()
  };
  room.messages = [...room.messages, entry].slice(-selfChatMaxEntries);
  room.updatedAt = entry.ts;
  renderSelfChatEntries();
  renderSelfChatHeader();
  renderSelfChatRooms();
  persistSelfChatState();
}

function appendPendingImage(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) return;
  if (selfChatPendingImages.length >= selfChatMaxImagesPerMessage) {
    alert(t('alerts.maxImages'));
    return;
  }
  if (file.size > selfChatMaxImageBytes) {
    alert(t('alerts.imageTooLarge'));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    if (typeof src !== 'string') return;
    selfChatPendingImages = [
      ...selfChatPendingImages,
      {
        id: createChatId('img'),
        src,
        name: file.name || 'image',
        type: file.type || '',
        size: file.size
      }
    ];
    renderSelfChatAttachments();
  };
  reader.readAsDataURL(file);
}

function queuePendingImages(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  list.forEach((file) => appendPendingImage(file));
}

function openSelfChat() {
  if (!selfChatOverlay) return;
  selfChatOverlay.classList.remove('hidden');
  selfChatOverlay.setAttribute('aria-hidden', 'false');
  renderSelfChat();
  if (selfChatInput) selfChatInput.focus();
}

function closeSelfChat() {
  if (isChatOnlyWindow) {
    if (window.electron && typeof window.electron.closeCurrentWindow === 'function') {
      window.electron.closeCurrentWindow();
    }
    return;
  }
  if (!selfChatOverlay) return;
  closeSelfChatRoomForm();
  clearSelfChatAttachments();
  selfChatOverlay.classList.add('hidden');
  selfChatOverlay.setAttribute('aria-hidden', 'true');
}

async function initSelfChat() {
  if (!selfChatOverlay) return;
  let nextState = null;
  if (window.electron && typeof window.electron.getSetting === 'function') {
    try {
      const stored = await window.electron.getSetting(selfChatSettingKey);
      nextState = normalizeSelfChatState(stored);
    } catch (err) {
      nextState = null;
    }
    if (!nextState) {
      let legacyEntries = [];
      try {
        const legacy = await window.electron.getSetting(selfChatLegacyKey);
        legacyEntries = normalizeSelfChatEntries(legacy);
      } catch (err) {
        legacyEntries = [];
      }
      nextState = createDefaultChatState();
      if (legacyEntries.length && nextState.rooms.length) {
        const room = nextState.rooms[0];
        room.messages = legacyEntries.slice(-selfChatMaxEntries);
        room.updatedAt = room.messages.length ? room.messages[room.messages.length - 1].ts : null;
      }
      try {
        await window.electron.setSetting(selfChatSettingKey, nextState);
      } catch (err) {}
    }
  }
  if (!nextState) {
    nextState = loadSelfChatStateFromStorage();
  }
  if (!nextState) nextState = createDefaultChatState();
  selfChatState = nextState;
  persistSelfChatStateToStorage(selfChatState);
  renderSelfChat();
  if (isChatOnlyWindow) {
    openSelfChat();
  }

  if (selfChatBtn) {
    selfChatBtn.addEventListener('click', () => {
      if (!isChatOnlyWindow && window.electron && typeof window.electron.openChatWindow === 'function') {
        window.electron.openChatWindow();
        return;
      }
      openSelfChat();
    });
  }

  if (selfChatCloseBtn) {
    selfChatCloseBtn.addEventListener('click', () => {
      closeSelfChat();
    });
  }

  if (selfChatNewChannelBtn) {
    selfChatNewChannelBtn.addEventListener('click', () => {
      openSelfChatRoomForm();
    });
  }

  if (selfChatRoomCreateBtn) {
    selfChatRoomCreateBtn.addEventListener('click', () => {
      submitSelfChatRoomForm();
    });
  }

  if (selfChatRoomCancelBtn) {
    selfChatRoomCancelBtn.addEventListener('click', () => {
      closeSelfChatRoomForm();
    });
  }

  if (selfChatRoomNameInput) {
    selfChatRoomNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitSelfChatRoomForm();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSelfChatRoomForm();
      }
    });
  }

  if (selfChatRenameChannelBtn) {
    selfChatRenameChannelBtn.addEventListener('click', () => {
      const room = getActiveRoom();
      if (!room) return;
      const name = prompt(t('prompts.renameRoom'), room.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (trimmed) room.name = trimmed;
      room.updatedAt = new Date().toISOString();
      renderSelfChat();
      persistSelfChatState();
    });
  }

  if (selfChatDeleteChannelBtn) {
    selfChatDeleteChannelBtn.addEventListener('click', () => {
      if (!selfChatState) return;
      const room = getActiveRoom();
      if (!room) return;
      if (selfChatState.rooms.length <= 1) {
        alert(t('alerts.keepOneRoom'));
        return;
      }
      if (!confirm(t('confirm.deleteRoom', { name: room.name }))) return;
      selfChatState.rooms = selfChatState.rooms.filter((entry) => entry.id !== room.id);
      selfChatState.activeRoomId = selfChatState.rooms[0].id;
      selfChatRoomFilter = '';
      if (selfChatChannelSearch) selfChatChannelSearch.value = '';
      renderSelfChat();
      persistSelfChatState();
    });
  }

  if (selfChatClearBtn) {
    selfChatClearBtn.addEventListener('click', () => {
      const room = getActiveRoom();
      if (!room) return;
      if (!confirm(t('confirm.clearRoom', { name: room.name }))) return;
      room.messages = [];
      room.updatedAt = null;
      renderSelfChat();
      persistSelfChatState();
    });
  }

  if (selfChatSendBtn) {
    selfChatSendBtn.addEventListener('click', () => {
      if (!selfChatInput) return;
      addSelfChatEntry(selfChatInput.value || '', selfChatPendingImages);
      selfChatInput.value = '';
      clearSelfChatAttachments();
      selfChatInput.focus();
    });
  }

  if (selfChatPresetSelect) {
    selfChatPresetSelect.addEventListener('change', (e) => {
      applyPromptPreset(e.target.value || 'research');
    });
    const systemEmpty = !selfChatSystemPrompt || !selfChatSystemPrompt.value.trim();
    const userEmpty = !selfChatUserPrompt || !selfChatUserPrompt.value.trim();
    if (systemEmpty && userEmpty) {
      applyPromptPreset(selfChatPresetSelect.value || 'research');
    }
  }

  if (selfChatPromptInsertBtn) {
    selfChatPromptInsertBtn.addEventListener('click', () => {
      insertPromptIntoInput();
    });
  }

  if (selfChatPromptClearBtn) {
    selfChatPromptClearBtn.addEventListener('click', () => {
      clearPromptTools();
    });
  }

  if (selfChatBuildContextBtn) {
    selfChatBuildContextBtn.addEventListener('click', () => {
      buildContextFromSelection();
    });
  }

  if (selfChatInsertContextBtn) {
    selfChatInsertContextBtn.addEventListener('click', () => {
      insertContextIntoUserPrompt();
    });
  }

  if (selfChatClearContextBtn) {
    selfChatClearContextBtn.addEventListener('click', () => {
      if (selfChatContextInput) selfChatContextInput.value = '';
    });
  }

  if (selfChatInput) {
    selfChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addSelfChatEntry(selfChatInput.value || '', selfChatPendingImages);
        selfChatInput.value = '';
        clearSelfChatAttachments();
        selfChatInput.focus();
      }
    });
    selfChatInput.addEventListener('paste', (e) => {
      const items = e.clipboardData && e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
      const imageFiles = items
        .filter((item) => item.type && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);
      if (!imageFiles.length) return;
      e.preventDefault();
      queuePendingImages(imageFiles);
    });
  }

  if (selfChatAddImageBtn && selfChatImageInput) {
    selfChatAddImageBtn.addEventListener('click', () => {
      selfChatImageInput.click();
    });
  }

  if (selfChatImageInput) {
    selfChatImageInput.addEventListener('change', (e) => {
      queuePendingImages(e.target.files);
      e.target.value = '';
    });
  }

  if (selfChatChannelSearch) {
    selfChatChannelSearch.addEventListener('input', (e) => {
      selfChatRoomFilter = e.target.value || '';
      renderSelfChatRooms();
    });
  }

  selfChatOverlay.addEventListener('click', (e) => {
    if (isChatOnlyWindow) return;
    if (e.target === selfChatOverlay) closeSelfChat();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selfChatOverlay && !selfChatOverlay.classList.contains('hidden')) {
      if (isChatOnlyWindow) {
        closeSelfChat();
        return;
      }
      closeSelfChat();
    }
  });

  if (window.electron && typeof window.electron.onSettingChanged === 'function') {
    window.electron.onSettingChanged((key, value) => {
      if (key !== selfChatSettingKey) return;
      const normalized = normalizeSelfChatState(value) || createDefaultChatState();
      selfChatState = normalized;
      persistSelfChatStateToStorage(selfChatState);
      renderSelfChat();
    });
  }
}

function openHelp() {
  if (!helpOverlay) return;
  helpOverlay.classList.remove('hidden');
  helpOverlay.setAttribute('aria-hidden', 'false');
  if (helpCloseBtn) helpCloseBtn.focus();
}

function closeHelp() {
  if (!helpOverlay) return;
  helpOverlay.classList.add('hidden');
  helpOverlay.setAttribute('aria-hidden', 'true');
}

function initHelp() {
  if (!helpOverlay || !helpBtn) return;
  helpBtn.addEventListener('click', () => {
    openHelp();
  });

  if (helpCloseBtn) {
    helpCloseBtn.addEventListener('click', () => {
      closeHelp();
    });
  }

  helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) closeHelp();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && helpOverlay && !helpOverlay.classList.contains('hidden')) {
      e.preventDefault();
      closeHelp();
    }
  });
}

const dataCollectionEntries = [];
const dataCollectionMaxEntries = 120;
let dataCollectionEnabled = false;

function updateDataCollectionStatus(enabled) {
  dataCollectionEnabled = !!enabled;
  if (dataCollectionStatus) {
    dataCollectionStatus.textContent = dataCollectionEnabled
      ? t('dataCollection.statusOn')
      : t('dataCollection.statusOff');
    dataCollectionStatus.classList.toggle('active', dataCollectionEnabled);
  }
  if (dataCollectionLog) {
    dataCollectionLog.classList.toggle('disabled', !dataCollectionEnabled);
  }
}

function formatDataCollectionTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch (err) {
    return '';
  }
}

function buildDataCollectionSummary(entry) {
  if (!entry || !entry.kind) return t('dataCollection.event');
  if (entry.kind === 'telemetry-state') {
    return entry.enabled ? t('dataCollection.telemetryEnabled') : t('dataCollection.telemetryDisabled');
  }
  if (entry.kind === 'network-request') {
    const purpose = entry.purpose ? t('dataCollection.networkPurpose', { purpose: entry.purpose }) : '';
    return `${entry.method || 'GET'} ${entry.url || ''}${purpose}`.trim();
  }
  if (entry.kind === 'network-response') {
    const status = entry.statusCode ? t('health.httpStatus', { code: entry.statusCode }) : t('dataCollection.response');
    const duration = typeof entry.durationMs === 'number'
      ? t('dataCollection.responseTime', { ms: entry.durationMs })
      : '';
    return `${status}${duration}`.trim();
  }
  if (entry.kind === 'network-error') {
    return entry.message ? t('dataCollection.networkErrorWithMessage', { message: entry.message }) : t('dataCollection.networkError');
  }
  return entry.kind;
}

function buildDataCollectionDetails(entry) {
  if (!entry || !entry.kind) return null;
  if (entry.kind === 'telemetry-state') {
    return {
      enabled: entry.enabled,
      submitURL: entry.submitURL,
      config: entry.config || null,
      note: entry.note || null,
      source: entry.source || null
    };
  }
  if (entry.kind === 'network-request') {
    return {
      requestId: entry.requestId || null,
      purpose: entry.purpose || null,
      method: entry.method || null,
      url: entry.url || null,
      headers: entry.headers || null,
      timeoutMs: entry.timeoutMs || null,
      context: entry.context || null
    };
  }
  if (entry.kind === 'network-response') {
    return {
      requestId: entry.requestId || null,
      statusCode: entry.statusCode || null,
      contentType: entry.contentType || null,
      bytes: entry.bytes || null,
      durationMs: entry.durationMs || null
    };
  }
  if (entry.kind === 'network-error') {
    return {
      requestId: entry.requestId || null,
      message: entry.message || null,
      durationMs: entry.durationMs || null
    };
  }
  return null;
}

function buildDataCollectionItem(entry) {
  const item = document.createElement('div');
  item.className = 'data-collection-item';

  const header = document.createElement('div');
  header.className = 'data-collection-item-header';

  const kind = document.createElement('span');
  kind.className = 'data-collection-kind';
  if (entry && entry.kind === 'network-error') kind.classList.add('error');
  if (entry && entry.kind === 'network-response') kind.classList.add('response');
  if (entry && entry.kind === 'telemetry-state') kind.classList.add('telemetry');
  kind.textContent = entry && entry.kind ? entry.kind.replace(/-/g, ' ') : 'event';

  const time = document.createElement('span');
  time.textContent = formatDataCollectionTime(entry && entry.ts);

  header.appendChild(kind);
  header.appendChild(time);

  const summary = document.createElement('div');
  summary.className = 'data-collection-summary';
  summary.textContent = buildDataCollectionSummary(entry);

  item.appendChild(header);
  item.appendChild(summary);

  const details = buildDataCollectionDetails(entry);
  if (details) {
    const pre = document.createElement('pre');
    pre.className = 'data-collection-details';
    pre.textContent = JSON.stringify(details, null, 2);
    item.appendChild(pre);
  }

  return item;
}

function renderDataCollectionLog() {
  if (!dataCollectionLog) return;
  if (!dataCollectionEntries.length) {
    if (dataCollectionEmpty) {
      dataCollectionLog.replaceChildren(dataCollectionEmpty);
    } else {
      const empty = document.createElement('div');
      empty.className = 'data-collection-empty';
      empty.textContent = t('dataCollection.none');
      dataCollectionLog.replaceChildren(empty);
    }
    return;
  }
  const items = dataCollectionEntries.map((entry) => buildDataCollectionItem(entry));
  dataCollectionLog.replaceChildren(...items);
}

function appendDataCollectionEntry(entry) {
  if (!entry) return;
  dataCollectionEntries.push(entry);
  if (dataCollectionEntries.length > dataCollectionMaxEntries) {
    dataCollectionEntries.shift();
  }
  renderDataCollectionLog();
  if (dataCollectionLog) {
    dataCollectionLog.scrollTop = dataCollectionLog.scrollHeight;
  }
}

function initDataCollectionDebugger() {
  if (!dataCollectionLog || !window.electron) return;
  if (clearDataCollectionBtn) {
    clearDataCollectionBtn.addEventListener('click', () => {
      dataCollectionEntries.length = 0;
      renderDataCollectionLog();
    });
  }
  if (typeof window.electron.getSetting === 'function') {
    window.electron.getSetting('telemetryEnabled')
      .then((value) => updateDataCollectionStatus(!!value))
      .catch(() => {});
  }
  if (typeof window.electron.onDataCollectionEvent === 'function') {
    window.electron.onDataCollectionEvent((entry) => {
      appendDataCollectionEntry(entry);
    });
  }
  if (typeof window.electron.onSettingChanged === 'function') {
    window.electron.onSettingChanged((key, value) => {
      if (key === 'telemetryEnabled') updateDataCollectionStatus(!!value);
    });
  }
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
  const sourceLinks = showDeleted
    ? currentLinks.filter((link) => link.deletedAt)
    : currentLinks.filter((link) => !link.deletedAt);
  sourceLinks.forEach((link) => {
    (link.tags || []).forEach((tag) => {
      if (!tag) return;
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (tagCounts.size === 0) {
    activeTagFilters.clear();
    const emptyChip = document.createElement('span');
    emptyChip.className = 'tag-chip muted';
    emptyChip.textContent = t('tags.none');
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
      button.title = isPinned ? t('tags.pinnedHint') : t('tags.pinHint');
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

  renderSection(pinnedList.length ? t('tags.pinnedSection') : null, pinnedList);
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
  let filtered = currentLinks.filter((link) => showDeleted ? link.deletedAt : !link.deletedAt);
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

function isCommandPaletteOpen() {
  return commandPaletteOverlay && !commandPaletteOverlay.classList.contains('hidden');
}

function getPaletteMatches(query) {
  const trimmed = query.trim();
  const sourceLinks = showDeleted
    ? currentLinks.filter((link) => link.deletedAt)
    : currentLinks.filter((link) => !link.deletedAt);
  if (!trimmed) {
    const recents = getRecentLinks(8);
    if (recents.length) return recents;
    return sourceLinks.slice(0, 8);
  }
  const scored = sourceLinks
    .map((link) => ({ link, score: computeFuzzyScore(link, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.link).slice(0, 20);
}

function renderCommandPaletteResults() {
  if (!commandPaletteResults) return;
  commandPaletteResults.innerHTML = '';
  if (!paletteResults.length) {
    const empty = document.createElement('div');
    empty.className = 'palette-empty';
    empty.textContent = t('links.noMatches');
    commandPaletteResults.appendChild(empty);
    return;
  }

  paletteResults.forEach((link, idx) => {
    const row = document.createElement('div');
    row.className = `palette-item${idx === paletteSelection ? ' selected' : ''}`;
    row.dataset.id = link.id;

    const info = document.createElement('div');
    info.className = 'palette-item-info';
    const title = document.createElement('div');
    title.className = 'palette-item-title';
    title.textContent = link.title || link.url;
    const url = document.createElement('div');
    url.className = 'palette-item-url';
    url.textContent = link.url;
    info.appendChild(title);
    info.appendChild(url);

    const actions = document.createElement('div');
    actions.className = 'palette-item-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'palette-action';
    openBtn.textContent = t('actions.open');
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      recordLocalOpen(link.id);
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
      closeCommandPalette();
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'palette-action';
    editBtn.textContent = t('actions.edit');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPaletteEditor(link);
    });

    const tagBtn = document.createElement('button');
    tagBtn.className = 'palette-action';
    tagBtn.textContent = t('actions.tag');
    tagBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const value = prompt(t('placeholders.tagsComma'), formatTagsForInput(link.tags));
      if (value === null) return;
      const tags = normalizeTagsInput(value);
      await window.electron.updateLink({ id: link.id, tags });
      loadLinks();
    });

    const pinBtn = document.createElement('button');
    pinBtn.className = 'palette-action';
    pinBtn.textContent = link.pinned ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.setLinkPinned(link.id, !link.pinned);
      loadLinks();
    });

    actions.appendChild(openBtn);
    actions.appendChild(editBtn);
    actions.appendChild(tagBtn);
    actions.appendChild(pinBtn);

    row.appendChild(info);
    row.appendChild(actions);

    row.addEventListener('click', () => {
      paletteSelection = idx;
      renderCommandPaletteResults();
    });

    row.addEventListener('dblclick', () => {
      recordLocalOpen(link.id);
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
      closeCommandPalette();
    });

    commandPaletteResults.appendChild(row);
  });
}

function updateCommandPaletteResults() {
  if (!commandPaletteInput) return;
  paletteResults = getPaletteMatches(commandPaletteInput.value || '');
  if (paletteSelection >= paletteResults.length) paletteSelection = 0;
  renderCommandPaletteResults();
}

function openPaletteEditor(link) {
  if (!commandPaletteEditor || !link) return;
  paletteEditingId = link.id;
  if (paletteEditTitle) paletteEditTitle.value = link.title || '';
  if (paletteEditUrl) paletteEditUrl.value = link.url || '';
  if (paletteEditTags) paletteEditTags.value = formatTagsForInput(link.tags);
  if (paletteEditFolder) paletteEditFolder.value = link.folder || '';
  if (paletteEditPriority) paletteEditPriority.value = link.priority || 'normal';
  if (paletteEditNotes) paletteEditNotes.value = link.notes || '';
  commandPaletteEditor.classList.remove('hidden');
}

function closePaletteEditor() {
  paletteEditingId = null;
  if (commandPaletteEditor) commandPaletteEditor.classList.add('hidden');
}

async function savePaletteEdit() {
  if (!paletteEditingId) return;
  const payload = {
    id: paletteEditingId,
    title: paletteEditTitle ? paletteEditTitle.value.trim() : '',
    url: paletteEditUrl ? paletteEditUrl.value.trim() : '',
    tags: paletteEditTags ? normalizeTagsInput(paletteEditTags.value) : [],
    folder: paletteEditFolder ? paletteEditFolder.value.trim() : '',
    notes: paletteEditNotes ? paletteEditNotes.value.trim() : '',
    priority: paletteEditPriority ? paletteEditPriority.value : 'normal'
  };
  if (!payload.url) {
    alert(t('alerts.urlRequired'));
    return;
  }
  const ok = await window.electron.updateLink(payload);
  if (ok) {
    closePaletteEditor();
    loadLinks();
    updateCommandPaletteResults();
  }
}

function openCommandPalette() {
  if (!commandPaletteOverlay) return;
  commandPaletteOverlay.classList.remove('hidden');
  commandPaletteOverlay.setAttribute('aria-hidden', 'false');
  paletteSelection = 0;
  closePaletteEditor();
  if (commandPaletteInput) {
    commandPaletteInput.value = '';
    commandPaletteInput.focus();
  }
  updateCommandPaletteResults();
}

function closeCommandPalette() {
  if (!commandPaletteOverlay) return;
  commandPaletteOverlay.classList.add('hidden');
  commandPaletteOverlay.setAttribute('aria-hidden', 'true');
  closePaletteEditor();
}

function toggleCommandPalette() {
  if (isCommandPaletteOpen()) closeCommandPalette();
  else openCommandPalette();
}

// Event listeners
addBtn.addEventListener('click', addLink);

if (importClipboardBtn) {
  importClipboardBtn.addEventListener('click', async () => {
    if (!window.electron || typeof window.electron.importClipboardLinks !== 'function') return;
    const tags = tagsInput ? normalizeTagsInput(tagsInput.value) : [];
    const folder = folderInput ? folderInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';
    const priority = prioritySelect ? prioritySelect.value : 'normal';
    const res = await window.electron.importClipboardLinks({ tags, folder, notes, priority });
    if (!res || res.total === 0) {
      alert(t('alerts.clipboardEmpty'));
      return;
    }
    if (res.added === 0) {
      alert(t('alerts.clipboardNoValidLinks'));
      return;
    }
    alert(t('alerts.clipboardImported', { count: res.added }));
    loadLinks();
  });
}
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

if (commandPaletteInput) {
  commandPaletteInput.addEventListener('input', () => {
    paletteSelection = 0;
    updateCommandPaletteResults();
  });

  commandPaletteInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (paletteResults.length) {
        paletteSelection = (paletteSelection + 1) % paletteResults.length;
        renderCommandPaletteResults();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (paletteResults.length) {
        paletteSelection = (paletteSelection - 1 + paletteResults.length) % paletteResults.length;
        renderCommandPaletteResults();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const link = paletteResults[paletteSelection];
      if (!link) return;
      recordLocalOpen(link.id);
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
      closeCommandPalette();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
    }
  });
}

if (commandPaletteCloseBtn) {
  commandPaletteCloseBtn.addEventListener('click', () => {
    closeCommandPalette();
  });
}

if (commandPaletteOverlay) {
  commandPaletteOverlay.addEventListener('click', (e) => {
    if (e.target === commandPaletteOverlay) closeCommandPalette();
  });
}

if (paletteEditSaveBtn) {
  paletteEditSaveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    savePaletteEdit();
  });
}

if (paletteEditCancelBtn) {
  paletteEditCancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closePaletteEditor();
  });
}

document.addEventListener('keydown', (e) => {
  const isModifier = e.ctrlKey || e.metaKey;
  if (isModifier && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    toggleCommandPalette();
  }
  if (e.key === 'Escape' && isCommandPaletteOpen()) {
    e.preventDefault();
    closeCommandPalette();
  }
  if (e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && (e.key === 'h' || e.key === 'H')) {
    e.preventDefault();
    toggleHelpOverlay();
    return;
  }

  const isCtrlAlt = e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey;
  if (!isCtrlAlt || isEditableTarget(e.target) || isCommandPaletteOpen()) return;
  const key = String(e.key || '').toLowerCase();
  if (key === 'o') {
    e.preventDefault();
    toggleSettingsPanel();
    return;
  }
  if (key === 'f') {
    e.preventDefault();
    focusSearchInput();
    return;
  }
  if (key === 'l') {
    e.preventDefault();
    focusCaptureInput();
    return;
  }
  if (key === 't') {
    e.preventDefault();
    toggleSettingValue('alwaysOnTop', alwaysOnTopChk);
    return;
  }
  if (key === 'i') {
    e.preventDefault();
    toggleSettingValue('injectResizers', injectResizersChk);
    return;
  }
  if (e.key === '[' || e.code === 'BracketLeft') {
    e.preventDefault();
    adjustAppOpacity(-0.05);
    return;
  }
  if (e.key === ']' || e.code === 'BracketRight') {
    e.preventDefault();
    adjustAppOpacity(0.05);
    return;
  }
});

minimizeBtn.addEventListener('click', () => {
  window.electron.minimizeWindow();
});

closeBtn.addEventListener('click', () => {
  window.electron.closeWindow();
});

resetBtn.addEventListener('click', () => {
  if (window.electron && typeof window.electron.resetWindowBounds === 'function') {
    window.electron.resetWindowBounds();
  }
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
    if (!s) {
      await setLanguage(DEFAULT_LANGUAGE);
      await loadLinks();
      return;
    }

    if (Array.isArray(s.pinnedTags)) pinnedTags = s.pinnedTags.slice();
    try {
      defaultLinksPath = await window.electron.getDefaultLinksPath();
    } catch (err) { defaultLinksPath = null; }
    updateLinksFileDisplay(s.customDataFile || null);
    applyCustomBackground(s.backgroundImagePath || null);
    applyAppDisplayName(s.appDisplayName || DEFAULT_APP_NAME);
    await setLanguage(s.language || DEFAULT_LANGUAGE);
    if (groupingSelect) {
      groupingMode = typeof s.groupingPreference === 'string' ? s.groupingPreference : 'none';
      groupingSelect.value = groupingMode;
    }
    renderTagFilters();

    // Set UI states
    if (typeof s.alwaysOnTop === 'boolean') alwaysOnTopChk.checked = s.alwaysOnTop;
    if (typeof s.nativeTransparency === 'boolean' && nativeTransparencyChk) {
      nativeTransparencyChk.checked = s.nativeTransparency;
    }
    if (typeof s.injectResizers === 'boolean') {
      injectResizersChk.checked = s.injectResizers;
      applyResizerVisibility(!!s.injectResizers);
    }
    if (linkSessionModeSelect) {
      const mode = typeof s.linkSessionMode === 'string' ? s.linkSessionMode : 'shared';
      linkSessionModeSelect.value = mode;
    }
    if (typeof s.persistSettings === 'boolean') persistSettingsChk.checked = s.persistSettings;
    if (typeof s.launchOnStartup === 'boolean') launchOnStartupChk.checked = s.launchOnStartup;
    if (typeof s.developerMode === 'boolean') {
      developerModeEnabled = s.developerMode;
      if (developerModeChk) developerModeChk.checked = s.developerMode;
    }

    await loadLinks();

    if (appNameSaveBtn && appNameInput) {
      appNameSaveBtn.addEventListener('click', async () => {
        await window.electron.setSetting('appDisplayName', appNameInput.value);
      });
    }

    if (appNameResetBtn) {
      appNameResetBtn.addEventListener('click', async () => {
        await window.electron.setSetting('appDisplayName', null);
      });
    }

    if (appNameInput) {
      appNameInput.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        await window.electron.setSetting('appDisplayName', appNameInput.value);
      });
    }

    // Wire up change listeners
    if (nativeTransparencyChk) {
      nativeTransparencyChk.addEventListener('change', async (e) => {
        await window.electron.setSetting('nativeTransparency', !!e.target.checked);
      });
    }

    alwaysOnTopChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('alwaysOnTop', !!e.target.checked);
    });

    injectResizersChk.addEventListener('change', async (e) => {
      const enabled = !!e.target.checked;
      await window.electron.setSetting('injectResizers', enabled);
      applyResizerVisibility(enabled);
    });

    if (linkSessionModeSelect) {
      linkSessionModeSelect.addEventListener('change', async (e) => {
        await window.electron.setSetting('linkSessionMode', e.target.value);
      });
    }

    if (languageSelect) {
      languageSelect.addEventListener('change', async (e) => {
        const nextLang = e.target.value;
        await setLanguage(nextLang);
        await window.electron.setSetting('language', normalizeLanguageCode(nextLang));
      });
    }

    persistSettingsChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('persistSettings', !!e.target.checked);
    });

    launchOnStartupChk.addEventListener('change', async (e) => {
      await window.electron.setSetting('launchOnStartup', !!e.target.checked);
    });

    if (developerModeChk) {
      developerModeChk.addEventListener('change', async (e) => {
        const enabled = !!e.target.checked;
        developerModeEnabled = enabled;
        await window.electron.setSetting('developerMode', enabled);
      });
    }
    if (openLayoutBtn) {
      openLayoutBtn.addEventListener('click', async () => {
        if (window.electron && typeof window.electron.openLayoutWindow === 'function') {
          await window.electron.openLayoutWindow();
        }
      });
    }

    // Folder sync UI
    const useFolderSyncChk = document.getElementById('useFolderSyncChk');
    const syncFolderPath = document.getElementById('syncFolderPath');
    const chooseSyncFolderBtn = document.getElementById('chooseSyncFolderBtn');

    try {
      const useSync = await window.electron.getSetting('useFolderSync');
      const folder = await window.electron.getSyncFolder();
      if (typeof useSync === 'boolean') useFolderSyncChk.checked = useSync;
      syncFolderPath.innerText = folder || t('settings.syncPathNotSet');
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

    if (chooseLinksFileBtn) {
      chooseLinksFileBtn.addEventListener('click', async () => {
        const chosen = await window.electron.chooseLinksFile();
        if (chosen) {
          await window.electron.setSetting('customDataFile', chosen);
        }
      });
    }

    if (resetLinksFileBtn) {
      resetLinksFileBtn.addEventListener('click', async () => {
        await window.electron.setSetting('customDataFile', null);
      });
    }

    if (openLinksFileBtn) {
      openLinksFileBtn.addEventListener('click', async () => {
        await window.electron.revealLinksFile();
      });
    }

    if (chooseBackgroundBtn) {
      chooseBackgroundBtn.addEventListener('click', async () => {
        const chosen = await window.electron.chooseBackgroundImage();
        if (chosen) {
          await window.electron.setSetting('backgroundImagePath', chosen);
        }
      });
    }

    if (resetBackgroundBtn) {
      resetBackgroundBtn.addEventListener('click', async () => {
        await window.electron.setSetting('backgroundImagePath', null);
      });
    }

    resetSettingsBtn.addEventListener('click', async () => {
      if (!confirm(t('confirm.resetSettings'))) return;
      const newSettings = await window.electron.resetSettings();
        if (newSettings) {
        // update UI to reflect defaults
        opacityRange.value = newSettings.appOpacity;
        opacityVal.innerText = Math.round(newSettings.appOpacity * 100) + '%';
          applyBackgroundVisuals(newSettings.appOpacity);
        alwaysOnTopChk.checked = newSettings.alwaysOnTop;
        if (nativeTransparencyChk) nativeTransparencyChk.checked = !!newSettings.nativeTransparency;
        injectResizersChk.checked = newSettings.injectResizers;
        applyResizerVisibility(!!newSettings.injectResizers);
        if (linkSessionModeSelect) linkSessionModeSelect.value = newSettings.linkSessionMode || 'shared';
        persistSettingsChk.checked = newSettings.persistSettings;
        await setLanguage(newSettings.language || DEFAULT_LANGUAGE);
        // reflect new boolean settings into UI
        launchOnStartupChk.checked = !!newSettings.launchOnStartup;
        if (developerModeChk) developerModeChk.checked = !!newSettings.developerMode;
        developerModeEnabled = !!newSettings.developerMode;
        updateLinksFileDisplay(newSettings.customDataFile || null);
        if (telemetryChk) telemetryChk.checked = !!newSettings.telemetryEnabled;
        updateDataCollectionStatus(!!newSettings.telemetryEnabled);
        applyCustomBackground(newSettings.backgroundImagePath || null);
        applyAppDisplayName(newSettings.appDisplayName || DEFAULT_APP_NAME);
        selfChatState = normalizeSelfChatState(newSettings[selfChatSettingKey]) || createDefaultChatState();
        renderSelfChat();
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
          if (key === 'alwaysOnTop') alwaysOnTopChk.checked = !!value;
          if (key === 'nativeTransparency' && nativeTransparencyChk) {
            nativeTransparencyChk.checked = !!value;
          }
          if (key === 'injectResizers') {
            injectResizersChk.checked = !!value;
            applyResizerVisibility(!!value);
          }
          if (key === 'linkSessionMode' && linkSessionModeSelect) {
            linkSessionModeSelect.value = value || 'shared';
          }
          if (key === 'language') {
            setLanguage(value || DEFAULT_LANGUAGE);
          }
          if (key === 'persistSettings') persistSettingsChk.checked = !!value;
          if (key === 'launchOnStartup') launchOnStartupChk.checked = !!value;
          if (key === 'developerMode') {
            developerModeEnabled = !!value;
            if (developerModeChk) developerModeChk.checked = !!value;
          }
          if (key === 'customDataFile') {
            updateLinksFileDisplay(value || null);
            loadLinks();
          }
          if (key === 'backgroundImagePath') {
            applyCustomBackground(value || null);
          }
          if (key === 'telemetryEnabled') {
            if (telemetryChk) telemetryChk.checked = !!value;
            updateDataCollectionStatus(!!value);
          }
          if (key === 'pinnedTags') {
            pinnedTags = Array.isArray(value) ? value : [];
            renderTagFilters();
          }
          if (key === 'groupingPreference') {
            groupingMode = value || 'none';
            if (groupingSelect) groupingSelect.value = groupingMode;
            renderLinks();
          }
          if (key === 'workspaces') {
            workspaces = normalizeWorkspaces(value);
            renderWorkspaces();
          }
          if (key === 'appDisplayName') {
            applyAppDisplayName(value || DEFAULT_APP_NAME);
          }
        } catch (err) {}
      });
    }
  } catch (err) {
    // ignore if APIs not present
  }
}

(async () => {
  await initSettingsUI();
  initDataCollectionDebugger();
  initSelfChat();
  initHelp();
  loadWorkspaces();
})();

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
  const fetchStart = performance.now();
  const links = await window.electron.getLinks();
  const fetchMs = performance.now() - fetchStart;
  if (Array.isArray(links)) {
    currentLinks = links.slice().sort((a, b) => {
      const av = typeof a.sortOrder === 'number' ? a.sortOrder : (a.createdAt ? Date.parse(a.createdAt) : 0);
      const bv = typeof b.sortOrder === 'number' ? b.sortOrder : (b.createdAt ? Date.parse(b.createdAt) : 0);
      return av - bv;
    });
  } else {
    currentLinks = [];
  }
  if (developerModeEnabled && window.electron && typeof window.electron.reportPerfEvent === 'function') {
    window.electron.reportPerfEvent('links-fetch', {
      ms: Number(fetchMs.toFixed(2)),
      count: currentLinks.length
    });
  }
  renderTagFilters();
  renderLinks();
  renderQuickAccess();
  renderQuickStats();
  syncBulkActionVisibility();
  updateRefreshIndicators();
  if (isCommandPaletteOpen()) updateCommandPaletteResults();
  if (!initialRenderReported && window.electron && typeof window.electron.reportRendererReady === 'function') {
    initialRenderReported = true;
    window.electron.reportRendererReady(performance.now());
  }
}

async function addLink() {
  const url = urlInput.value.trim();
  const title = titleInput.value.trim();
  const tags = tagsInput ? normalizeTagsInput(tagsInput.value) : [];
  const folder = folderInput ? folderInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';
  const priority = prioritySelect ? prioritySelect.value : 'normal';

  if (!url) {
    alert(t('alerts.enterUrl'));
    return;
  }

  try {
    // Validate URL
    new URL(url);
  } catch (error) {
    alert(t('alerts.invalidUrl'));
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
  if (confirm(t('confirm.deleteLink'))) {
    await window.electron.deleteLink(id);
    loadLinks();
  }
}

function renderLinks() {
  const renderStart = performance.now();
  linksList.innerHTML = '';

  const filtered = getFilteredLinks();
  if (!filtered || filtered.length === 0) {
    emptyState.style.display = 'flex';
    if (developerModeEnabled && window.electron && typeof window.electron.reportPerfEvent === 'function') {
      const renderMs = performance.now() - renderStart;
      window.electron.reportPerfEvent('render-links', {
        ms: Number(renderMs.toFixed(2)),
        filtered: 0,
        total: currentLinks.length,
        queryLength: searchQuery.length,
        grouping: groupingMode
      });
    }
    return;
  }

  emptyState.style.display = 'none';

  const pinned = filtered.filter((link) => link.pinned);
  const others = filtered.filter((link) => !link.pinned);

  if (pinned.length) {
    const heading = document.createElement('div');
    heading.className = 'link-section-heading';
    heading.textContent = t('links.pinnedHeading');
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
        heading.textContent = t('links.allHeading');
        linksList.appendChild(heading);
      }
      items.forEach((link) => {
        linksList.appendChild(buildLinkElement(link, { groupKey }));
      });
    });
  }

  if (developerModeEnabled && window.electron && typeof window.electron.reportPerfEvent === 'function') {
    const renderMs = performance.now() - renderStart;
    window.electron.reportPerfEvent('render-links', {
      ms: Number(renderMs.toFixed(2)),
      filtered: filtered.length,
      total: currentLinks.length,
      queryLength: searchQuery.length,
      grouping: groupingMode
    });
  }
}

function getGroupedEntries(links) {
  if (groupingMode === 'folder') {
    const groups = new Map();
    links.forEach((link) => {
      const key = link.folder ? link.folder : t('links.noFolder');
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
      const key = (link.tags && link.tags.length) ? link.tags[0] : t('links.noTag');
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
  const isDeleted = !!link.deletedAt;
  if (isDeleted) linkElement.classList.add('is-deleted');

  const titleText = escapeHtml(link.title || link.url);
  const urlText = escapeHtml(link.url);
  const folderChip = link.folder ? `<span class="tag-chip folder-chip">${escapeHtml(link.folder)}</span>` : '';
  const tags = (link.tags && link.tags.length)
    ? link.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')
    : `<span class="tag-chip muted">${escapeHtml(t('tags.none'))}</span>`;
  const metadataPreview = buildMetadataPreview(link);
  const notesBlock = link.notes
    ? `<div class="link-notes"><span>${escapeHtml(t('links.notesLabel'))}</span> ${escapeHtml(link.notes)}</div>`
    : '';
  const favicon = link.metadata && link.metadata.favicon
    ? `<img src="${escapeHtml(link.metadata.favicon)}" alt="" class="link-favicon">`
    : '';
  const siteName = link.metadata && link.metadata.siteName
    ? `<div class="link-site">${escapeHtml(link.metadata.siteName)}</div>`
    : '';
  const badges = [
    link.favorite ? `<span class="badge favorite-badge">${escapeHtml(t('links.favoriteBadge'))}</span>` : '',
    link.pinned ? `<span class="badge pinned-badge">${escapeHtml(t('links.pinnedBadge'))}</span>` : '',
    buildPriorityBadge(link.priority),
    buildHealthBadge(link.health),
    isDeleted ? `<span class="badge deleted-badge">${escapeHtml(t('links.deletedBadge'))}</span>` : ''
  ].filter(Boolean).join('');

  const linkActions = isDeleted
    ? `<button class="action-btn restore-btn" data-id="${link.id}">${escapeHtml(t('actions.restore'))}</button>`
    : `
        <button class="action-btn open-btn" data-id="${link.id}">${escapeHtml(t('actions.openWindow'))}</button>
        <button class="action-btn browser-btn" data-id="${link.id}">${escapeHtml(t('actions.openBrowser'))}</button>
        <button class="action-btn copy-btn" data-id="${link.id}">${escapeHtml(t('actions.copy'))}</button>
        <button class="action-btn edit-btn" data-id="${link.id}">${escapeHtml(t('actions.edit'))}</button>
        <button class="action-btn pin-btn" data-id="${link.id}">${escapeHtml(link.pinned ? t('actions.unpin') : t('actions.pin'))}</button>
        <button class="action-btn fav-btn" data-id="${link.id}">${escapeHtml(link.favorite ? t('actions.unfav') : t('actions.fav'))}</button>
        <button class="action-btn delete-btn danger" data-id="${link.id}">${escapeHtml(t('actions.delete'))}</button>
      `;
  const linkMetaActions = isDeleted
    ? ''
    : `
        <button class="icon-btn refresh-meta-btn" data-id="${link.id}">${escapeHtml(t('metadata.refresh'))}</button>
        <button class="icon-btn refresh-health-btn" data-id="${link.id}">${escapeHtml(t('health.check'))}</button>
      `;

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
        ${linkActions}
      </div>
      ${linkMetaActions ? `<div class="link-meta-actions">${linkMetaActions}</div>` : ''}
      <div class="link-edit hidden">
        <div class="edit-grid">
          <label><span>${escapeHtml(t('fields.title'))}</span><input type="text" class="edit-title"></label>
          <label><span>${escapeHtml(t('fields.url'))}</span><input type="text" class="edit-url"></label>
          <label><span>${escapeHtml(t('fields.tags'))}</span><input type="text" class="edit-tags" placeholder="${escapeHtml(t('placeholders.commaSeparated'))}"></label>
          <label><span>${escapeHtml(t('fields.folder'))}</span><input type="text" class="edit-folder" placeholder="${escapeHtml(t('placeholders.folderName'))}"></label>
          <label><span>${escapeHtml(t('fields.priority'))}</span>
            <select class="edit-priority">
              <option value="high">${escapeHtml(t('priority.high'))}</option>
              <option value="normal">${escapeHtml(t('priority.normal'))}</option>
              <option value="low">${escapeHtml(t('priority.low'))}</option>
            </select>
          </label>
          <label class="notes-label"><span>${escapeHtml(t('fields.notes'))}</span><textarea class="edit-notes" placeholder="${escapeHtml(t('placeholders.notesDetails'))}"></textarea></label>
        </div>
        <div class="edit-actions">
          <button class="action-btn save-edit-btn">${escapeHtml(t('actions.save'))}</button>
          <button class="action-btn ghost cancel-edit-btn">${escapeHtml(t('actions.cancel'))}</button>
        </div>
      </div>
    </div>
  `;

  const displayEl = linkElement.querySelector('.link-display');
  if (displayEl && !isDeleted) {
    displayEl.addEventListener('click', () => {
      recordLocalOpen(link.id);
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
    });
  }

  const openBtn = linkElement.querySelector('.open-btn');
  if (openBtn && !isDeleted) {
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      recordLocalOpen(link.id);
      try {
        window.electron.openLinkWithId(Number(link.id), link.url);
      } catch (err) {
        window.electron.openLink(link.url);
      }
    });
  }

  const browserBtn = linkElement.querySelector('.browser-btn');
  if (browserBtn && !isDeleted) {
    browserBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.openInBrowser(link.url);
    });
  }

  const copyBtn = linkElement.querySelector('.copy-btn');
  if (copyBtn && !isDeleted) {
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.copyLink(link.url);
      const original = copyBtn.textContent;
      copyBtn.textContent = t('actions.copied');
      setTimeout(() => { copyBtn.textContent = original; }, 1200);
    });
  }

  const deleteBtn = linkElement.querySelector('.delete-btn');
  if (deleteBtn && !isDeleted) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(t('confirm.deleteLink'))) return;
      await window.electron.deleteLink(link.id);
      loadLinks();
    });
  }

  const restoreBtn = linkElement.querySelector('.restore-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.restoreLink(link.id);
      loadLinks();
    });
  }

  const favBtn = linkElement.querySelector('.fav-btn');
  if (favBtn && !isDeleted) {
    favBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electron.toggleFavorite(link.id);
      loadLinks();
    });
  }

  const pinBtn = linkElement.querySelector('.pin-btn');
  if (pinBtn && !isDeleted) {
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

  if (editBtn && !isDeleted) {
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
        alert(t('alerts.urlRequired'));
        return;
      }
      const ok = await window.electron.updateLink(updated);
      if (ok) {
        setEditing(false);
        loadLinks();
      }
    });
  }

  if (refreshMetaBtn && !isDeleted) {
    refreshMetaBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const original = refreshMetaBtn.textContent;
      refreshMetaBtn.textContent = t('metadata.queued');
      bumpRefreshActivity('metadata', 5000);
      await window.electron.refreshLinkMetadata(link.id);
      setTimeout(() => { refreshMetaBtn.textContent = original; }, 800);
    });
  }

  if (refreshHealthBtn && !isDeleted) {
    refreshHealthBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const original = refreshHealthBtn.textContent;
      refreshHealthBtn.textContent = t('health.checking');
      bumpRefreshActivity('health', 5000);
      await window.electron.refreshLinkHealth(link.id);
      setTimeout(() => { refreshHealthBtn.textContent = original; }, 1000);
    });
  }

  if (currentLinks.length > 1) attachDragHandlers(linkElement, link, groupKey);

  return linkElement;
}

function buildPriorityBadge(priority) {
  const value = (priority || '').toLowerCase();
  if (value === 'high') return `<span class="badge priority-badge priority-high">${escapeHtml(t('priority.highBadge'))}</span>`;
  if (value === 'low') return `<span class="badge priority-badge priority-low">${escapeHtml(t('priority.lowBadge'))}</span>`;
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
  if (!health) return t('health.neverChecked');
  const statusCode = health.statusCode ? t('health.httpStatus', { code: health.statusCode }) : '';
  const latency = typeof health.latency === 'number' ? t('health.latency', { ms: health.latency }) : '';
  let checked = '';
  if (health.checkedAt) {
    try {
      const date = new Date(health.checkedAt);
      checked = t('health.checkedAt', { time: date.toLocaleString() });
    } catch (err) {}
  }
  return [statusCode, latency, checked, health.error].filter(Boolean).join(' • ') || t('health.unknown');
}

function buildHealthBadge(health) {
  if (!health) return '';
  const status = (health.status || 'unknown').toLowerCase();
  let label = t('health.unknownStatus');
  let className = 'health-unknown';
  if (status === 'ok') {
    label = t('health.ok');
    className = 'health-ok';
  } else if (status === 'redirected') {
    label = t('health.redirect');
    className = 'health-redirect';
  } else if (status === 'warning') {
    label = t('health.warning');
    className = 'health-warning';
  } else if (status === 'error' || status === 'broken') {
    label = t('health.error');
    className = 'health-error';
  }
  const details = describeHealth(health);
  return `<span class="badge health-badge ${className}" title="${escapeHtml(details)}">${escapeHtml(label)}</span>`;
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

if (showDeletedBtn) {
  syncDeletedToggleLabel();
  syncBulkActionVisibility();
  showDeletedBtn.addEventListener('click', () => {
    showDeleted = !showDeleted;
    syncDeletedToggleLabel();
    syncBulkActionVisibility();
    renderTagFilters();
    renderLinks();
    renderQuickAccess();
    renderQuickStats();
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
      alert(t('alerts.noItemsSelected'));
      return;
    }
    const value = prompt(t('prompts.bulkTags'));
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

if (openAllBtn) openAllBtn.addEventListener('click', async () => {
  const targets = getFilteredLinks().filter((link) => !link.deletedAt);
  if (!targets.length) {
    alert(t('alerts.noItemsSelected'));
    return;
  }
  if (!confirm(t('confirm.openAll', { count: targets.length }))) return;
  for (const link of targets) {
    recordLocalOpen(link.id);
    try {
      await window.electron.openLinkWithId(Number(link.id), link.url);
    } catch (err) {
      await window.electron.openLink(link.url);
    }
  }
});

if (exportBtn) exportBtn.addEventListener('click', async () => {
  const path = await window.electron.exportLinks();
  if (path) alert(t('alerts.exportedTo', { path }));
});

if (importBtn) importBtn.addEventListener('click', async () => {
  const ok = await window.electron.importLinks();
  if (ok) { alert(t('alerts.importComplete')); loadLinks(); }
});

if (exportCsvBtn) exportCsvBtn.addEventListener('click', async () => {
  const path = await window.electron.exportLinksCsv();
  if (path) alert(t('alerts.csvExportedTo', { path }));
});

if (importCsvBtn) importCsvBtn.addEventListener('click', async () => {
  const added = await window.electron.importLinksCsv();
  if (added > 0) { alert(t('alerts.csvImported', { count: added })); loadLinks(); }
});

if (backupBtn) backupBtn.addEventListener('click', async () => {
  const fp = await window.electron.manualBackup(5);
  if (fp) alert(t('alerts.backupSaved', { path: fp }));
});

if (saveWorkspaceBtn) {
  saveWorkspaceBtn.addEventListener('click', async () => {
    await saveWorkspaceFromOpenWindows();
  });
}

if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', async () => {
  const checked = getSelectedLinkIds();
  if (checked.length === 0) { alert(t('alerts.noItemsSelected')); return; }
  if (!confirm(t('confirm.deleteSelected', { count: checked.length }))) return;
  await window.electron.bulkDelete(checked);
  loadLinks();
});

if (restoreSelectedBtn) restoreSelectedBtn.addEventListener('click', async () => {
  const checked = getSelectedLinkIds();
  if (checked.length === 0) { alert(t('alerts.noItemsSelected')); return; }
  await window.electron.bulkRestore(checked);
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
if (telemetryChk) {
  (async () => {
    try {
      const val = await window.electron.getSetting('telemetryEnabled');
      telemetryChk.checked = !!val;
      updateDataCollectionStatus(!!val);
    } catch (err) {}
  })();
  telemetryChk.addEventListener('change', async (e) => {
    const enabled = !!e.target.checked;
    updateDataCollectionStatus(enabled);
    await window.electron.setSetting('telemetryEnabled', enabled);
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
