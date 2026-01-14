const clipboardy = require('clipboardy');

function resolveClipboardApi() {
  if (clipboardy && typeof clipboardy === 'object' && clipboardy.default) return clipboardy.default;
  return clipboardy;
}

const api = resolveClipboardApi();

async function writeClipboardText(text) {
  if (api && typeof api.writeSync === 'function') {
    api.writeSync(text);
    return;
  }
  if (api && typeof api.write === 'function') {
    await api.write(text);
    return;
  }
  throw new Error('clipboardy write is unavailable');
}

async function readClipboardText() {
  if (api && typeof api.readSync === 'function') {
    return api.readSync();
  }
  if (api && typeof api.read === 'function') {
    return await api.read();
  }
  throw new Error('clipboardy read is unavailable');
}

module.exports = { writeClipboardText, readClipboardText };
