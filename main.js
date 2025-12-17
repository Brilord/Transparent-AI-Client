const { app, BrowserWindow, Menu, ipcMain, screen, dialog, shell, clipboard, crashReporter } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

let mainWindow;
let appOpacity = 1.0; // global app opacity applied to all windows
const linkWindows = new Set();
const linkWindowMeta = new Map(); // track metadata for open link windows
const defaultDataFile = path.join(app.getPath('userData'), 'links.json');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');
const MIN_LINK_WINDOW_OPACITY = 0.68; // keep remote link text readable even when slider hits 0%
const DEFAULT_MAIN_WINDOW_WIDTH = 600;
const DEFAULT_MAIN_WINDOW_HEIGHT = 800;
const TELEMETRY_SUBMIT_URL = 'https://telemetry.invalid/crash';
const METADATA_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 6;
const HEALTH_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 12;
const METADATA_POLL_INTERVAL_MS = 7000;
const HEALTH_POLL_INTERVAL_MS = 12000;
const MAX_METADATA_BYTES = 512 * 1024;
const HTTP_TIMEOUT_MS = 12000;
const DEFAULT_PRIORITY = 'normal';
const ALLOWED_PRIORITIES = new Set(['low', 'normal', 'high']);

const metadataQueue = [];
const metadataPending = new Set();
const metadataProcessing = new Set();
const healthQueue = [];
const healthPending = new Set();
const healthProcessing = new Set();
let metadataTimer = null;
let healthTimer = null;

let crashReporterInitialized = false;

function applyTelemetryState(enabled) {
  if (!crashReporter || typeof crashReporter.start !== 'function') return;
  const uploadEnabled = !!enabled;
  try {
    if (!crashReporterInitialized) {
      crashReporter.start({
        productName: 'PlanaClientV2.0',
        companyName: 'PlanaClient',
        submitURL: TELEMETRY_SUBMIT_URL,
        uploadToServer: uploadEnabled,
        compress: true
      });
      crashReporterInitialized = true;
    } else if (typeof crashReporter.setUploadToServer === 'function') {
      crashReporter.setUploadToServer(uploadEnabled);
    }
  } catch (err) {
    console.error('Crash reporter error:', err);
  }
}

function normalizeTags(input) {
  if (input === undefined || input === null) return [];
  let source = [];
  if (Array.isArray(input)) {
    source = input;
  } else if (typeof input === 'string') {
    source = input.split(',');
  } else {
    return [];
  }
  const seen = new Set();
  const cleaned = [];
  for (const raw of source) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned;
}

function getLinkWindowOpacity(baseOpacity) {
  let normalized = typeof baseOpacity === 'number' ? baseOpacity : parseFloat(baseOpacity);
  if (isNaN(normalized)) normalized = 1;
  normalized = Math.max(0, Math.min(1, normalized));
  const eased = MIN_LINK_WINDOW_OPACITY + (1 - MIN_LINK_WINDOW_OPACITY) * Math.pow(normalized, 0.85);
  return Math.max(MIN_LINK_WINDOW_OPACITY, Math.min(1, Number(eased.toFixed(3))));
}

function applyOpacityToLinkWindows() {
  const effective = getLinkWindowOpacity(appOpacity);
  for (const win of linkWindows) {
    try {
      if (win && !win.isDestroyed() && typeof win.setOpacity === 'function') {
        win.setOpacity(effective);
      }
    } catch (err) {
      // ignore per-window failures
    }
  }
}

// Default app settings
const DEFAULT_SETTINGS = {
  appOpacity: 1.0,
  alwaysOnTop: false,
  injectResizers: true,
  persistSettings: true,
  customDataFile: null,
  // Folder sync settings
  useFolderSync: false,
  syncFolder: null,
  // Telemetry opt-in
  telemetryEnabled: false,
  // Launch behavior
  launchOnStartup: false,
  // Last opened links (to restore on next launch)
  lastOpenedLinks: [],
  // Quick filter preferences
  pinnedTags: [],
  groupingPreference: 'none'
};

let appSettings = Object.assign({}, DEFAULT_SETTINGS);

function getDataFilePath() {
  try {
    const customPath = appSettings && typeof appSettings.customDataFile === 'string'
      ? appSettings.customDataFile.trim()
      : '';
    if (customPath) return customPath;
  } catch (err) {}
  return defaultDataFile;
}

function ensureLinksFileExists(targetPath = getDataFilePath()) {
  try {
    if (!targetPath) return;
    const dir = path.dirname(targetPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, JSON.stringify([]));
    }
  } catch (err) {
    console.error('Error ensuring links file exists:', err);
    throw err;
  }
}

// Folder sync watcher state
let syncWatcher = null;
let lastSyncUpdatedAt = 0;

function createEmptyMetadata() {
  return {
    title: null,
    description: null,
    favicon: null,
    dominantColor: null,
    siteName: null,
    previewImage: null,
    sourceUrl: null,
    lastFetchedAt: null,
    error: null
  };
}

function createEmptyHealth() {
  return {
    status: 'unknown',
    statusCode: null,
    redirected: false,
    checkedAt: null,
    latency: null,
    error: null
  };
}

function sanitizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizePriority(value) {
  const normalized = String(value || '').toLowerCase();
  return ALLOWED_PRIORITIES.has(normalized) ? normalized : DEFAULT_PRIORITY;
}

function getSortValue(link, fallbackIndex = 0) {
  if (link && typeof link.sortOrder === 'number' && !isNaN(link.sortOrder)) return link.sortOrder;
  if (link && link.createdAt) {
    const ts = Date.parse(link.createdAt);
    if (!isNaN(ts)) return ts;
  }
  if (link && link.id) return Number(link.id);
  return fallbackIndex;
}

function normalizeLinkCollection(rawLinks) {
  if (!Array.isArray(rawLinks)) {
    return { normalized: [], changed: true };
  }
  let changed = false;
  const cloned = rawLinks.map((link) => Object.assign({}, link));
  cloned.forEach((link, idx) => {
    const nextLink = link;
    if (typeof nextLink.folder !== 'string') {
      nextLink.folder = sanitizeString(nextLink.folder);
      changed = true;
    } else {
      nextLink.folder = sanitizeString(nextLink.folder);
    }
    if (typeof nextLink.notes !== 'string') {
      nextLink.notes = sanitizeString(nextLink.notes);
      changed = true;
    } else {
      nextLink.notes = sanitizeString(nextLink.notes);
    }
    const desiredPriority = normalizePriority(nextLink.priority);
    if (nextLink.priority !== desiredPriority) {
      nextLink.priority = desiredPriority;
      changed = true;
    }
    if (!Array.isArray(nextLink.tags)) {
      nextLink.tags = normalizeTags(nextLink.tags);
      changed = true;
    }
    if (!nextLink.metadata || typeof nextLink.metadata !== 'object') {
      nextLink.metadata = createEmptyMetadata();
      changed = true;
    } else {
      nextLink.metadata = Object.assign(createEmptyMetadata(), nextLink.metadata);
    }
    if (!nextLink.health || typeof nextLink.health !== 'object') {
      nextLink.health = createEmptyHealth();
      changed = true;
    } else {
      nextLink.health = Object.assign(createEmptyHealth(), nextLink.health);
    }
    if (typeof nextLink.sortOrder !== 'number' || isNaN(nextLink.sortOrder)) {
      nextLink.sortOrder = getSortValue(nextLink, idx + 1);
      changed = true;
    }
  });

  const ordered = cloned.slice().sort((a, b) => {
    return getSortValue(a) - getSortValue(b);
  });
  let cursor = 0;
  ordered.forEach((link) => {
    cursor += 10;
    if (link.sortOrder !== cursor) {
      link.sortOrder = cursor;
      changed = true;
    }
  });
  return { normalized: ordered, changed };
}

function getLinksNormalized() {
  const list = loadLinks();
  const { normalized, changed } = normalizeLinkCollection(list);
  if (changed) {
    saveLinks(normalized);
    return normalized;
  }
  scheduleBackgroundJobsForLinks(normalized);
  return normalized;
}

function getNextSortOrder(links = []) {
  let max = 0;
  for (const link of links) {
    if (!link || typeof link.sortOrder !== 'number') continue;
    if (link.sortOrder > max) max = link.sortOrder;
  }
  return max + 10;
}

function ensureBackgroundWorkersRunning() {
  if (!metadataTimer) {
    metadataTimer = setInterval(() => {
      try { processNextMetadataJob(); } catch (err) { console.error('Metadata job error:', err); }
    }, METADATA_POLL_INTERVAL_MS);
  }
  if (!healthTimer) {
    healthTimer = setInterval(() => {
      try { processNextHealthJob(); } catch (err) { console.error('Health job error:', err); }
    }, HEALTH_POLL_INTERVAL_MS);
  }
}

function scheduleBackgroundJobsForLinks(links = []) {
  if (!Array.isArray(links) || links.length === 0) return;
  ensureBackgroundWorkersRunning();
  const now = Date.now();
  links.forEach((link) => {
    queueMetadataJob(link, false, now);
    queueHealthJob(link, false, now);
  });
}

function queueMetadataJob(link, urgent = false, nowTs = Date.now()) {
  if (!link || !link.url || !link.id) return;
  const id = Number(link.id);
  const lastFetched = link.metadata && link.metadata.lastFetchedAt ? Date.parse(link.metadata.lastFetchedAt) : 0;
  const hasMetadata = !!(link.metadata && (link.metadata.title || link.metadata.description || link.metadata.favicon));
  const needsUpdate = !hasMetadata || !lastFetched || (nowTs - lastFetched) > METADATA_REFRESH_INTERVAL_MS;
  if (!needsUpdate && !urgent) return;
  if (metadataPending.has(id) || metadataProcessing.has(id)) return;
  if (urgent) metadataQueue.unshift(id); else metadataQueue.push(id);
  metadataPending.add(id);
  ensureBackgroundWorkersRunning();
}

function queueHealthJob(link, urgent = false, nowTs = Date.now()) {
  if (!link || !link.url || !link.id) return;
  const id = Number(link.id);
  const lastChecked = link.health && link.health.checkedAt ? Date.parse(link.health.checkedAt) : 0;
  const needsUpdate = !lastChecked || (nowTs - lastChecked) > HEALTH_REFRESH_INTERVAL_MS || urgent;
  if (!needsUpdate && !urgent) return;
  if (healthPending.has(id) || healthProcessing.has(id)) return;
  if (urgent) healthQueue.unshift(id); else healthQueue.push(id);
  healthPending.add(id);
  ensureBackgroundWorkersRunning();
}

async function processNextMetadataJob() {
  if (!metadataQueue.length) return;
  const id = metadataQueue.shift();
  metadataPending.delete(id);
  if (metadataProcessing.has(id)) return;
  metadataProcessing.add(id);
  try {
    await refreshLinkMetadata(id);
  } catch (err) {
    console.error('Failed to refresh metadata:', err && err.message ? err.message : err);
  } finally {
    metadataProcessing.delete(id);
  }
}

async function processNextHealthJob() {
  if (!healthQueue.length) return;
  const id = healthQueue.shift();
  healthPending.delete(id);
  if (healthProcessing.has(id)) return;
  healthProcessing.add(id);
  try {
    await refreshLinkHealth(id);
  } catch (err) {
    console.error('Failed to refresh health:', err && err.message ? err.message : err);
  } finally {
    healthProcessing.delete(id);
  }
}

function httpRequest(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const requestOptions = {
        method: options.method || 'GET',
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname || '/'}` + (parsed.search || ''),
        timeout: options.timeout || HTTP_TIMEOUT_MS,
        headers: Object.assign({
          'User-Agent': 'PlanaClient/2.0 (+https://github.com/brianw/plana)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*;q=0.8,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          Connection: 'close'
        }, options.headers || {})
      };
      const req = client.request(requestOptions, (res) => {
        let total = 0;
        const maxBytes = typeof options.maxBytes === 'number' ? options.maxBytes : MAX_METADATA_BYTES;
        const buffers = [];
        if (options.collectBody === false) {
          res.on('data', () => {});
        } else {
          res.on('data', (chunk) => {
            total += chunk.length;
            if (total <= maxBytes) {
              buffers.push(chunk);
            } else if (buffers.length === 0) {
              buffers.push(chunk.slice(0, maxBytes));
            }
          });
        }
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers || {},
            body: options.collectBody === false ? '' : Buffer.concat(buffers).toString('utf8')
          });
        });
      });
      req.on('error', (err) => reject(err));
      req.setTimeout(requestOptions.timeout, () => {
        try { req.destroy(new Error('Request timed out')); } catch (err) {}
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function fetchWithRedirects(targetUrl, options = {}, depth = 0) {
  const maxRedirects = typeof options.maxRedirects === 'number' ? options.maxRedirects : 4;
  if (depth > maxRedirects) throw new Error('Too many redirects');
  const response = await httpRequest(targetUrl, options);
  const status = Number(response.statusCode || 0);
  if ([301, 302, 303, 307, 308].includes(status) && response.headers && response.headers.location) {
    const next = new URL(response.headers.location, targetUrl).toString();
    const redirected = await fetchWithRedirects(next, options, depth + 1);
    return Object.assign({}, redirected, { redirected: true, finalUrl: redirected.finalUrl || next });
  }
  return Object.assign({}, response, { redirected: depth > 0, finalUrl: targetUrl });
}

function extractAttr(tag, attrName) {
  if (!tag) return null;
  const regex = new RegExp(attrName + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s\"'=<>`]+))", 'i');
  const match = String(tag).match(regex);
  if (!match) return null;
  return match[2] || match[3] || match[4] || null;
}

function extractMetadataFromHtml(html, pageUrl) {
  const subset = typeof html === 'string' ? html.slice(0, 300000) : '';
  const metadata = createEmptyMetadata();
  const ogTitleTag = subset.match(/<meta[^>]+property=["']og:title["'][^>]*>/i);
  const ogDescTag = subset.match(/<meta[^>]+property=["']og:description["'][^>]*>/i);
  const ogImageTag = subset.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
  const ogSiteTag = subset.match(/<meta[^>]+property=["']og:site_name["'][^>]*>/i);
  const descTag = subset.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  const themeTag = subset.match(/<meta[^>]+name=["']theme-color["'][^>]*>/i);
  const titleMatch = subset.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  metadata.title = (extractAttr(ogTitleTag, 'content') || (titleMatch ? titleMatch[1] : '') || '').trim() || null;
  const description = (extractAttr(ogDescTag, 'content') || extractAttr(descTag, 'content') || '').trim();
  metadata.description = description || null;
  metadata.previewImage = (extractAttr(ogImageTag, 'content') || '').trim() || null;
  metadata.siteName = (extractAttr(ogSiteTag, 'content') || '').trim() || null;
  metadata.dominantColor = (extractAttr(themeTag, 'content') || '').trim() || null;
  const iconTag = subset.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i);
  const favicon = extractAttr(iconTag, 'href');
  try {
    if (favicon) metadata.favicon = new URL(favicon, pageUrl).toString();
    else metadata.favicon = new URL('/favicon.ico', pageUrl).toString();
  } catch (err) {
    metadata.favicon = null;
  }
  if (!metadata.siteName) {
    try {
      const parsed = new URL(pageUrl);
      metadata.siteName = parsed.hostname;
    } catch (err) {}
  }
  return metadata;
}

async function collectMetadataForUrl(targetUrl) {
  try {
    const response = await fetchWithRedirects(targetUrl, { method: 'GET', maxBytes: MAX_METADATA_BYTES, timeout: HTTP_TIMEOUT_MS });
    if (!response) return null;
    const contentType = (response.headers && response.headers['content-type']) || '';
    if (contentType && !/text\/html/i.test(contentType)) {
      return {
        title: null,
        description: null,
        favicon: null,
        dominantColor: null,
        siteName: null,
        previewImage: null,
        sourceUrl: response.finalUrl || targetUrl
      };
    }
    const metadata = extractMetadataFromHtml(response.body || '', response.finalUrl || targetUrl);
    metadata.sourceUrl = response.finalUrl || targetUrl;
    return metadata;
  } catch (err) {
    throw err;
  }
}

async function refreshLinkMetadata(linkId) {
  const links = getLinksNormalized();
  const idx = links.findIndex((l) => Number(l.id) === Number(linkId));
  if (idx === -1) return false;
  const link = links[idx];
  try {
    const info = await collectMetadataForUrl(link.url);
    if (info) {
      link.metadata = Object.assign(createEmptyMetadata(), link.metadata || {}, info, {
        lastFetchedAt: new Date().toISOString(),
        error: null
      });
      let hostname = null;
      try { hostname = new URL(link.url).hostname; } catch (err) {}
      if (!link.title || (hostname && link.title === hostname)) {
        if (info.title) link.title = info.title;
      }
    } else {
      link.metadata = Object.assign(createEmptyMetadata(), link.metadata || {}, { lastFetchedAt: new Date().toISOString() });
    }
  } catch (err) {
    link.metadata = Object.assign(createEmptyMetadata(), link.metadata || {}, {
      lastFetchedAt: new Date().toISOString(),
      error: err && err.message ? err.message : String(err)
    });
  }
  links[idx] = link;
  saveLinks(links);
  return true;
}

async function refreshLinkHealth(linkId) {
  const links = getLinksNormalized();
  const idx = links.findIndex((l) => Number(l.id) === Number(linkId));
  if (idx === -1) return false;
  const link = links[idx];
  const health = Object.assign(createEmptyHealth(), link.health || {});
  try {
    const started = Date.now();
    const response = await fetchWithRedirects(link.url, { method: 'HEAD', collectBody: false, timeout: 8000 });
    health.statusCode = response.statusCode || null;
    health.redirected = !!response.redirected;
    health.checkedAt = new Date().toISOString();
    health.latency = Date.now() - started;
    const code = Number(response.statusCode || 0);
    if (code >= 200 && code < 300) health.status = 'ok';
    else if (code >= 300 && code < 400) health.status = 'redirected';
    else if (code >= 400 && code < 500) health.status = 'warning';
    else if (code >= 500) health.status = 'error';
    else health.status = 'unknown';
    health.error = null;
  } catch (err) {
    health.status = 'broken';
    health.error = err && err.message ? err.message : String(err);
    health.checkedAt = new Date().toISOString();
  }
  link.health = health;
  links[idx] = link;
  saveLinks(links);
  return true;
}

function notifyLinksChanged() {
  BrowserWindow.getAllWindows().forEach((w) => {
    try { w.webContents.send('links-changed'); } catch (err) {}
  });
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertLinksToCsv(links = []) {
  const header = [
    'id',
    'url',
    'title',
    'tags',
    'folder',
    'notes',
    'priority',
    'favorite',
    'pinned',
    'createdAt',
    'updatedAt'
  ];
  const rows = [header.join(',')];
  links.forEach((link) => {
    const tags = Array.isArray(link.tags) ? link.tags.join('|') : '';
    rows.push([
      escapeCsvValue(link.id),
      escapeCsvValue(link.url),
      escapeCsvValue(link.title),
      escapeCsvValue(tags),
      escapeCsvValue(link.folder || ''),
      escapeCsvValue(link.notes || ''),
      escapeCsvValue(link.priority || DEFAULT_PRIORITY),
      escapeCsvValue(link.favorite ? '1' : '0'),
      escapeCsvValue(link.pinned ? '1' : '0'),
      escapeCsvValue(link.createdAt || ''),
      escapeCsvValue(link.updatedAt || '')
    ].join(','));
  });
  return rows.join('\n');
}

function parseCsv(content) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const cells = [];
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"' && (i === 0 || content[i - 1] !== '\\')) {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      cells.push(current);
      rows.push(cells.slice());
      cells.length = 0;
      current = '';
      continue;
    }
    current += char;
  }
  if (current.length || cells.length) {
    cells.push(current);
    rows.push(cells.slice());
  }
  return rows.filter(row => row.length);
}

function csvRecords(content) {
  const rows = parseCsv(content);
  if (!rows.length) return [];
  const header = rows.shift().map((h) => h.trim());
  return rows.map((row) => {
    const record = {};
    header.forEach((key, idx) => {
      record[key] = row[idx] !== undefined ? row[idx] : '';
    });
    return record;
  });
}

// Initialize links storage
function initializeLinksStorage() {
  try {
    ensureLinksFileExists();
  } catch (err) {
    // already logged
  }
}

// Load links from storage
function loadLinks() {
  try {
    const file = getDataFilePath();
    ensureLinksFileExists(file);
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading links:', error);
    return [];
  }
}

// Helper: compute sync file path when folder sync is enabled
function getSyncFilePath() {
  try {
    if (appSettings && appSettings.useFolderSync && appSettings.syncFolder) {
      return path.join(appSettings.syncFolder, 'links.json');
    }
  } catch (err) {}
  return null;
}

// Save links to storage (both local and optionally sync folder)
function saveLinks(links) {
  try {
    // Always keep local copy for app usage
    const file = getDataFilePath();
    ensureLinksFileExists(file);
    fs.writeFileSync(file, JSON.stringify(links, null, 2));

    // If folder sync enabled, write a wrapper with updatedAt so other devices can detect changes
    const syncPath = getSyncFilePath();
    if (syncPath) {
      const wrapper = { updatedAt: Date.now(), links };
      try { fs.writeFileSync(syncPath, JSON.stringify(wrapper, null, 2)); lastSyncUpdatedAt = wrapper.updatedAt; } catch (err) { console.error('Error writing sync file:', err); }
    }
    scheduleBackgroundJobsForLinks(Array.isArray(links) ? links : []);
    notifyLinksChanged();
  } catch (error) {
    console.error('Error saving links:', error);
  }
}

// Close and clean up all open link windows
function closeAllLinkWindows() {
  for (const win of Array.from(linkWindows)) {
    try { win.close(); } catch (err) {}
  }
}

// Persist the set of currently open link windows so we can restore them on next launch
function persistOpenLinksState() {
  try {
    const openLinks = [];
    for (const [win, meta] of linkWindowMeta.entries()) {
      if (!win || win.isDestroyed()) continue;
      if (!meta || !meta.url) continue;
      openLinks.push({ id: meta.id || null, url: meta.url });
    }
    // Remove duplicates (by id or url)
    const deduped = [];
    const seen = new Set();
    for (const l of openLinks) {
      const key = l.id ? `id:${l.id}` : `url:${l.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(l);
    }
    appSettings.lastOpenedLinks = deduped;
    if (appSettings.persistSettings) saveSettings();
  } catch (err) {
    console.error('Error persisting open links state:', err);
  }
}

function getDefaultMainWindowBounds(win) {
  const fallbackDisplay = screen.getPrimaryDisplay();
  let display = fallbackDisplay;
  try {
    if (win) display = screen.getDisplayMatching(win.getBounds());
  } catch (err) {}
  const workArea = display && display.workArea
    ? display.workArea
    : { x: 0, y: 0, width: DEFAULT_MAIN_WINDOW_WIDTH, height: DEFAULT_MAIN_WINDOW_HEIGHT };
  const width = DEFAULT_MAIN_WINDOW_WIDTH;
  const height = DEFAULT_MAIN_WINDOW_HEIGHT;
  const x = Math.round(workArea.x + Math.max(0, (workArea.width - width) / 2));
  const y = Math.round(workArea.y + Math.max(0, (workArea.height - height) / 2));
  return { x, y, width, height };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_MAIN_WINDOW_WIDTH,
    height: DEFAULT_MAIN_WINDOW_HEIGHT,
    center: true,
    transparent: false,
    frame: true,
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    resizable: true,
    movable: true,
    icon: path.join(__dirname, 'assets', 'icons', 'png', '512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Ensure main window honors global opacity
    // Notify main renderer of current app opacity so it can apply background-only transparency
    mainWindow.webContents.on('did-finish-load', () => {
      try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
    });

  mainWindow.loadFile('index.html');

  // Open dev tools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

}

// Window bounds helpers for renderer processes
ipcMain.handle('get-window-bounds', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  return win.getBounds();
});

ipcMain.handle('set-window-bounds', (event, bounds) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !bounds) return false;
  try {
    win.setBounds(bounds);
    return true;
  } catch (err) {
    console.error('Error setting bounds:', err);
    return false;
  }
});
 
// Move window by delta
ipcMain.handle('move-window', (event, { dx = 0, dy = 0 } = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    return true;
  } catch (err) {
    console.error('Error moving window:', err);
    return false;
  }
});
 
// Toggle maximize / restore
ipcMain.handle('toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    return true;
  } catch (err) {
    console.error('Error toggling maximize:', err);
    return false;
  }
});

ipcMain.handle('reset-window-bounds', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  try {
    if (win.isMaximized && win.isMaximized()) win.unmaximize();
    if (win.isFullScreen && win.isFullScreen()) win.setFullScreen(false);
    win.setBounds(getDefaultMainWindowBounds(win));
    return true;
  } catch (err) {
    console.error('Error resetting window bounds:', err);
    return false;
  }
});
 
app.on('ready', () => {
  initializeLinksStorage();
  // load settings before creating windows
  try { loadSettings(); } catch (err) { /* ignore */ }
  try { applyTelemetryState(!!appSettings.telemetryEnabled); } catch (err) {}
  if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
  createWindow();
  // Restore the last opened link (if any) after the main window is ready
  try { reopenLastLinksIfAvailable(); } catch (err) {}
  try { ensureBackgroundWorkersRunning(); } catch (err) {}
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  persistOpenLinksState();
  closeAllLinkWindows();
  if (metadataTimer) clearInterval(metadataTimer);
  if (healthTimer) clearInterval(healthTimer);
});

// IPC handlers
ipcMain.handle('get-links', () => {
  return getLinksNormalized();
});

ipcMain.handle('add-link', (event, link) => {
  if (!link || !link.url) return null;
  try { new URL(link.url); } catch (err) { return null; }
  const links = getLinksNormalized();
  const normalizedTags = normalizeTags(link && link.tags);
  let derivedTitle = '';
  try { derivedTitle = new URL(link.url).hostname; } catch (err) { derivedTitle = link.url; }
  const folder = sanitizeString(link && link.folder);
  const notes = sanitizeString(link && link.notes);
  const priority = normalizePriority(link && link.priority);
  const newLink = {
    id: Date.now(),
    url: link.url,
    title: sanitizeString(link && link.title) || derivedTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: false,
    tags: normalizedTags,
    pinned: !!(link && link.pinned),
    folder,
    notes,
    priority,
    sortOrder: getNextSortOrder(links),
    metadata: createEmptyMetadata(),
    health: createEmptyHealth()
  };
  links.push(newLink);
  saveLinks(links);
  return newLink;
});

ipcMain.handle('toggle-favorite', (event, id) => {
  try {
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === Number(id));
    if (idx === -1) return false;
    links[idx].favorite = !links[idx].favorite;
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) { return false; }
});

ipcMain.handle('update-link', (event, payload = {}) => {
  try {
    const id = payload && payload.id ? Number(payload.id) : null;
    if (!id) return false;
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === Number(id));
    if (idx === -1) return false;
    if (payload.url !== undefined) {
      if (!payload.url) return false;
      new URL(payload.url);
      links[idx].url = payload.url;
    }
    if (payload.title !== undefined) {
      const title = sanitizeString(payload.title);
      if (title) links[idx].title = title;
    }
    if (payload.tags !== undefined) {
      links[idx].tags = normalizeTags(payload.tags);
    }
    if (payload.pinned !== undefined) {
      links[idx].pinned = !!payload.pinned;
    }
    if (payload.folder !== undefined) {
      links[idx].folder = sanitizeString(payload.folder);
    }
    if (payload.notes !== undefined) {
      links[idx].notes = sanitizeString(payload.notes);
    }
    if (payload.priority !== undefined) {
      links[idx].priority = normalizePriority(payload.priority);
    }
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) {
    console.error('Error updating link:', err);
    return false;
  }
});

ipcMain.handle('bulk-delete', (event, ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const links = getLinksNormalized();
    const remaining = links.filter(l => !ids.includes(l.id));
    saveLinks(remaining);
    return true;
  } catch (err) { return false; }
});

ipcMain.handle('set-link-pinned', (event, id, pinned) => {
  try {
    const targetId = Number(id);
    if (!targetId) return false;
    const links = getLinksNormalized();
    const idx = links.findIndex(l => Number(l.id) === targetId);
    if (idx === -1) return false;
    links[idx].pinned = !!pinned;
    links[idx].updatedAt = new Date().toISOString();
    saveLinks(links);
    return true;
  } catch (err) {
    console.error('Error pinning link:', err);
    return false;
  }
});

ipcMain.handle('bulk-update-tags', (event, ids = [], tags = [], mode = 'replace') => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return false;
    const normalizedTags = normalizeTags(tags);
    const idSet = new Set(ids.map(id => Number(id)));
    const links = getLinksNormalized();
    let changed = false;
    for (const link of links) {
      if (!idSet.has(Number(link.id))) continue;
      if (mode === 'append') {
        const merged = normalizeTags([...(link.tags || []), ...normalizedTags]);
        link.tags = merged;
      } else {
        link.tags = normalizedTags;
      }
      link.updatedAt = new Date().toISOString();
      changed = true;
    }
    if (changed) saveLinks(links);
    return changed;
  } catch (err) {
    console.error('Error bulk updating tags:', err);
    return false;
  }
});

ipcMain.handle('reorder-links', (event, orderedIds = []) => {
  try {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return false;
    const normalizedIds = orderedIds.map((id) => Number(id)).filter((id) => !isNaN(id));
    if (!normalizedIds.length) return false;
    const links = getLinksNormalized();
    const idSet = new Set(normalizedIds);
    const idToLink = new Map();
    links.forEach((link) => idToLink.set(Number(link.id), link));
    const ordered = [];
    normalizedIds.forEach((id) => {
      const link = idToLink.get(id);
      if (link) ordered.push(link);
    });
    const remainder = links.filter((link) => !idSet.has(Number(link.id)));
    const finalOrder = ordered.concat(remainder);
    let cursor = 0;
    finalOrder.forEach((link) => {
      cursor += 10;
      link.sortOrder = cursor;
    });
    saveLinks(finalOrder);
    return true;
  } catch (err) {
    console.error('Error reordering links:', err);
    return false;
  }
});

ipcMain.handle('refresh-link-metadata', (event, id) => {
  try {
    const links = getLinksNormalized();
    const link = links.find((item) => Number(item.id) === Number(id));
    if (!link) return false;
    queueMetadataJob(link, true);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('refresh-link-health', (event, id) => {
  try {
    const links = getLinksNormalized();
    const link = links.find((item) => Number(item.id) === Number(id));
    if (!link) return false;
    queueHealthJob(link, true);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('peek-clipboard-link', () => {
  try {
    const text = clipboard.readText();
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch (err) {
    return null;
  }
});

ipcMain.handle('export-links-csv', async () => {
  try {
    const links = getLinksNormalized();
    const res = await dialog.showSaveDialog({
      title: 'Export links (CSV)',
      defaultPath: path.join(app.getPath('documents'), 'plana-links.csv'),
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, convertLinksToCsv(links), 'utf8');
    return res.filePath;
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return null;
  }
});

ipcMain.handle('import-links-csv', async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return 0;
    const raw = fs.readFileSync(res.filePaths[0], 'utf8');
    const records = csvRecords(raw);
    if (!records.length) return 0;
    const links = getLinksNormalized();
    const existingUrls = new Set(links.map((link) => link.url));
    const existingIds = new Set(links.map((link) => Number(link.id)));
    let added = 0;
    for (const record of records) {
      const url = sanitizeString(record.url || record.URL);
      if (!url) continue;
      try { new URL(url); } catch (err) { continue; }
      if (existingUrls.has(url)) continue;
      let id = Number(record.id);
      if (!id || existingIds.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000) + added;
      }
      const tags = record.tags ? record.tags.split('|').map((t) => t.trim()).filter(Boolean) : [];
      const favValue = String(record.favorite || record.Favorite || '').toLowerCase();
      const pinnedValue = String(record.pinned || record.Pinned || '').toLowerCase();
      const link = {
        id,
        url,
        title: sanitizeString(record.title || record.Title) || url,
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: favValue === '1' || favValue === 'true',
        pinned: pinnedValue === '1' || pinnedValue === 'true',
        tags: normalizeTags(tags),
        folder: sanitizeString(record.folder || record.Folder),
        notes: sanitizeString(record.notes || record.Notes),
        priority: normalizePriority(record.priority || record.Priority),
        sortOrder: getNextSortOrder(links),
        metadata: createEmptyMetadata(),
        health: createEmptyHealth()
      };
      links.push(link);
      existingUrls.add(url);
      existingIds.add(id);
      added++;
    }
    if (added) saveLinks(links);
    return added;
  } catch (err) {
    console.error('Error importing CSV:', err);
    return 0;
  }
});

// Export links: show save dialog and write JSON
ipcMain.handle('export-links', async (event) => {
  try {
    const links = getLinksNormalized();
    const res = await dialog.showSaveDialog({
      title: 'Export links',
      defaultPath: path.join(app.getPath('documents'), 'plana-links.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, JSON.stringify(links, null, 2), 'utf8');
    return res.filePath;
  } catch (err) { console.error(err); return null; }
});

// Import links: show open dialog, read file and merge by id (add new)
ipcMain.handle('import-links', async (event) => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (res.canceled || !res.filePaths || !res.filePaths[0]) return null;
    const raw = fs.readFileSync(res.filePaths[0], 'utf8');
  let imported = JSON.parse(raw);
  // accept either an array of links or a wrapper { updatedAt, links }
  if (imported && typeof imported === 'object' && Array.isArray(imported.links)) imported = imported.links;
  if (!Array.isArray(imported)) return null;
  const links = getLinksNormalized();
    const existingIds = new Set(links.map(l => Number(l.id)));
    const existingUrls = new Set(links.map(l => l.url));
    for (const item of imported) {
      const url = sanitizeString(item && item.url);
      if (!url || existingUrls.has(url)) continue;
      try { new URL(url); } catch (err) { continue; }
      let id = Number(item && item.id);
      if (!id || existingIds.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      const normalizedTags = normalizeTags(item && item.tags);
      const newItem = {
        id,
        url,
        title: sanitizeString(item && item.title) || url,
        createdAt: item && item.createdAt ? item.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorite: !!(item && item.favorite),
        tags: normalizedTags,
        pinned: !!(item && item.pinned),
        folder: sanitizeString(item && item.folder),
        notes: sanitizeString(item && item.notes),
        priority: normalizePriority(item && item.priority),
        sortOrder: getNextSortOrder(links),
        metadata: Object.assign(createEmptyMetadata(), item && item.metadata ? item.metadata : {}),
        health: Object.assign(createEmptyHealth(), item && item.health ? item.health : {})
      };
      links.push(newItem);
      existingIds.add(id);
      existingUrls.add(url);
    }
    saveLinks(links);
    return true;
  } catch (err) { console.error(err); return null; }
});

// Manual backup: keep last N revisions in appData/backups
ipcMain.handle('manual-backup', (event, keepN = 5) => {
  try {
    const links = getLinksNormalized();
    const backupsDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const filename = `links-${Date.now()}.json`;
    const filepath = path.join(backupsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(links, null, 2), 'utf8');
    // prune
    const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('links-')).map(f => ({ f, t: fs.statSync(path.join(backupsDir, f)).mtimeMs }));
    files.sort((a, b) => b.t - a.t);
    for (let i = keepN; i < files.length; i++) {
      try { fs.unlinkSync(path.join(backupsDir, files[i].f)); } catch (e) {}
    }
    return filepath;
  } catch (err) { console.error(err); return null; }
});

ipcMain.handle('delete-link', (event, id) => {
  let links = getLinksNormalized();
  links = links.filter(link => link.id !== id);
  saveLinks(links);
  return true;
});

ipcMain.handle('open-link-external', (event, url) => {
  try {
    if (!url) return false;
    new URL(url);
    shell.openExternal(url);
    return true;
  } catch (err) {
    console.error('Error opening link externally:', err);
    return false;
  }
});

ipcMain.handle('copy-link', (event, url) => {
  try {
    if (!url) return false;
    clipboard.writeText(String(url));
    return true;
  } catch (err) {
    console.error('Error copying link:', err);
    return false;
  }
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
  persistOpenLinksState();
  closeAllLinkWindows();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

function openLinkWindow(idOrUrl, maybeUrl) {
  // Handler supports two calling conventions for backward compatibility:
  // - open-link(id, url) where id is numeric
  // - open-link(url) older callers
  let id = null;
  let url = null;
  // If a url is provided as the second argument, always treat it as the URL (even if id is null)
  if (typeof maybeUrl === 'string') {
    if (typeof idOrUrl === 'number' || typeof idOrUrl === 'string') id = Number(idOrUrl);
    url = maybeUrl;
  } else {
    url = idOrUrl;
  }

  // Guard against missing/invalid urls
  if (!url || typeof url !== 'string') return false;

  // Find saved bounds for this link id if available
  let savedBounds = null;
  try {
    if (id) {
      const links = getLinksNormalized();
      const found = links.find(l => Number(l.id) === Number(id));
      if (found && found.lastBounds) savedBounds = found.lastBounds;
    }
  } catch (err) {}

  let winOpts = {
    width: 1000,
    height: 800,
    transparent: false,
    frame: true,
    resizable: true,
    movable: true,
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    alwaysOnTop: !!appSettings.alwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-link.js')
    }
  };

  if (savedBounds) {
    // apply saved bounds
    winOpts.x = savedBounds.x;
    winOpts.y = savedBounds.y;
    winOpts.width = savedBounds.width || winOpts.width;
    winOpts.height = savedBounds.height || winOpts.height;
  }

  let linkWindow = new BrowserWindow(winOpts);

  try {
    if (typeof linkWindow.setOpacity === 'function') {
      linkWindow.setOpacity(getLinkWindowOpacity(appOpacity));
    }
  } catch (err) {
    // ignore opacity failures on unsupported platforms
  }

  if (savedBounds) {
    try {
      const rawBounds = {};
      if (typeof savedBounds.x === 'number' && !isNaN(savedBounds.x)) rawBounds.x = Math.floor(savedBounds.x);
      if (typeof savedBounds.y === 'number' && !isNaN(savedBounds.y)) rawBounds.y = Math.floor(savedBounds.y);
      if (typeof savedBounds.width === 'number' && !isNaN(savedBounds.width)) rawBounds.width = Math.max(1, Math.floor(savedBounds.width));
      if (typeof savedBounds.height === 'number' && !isNaN(savedBounds.height)) rawBounds.height = Math.max(1, Math.floor(savedBounds.height));
      if (Object.keys(rawBounds).length) linkWindow.setBounds(rawBounds);
    } catch (err) { /* ignore invalid saved bounds */ }
  }

  // Force target=_blank / window.open navigations to stay in the same window (e.g., Google account switchers)
  try {
    linkWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
      try { if (targetUrl) linkWindow.loadURL(targetUrl); } catch (err) {}
      return { action: 'deny' };
    });
  } catch (err) {
    // Fallback for older Electron versions
    linkWindow.webContents.on('new-window', (event, targetUrl) => {
      event.preventDefault();
      try { if (targetUrl) linkWindow.loadURL(targetUrl); } catch (e) {}
    });
  }

  // Load the URL directly
  linkWindow.loadURL(url);

  // Apply current app opacity immediately
  try {
     // Let the link window's preload script apply background-only opacity (it listens to app-opacity-changed)
     linkWindow.webContents.send('app-opacity-changed', appOpacity);
  } catch (err) { /* ignore if unsupported */ }

  // Keep track of open link windows so we can update opacity later
  linkWindows.add(linkWindow);

  // Remember the last opened link so we can restore it on next launch
  try {
    linkWindowMeta.set(linkWindow, { id: id || null, url });
    appSettings.lastOpenedLinks = Array.from(linkWindowMeta.values())
      .filter(v => v && v.url)
      .map(v => ({ id: v.id || null, url: v.url }));
    if (appSettings.persistSettings) saveSettings();
  } catch (err) {}

  // Save and persist window bounds for this link id when moved/resized (debounced)
  if (id) {
    let saveTimer = null;
    const saveBounds = () => {
      try {
        if (!linkWindow || linkWindow.isDestroyed()) return;
        const b = linkWindow.getBounds();
        const links = getLinksNormalized();
        const idx = links.findIndex(l => Number(l.id) === Number(id));
        if (idx !== -1) {
          links[idx].lastBounds = { x: b.x, y: b.y, width: b.width, height: b.height };
          links[idx].updatedAt = new Date().toISOString();
          saveLinks(links);
        }
      } catch (err) {}
    };

    const scheduleSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveBounds, 500);
    };

    linkWindow.on('move', scheduleSave);
    linkWindow.on('resize', scheduleSave);
    linkWindow.on('close', () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      // save final bounds synchronously
      try { saveBounds(); } catch (e) {}
    });
  }

  linkWindow.on('closed', function () {
    linkWindows.delete(linkWindow);
    linkWindowMeta.delete(linkWindow);
    linkWindow = null;
  });

  return true;
}

ipcMain.handle('open-link', (event, idOrUrl, maybeUrl) => {
  return openLinkWindow(idOrUrl, maybeUrl);
});

// Try to restore the last opened links when the app launches
function reopenLastLinksIfAvailable() {
  try {
    const lastList = Array.isArray(appSettings.lastOpenedLinks) ? appSettings.lastOpenedLinks : [];
    if (!lastList.length) return;
    const links = getLinksNormalized();
    const byId = new Map();
    for (const l of links) byId.set(Number(l.id), l);

    lastList.forEach(entry => {
      if (!entry || !entry.url) return;
      let targetUrl = entry.url;
      if (entry.id) {
        const found = byId.get(Number(entry.id));
        if (found && found.url) targetUrl = found.url;
      }
      openLinkWindow(entry.id || null, targetUrl);
    });
  } catch (err) { /* ignore */ }
}

// Set opacity for all existing windows
ipcMain.handle('set-app-opacity', (event, value) => {
  try {
    if (typeof value !== 'number') value = parseFloat(value);
    if (isNaN(value)) return false;
    value = Math.max(0, Math.min(1, value));
    appOpacity = value;
    // Mirror to settings and persist if enabled
    appSettings.appOpacity = appOpacity;
    if (appSettings.persistSettings) saveSettings();

    // Update main window
      // Tell renderers to update their background-only opacity
      BrowserWindow.getAllWindows().forEach(w => {
        try { w.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
      });

    // Ensure link windows honor the new opacity at the native window level
    applyOpacityToLinkWindows();

    return true;
  } catch (err) {
    console.error('Error setting app opacity:', err);
    return false;
  }
});

ipcMain.handle('get-app-opacity', () => {
  return appOpacity;
});

// Settings persistence & helpers
function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) {
      // write defaults if persist setting is enabled
      fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
      return appSettings;
    }
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    appSettings = Object.assign({}, DEFAULT_SETTINGS, parsed);
    // reflect appOpacity from settings
    if (typeof appSettings.appOpacity === 'number') appOpacity = appSettings.appOpacity;
    // Normalize last opened links (support legacy single object)
    if (appSettings.lastOpenedLink && !Array.isArray(appSettings.lastOpenedLinks)) {
      const legacy = appSettings.lastOpenedLink;
      if (legacy && legacy.url) appSettings.lastOpenedLinks = [{ id: legacy.id || null, url: legacy.url }];
    }
    if (!Array.isArray(appSettings.lastOpenedLinks)) appSettings.lastOpenedLinks = [];
    // Keep launch-on-startup in sync with OS login item
    if (typeof appSettings.launchOnStartup !== 'boolean') {
      appSettings.launchOnStartup = getLaunchOnStartupState();
      if (appSettings.persistSettings) saveSettings();
    } else {
      setLaunchOnStartup(appSettings.launchOnStartup);
    }
    try { ensureLinksFileExists(getDataFilePath()); } catch (err) {}
    return appSettings;
  } catch (err) {
    console.error('Error loading settings:', err);
    appSettings = Object.assign({}, DEFAULT_SETTINGS);
    try { ensureLinksFileExists(defaultDataFile); } catch (e) {}
    return appSettings;
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(appSettings, null, 2));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

// Manage OS-level login item so the app can start with the computer
function setLaunchOnStartup(enabled) {
  try {
    if (typeof app.setLoginItemSettings !== 'function') return false;
    const opts = { openAtLogin: !!enabled, path: process.execPath };
    // Avoid duplicate launches with portable builds by passing no args
    if (process.platform === 'win32') opts.args = [];
    app.setLoginItemSettings(opts);
    return true;
  } catch (err) {
    console.error('Error updating launch on startup:', err);
    return false;
  }
}

function getLaunchOnStartupState() {
  try {
    if (typeof app.getLoginItemSettings !== 'function') return !!appSettings.launchOnStartup;
    const info = app.getLoginItemSettings();
    return !!(info && info.openAtLogin);
  } catch (err) {
    return !!appSettings.launchOnStartup;
  }
}

ipcMain.handle('get-setting', (event, key) => {
  if (!key) return null;
  return appSettings[key];
});

ipcMain.handle('get-all-settings', () => {
  return appSettings;
});

ipcMain.handle('set-setting', (event, key, value) => {
  if (!key) return false;
  let nextValue = value;
  if (key === 'customDataFile') {
    const normalized = (typeof value === 'string') ? value.trim() : '';
    nextValue = normalized || null;
    try {
      ensureLinksFileExists(nextValue || defaultDataFile);
    } catch (err) {
      return false;
    }
  }
  appSettings[key] = nextValue;
  // Persist settings if enabled
  if (appSettings.persistSettings) saveSettings();

  // react to certain setting changes immediately
  try {
    if (key === 'alwaysOnTop') {
      // update main window
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(!!value);
      // update link windows
      for (const win of linkWindows) {
        if (win && !win.isDestroyed()) win.setAlwaysOnTop(!!value);
      }
    }

    if (key === 'customDataFile') {
      initializeLinksStorage();
      notifyLinksChanged();
    }

    if (key === 'appOpacity') {
      // keep appOpacity in sync
      const v = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(v)) {
        appOpacity = Math.max(0, Math.min(1, v));
        // Notify renderers to update their background opacity (main renderer and link preloads will react)
        if (mainWindow && !mainWindow.isDestroyed()) {
          try { mainWindow.webContents.send('app-opacity-changed', appOpacity); } catch (e) {}
        }
        for (const win of linkWindows) {
          if (!win || win.isDestroyed()) continue;
          try {
            win.webContents.send('app-opacity-changed', appOpacity);
          } catch (e) {}
        }
        try { applyOpacityToLinkWindows(); } catch (e) {}
      }
    }

    if (key === 'launchOnStartup') {
      setLaunchOnStartup(!!value);
    }

    if (key === 'telemetryEnabled') {
      applyTelemetryState(!!value);
    }
  } catch (err) { /* ignore */ }

  // If folder sync settings changed, start/stop watcher accordingly
  try {
    if (key === 'useFolderSync' || key === 'syncFolder') {
      if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher();
      else stopSyncWatcher();
    }
  } catch (err) {}
  try {
    if (key === 'useFolderSync' && appSettings.useFolderSync && appSettings.syncFolder) {
      // push current local links into sync file so the chosen folder has the latest state
      try { const latest = getLinksNormalized(); saveLinks(latest); } catch (e) {}
    }
  } catch (err) {}

  // Broadcast change to all windows
  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('setting-changed', key, appSettings[key]); } catch (e) {}
  });

  return true;
});

// Expose a reset endpoint
ipcMain.handle('reset-settings', () => {
  appSettings = Object.assign({}, DEFAULT_SETTINGS);
  saveSettings();
  try { ensureLinksFileExists(defaultDataFile); } catch (e) {}
  // Also reset OS login item toggle
  try { setLaunchOnStartup(!!appSettings.launchOnStartup); } catch (e) {}
  // Clear any remembered last-opened links
  try { appSettings.lastOpenedLinks = []; } catch (e) {}
  try { applyTelemetryState(!!appSettings.telemetryEnabled); } catch (e) {}

  // apply to windows
  try { appOpacity = appSettings.appOpacity; } catch (e) {}
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
      mainWindow.webContents.send('app-opacity-changed', appOpacity);
    } catch (e) {}
  }
  for (const win of linkWindows) {
    if (!win || win.isDestroyed()) continue;
    try {
      win.setAlwaysOnTop(appSettings.alwaysOnTop);
      win.webContents.send('app-opacity-changed', appOpacity);
    } catch (e) {}
  }
  try { applyOpacityToLinkWindows(); } catch (e) {}

  BrowserWindow.getAllWindows().forEach(w => {
    try { w.webContents.send('settings-reset', appSettings); } catch (e) {}
  });
  try { notifyLinksChanged(); } catch (e) {}

  return appSettings;
});

// Start the sync watcher for syncFolder if enabled
function startSyncWatcher() {
  try {
    stopSyncWatcher();
    const syncPath = getSyncFilePath();
    if (!syncPath) return;
    // initialize lastSyncUpdatedAt from existing file
    try {
      if (fs.existsSync(syncPath)) {
        const data = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(data);
        lastSyncUpdatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
      }
    } catch (err) { lastSyncUpdatedAt = 0; }

    // Use fs.watchFile for robust cross-platform polling
    fs.watchFile(syncPath, { interval: 1500 }, (curr, prev) => {
      try {
        if (!fs.existsSync(syncPath)) return;
        const raw = fs.readFileSync(syncPath, 'utf8');
        const parsed = JSON.parse(raw);
        const updatedAt = parsed && parsed.updatedAt ? parsed.updatedAt : 0;
        const remoteLinks = (parsed && Array.isArray(parsed.links)) ? parsed.links : [];
        if (updatedAt && updatedAt > lastSyncUpdatedAt) {
          // Update local copy and notify renderers
          const normalized = normalizeLinkCollection(remoteLinks).normalized;
          try {
            const file = getDataFilePath();
            ensureLinksFileExists(file);
            fs.writeFileSync(file, JSON.stringify(normalized, null, 2));
          } catch (err) {}
          lastSyncUpdatedAt = updatedAt;
          scheduleBackgroundJobsForLinks(normalized);
          notifyLinksChanged();
        }
      } catch (err) {
        // ignore parse errors
      }
    });
    syncWatcher = true;
  } catch (err) {
    console.error('Error starting sync watcher:', err);
  }
}

function stopSyncWatcher() {
  try {
    const syncPath = getSyncFilePath();
    if (syncPath && fs.existsSync(syncPath)) {
      try { fs.unwatchFile(syncPath); } catch (e) {}
    }
    syncWatcher = null;
    lastSyncUpdatedAt = 0;
  } catch (err) {}
}

// IPC: open folder picker for user to choose a sync folder
ipcMain.handle('choose-sync-folder', async () => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      const chosen = res.filePaths[0];
      appSettings.syncFolder = chosen;
      if (appSettings.persistSettings) saveSettings();
      // start watcher if enabled
      if (appSettings.useFolderSync) startSyncWatcher();
      return chosen;
    }
    return null;
  } catch (err) {
    console.error('Error choosing sync folder:', err);
    return null;
  }
});

ipcMain.handle('get-sync-folder', () => {
  return appSettings.syncFolder || null;
});

ipcMain.handle('choose-links-file', async () => {
  try {
    const res = await dialog.showOpenDialog({
      properties: ['openFile', 'promptToCreate'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: getDataFilePath()
    });
    if (res && !res.canceled && res.filePaths && res.filePaths[0]) {
      return res.filePaths[0];
    }
    return null;
  } catch (err) {
    console.error('Error choosing links file:', err);
    return null;
  }
});

ipcMain.handle('get-default-links-file', () => {
  return defaultDataFile;
});

ipcMain.handle('reveal-links-file', () => {
  try {
    const target = getDataFilePath();
    if (target) shell.showItemInFolder(target);
    return target || null;
  } catch (err) {
    console.error('Error revealing links file:', err);
    return null;
  }
});

// Ensure watcher starts on app ready if enabled
app.on('ready', () => {
  try { if (appSettings.useFolderSync && appSettings.syncFolder) startSyncWatcher(); } catch (e) {}
});
