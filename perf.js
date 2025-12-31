const logEl = document.getElementById('perfLog');
const uptimeEl = document.getElementById('perfUptime');
const cpuEl = document.getElementById('perfCpu');
const memoryEl = document.getElementById('perfMemory');
const eventsEl = document.getElementById('perfEvents');
const clearBtn = document.getElementById('perfClearBtn');

const MAX_LOG_ROWS = 300;

function formatMs(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${value.toFixed(1)} ms`;
}

function formatUptime(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '--';
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs - mins * 60;
  return `${mins}m ${rem.toFixed(0)}s`;
}

function formatPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const parts = [];
  if (typeof payload.ms === 'number') parts.push(`ms=${payload.ms.toFixed(2)}`);
  if (typeof payload.count === 'number') parts.push(`count=${payload.count}`);
  if (typeof payload.filtered === 'number') parts.push(`filtered=${payload.filtered}`);
  if (typeof payload.total === 'number') parts.push(`total=${payload.total}`);
  if (typeof payload.queryLength === 'number') parts.push(`queryLen=${payload.queryLength}`);
  if (typeof payload.grouping === 'string') parts.push(`grouping=${payload.grouping}`);
  if (typeof payload.url === 'string') parts.push(`url=${payload.url}`);
  if (parts.length) return parts.join(' ');
  return '';
}

function addLogRow(entry) {
  if (!logEl || !entry) return;
  const row = document.createElement('div');
  row.className = 'perf-log-row';
  const payload = formatPayload(entry.payload);
  row.textContent = `[+${formatMs(entry.elapsedMs)}] ${entry.label}${payload ? ` — ${payload}` : ''}`;
  logEl.prepend(row);
  while (logEl.children.length > MAX_LOG_ROWS) {
    logEl.removeChild(logEl.lastChild);
  }
}

function updateStats(stats) {
  if (!stats) return;
  if (uptimeEl) uptimeEl.textContent = formatUptime(stats.uptimeMs);
  if (cpuEl) cpuEl.textContent = stats.cpuPercent === null ? '--' : `${stats.cpuPercent.toFixed(1)}%`;
  if (memoryEl) {
    if (typeof stats.rssMB === 'number' && typeof stats.heapUsedMB === 'number') {
      memoryEl.textContent = `${stats.rssMB.toFixed(1)} MB / ${stats.heapUsedMB.toFixed(1)} MB`;
    } else {
      memoryEl.textContent = '--';
    }
  }
  if (eventsEl) eventsEl.textContent = String(stats.events || 0);
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (logEl) logEl.innerHTML = '';
  });
}

if (window.perfAPI && typeof window.perfAPI.requestPerfHistory === 'function') {
  window.perfAPI.requestPerfHistory().then((entries) => {
    if (!Array.isArray(entries)) return;
    entries.slice().reverse().forEach(addLogRow);
  }).catch(() => {});
}

if (window.perfAPI && typeof window.perfAPI.onPerfEvent === 'function') {
  window.perfAPI.onPerfEvent(addLogRow);
}

if (window.perfAPI && typeof window.perfAPI.onPerfStats === 'function') {
  window.perfAPI.onPerfStats(updateStats);
}
