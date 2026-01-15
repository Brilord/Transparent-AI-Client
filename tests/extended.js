const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const assert = require('assert/strict');
const { _electron: electron } = require('playwright-core');
const { writeClipboardText, readClipboardText } = require('./clipboard');
const { createReporter } = require('./reporter');

async function launchApp(userDataDir) {
  const app = await electron.launch({
    args: [path.join(__dirname, '..', 'src', 'main', 'main.js')],
    env: {
      ...process.env,
      PLANAV2_TEST_USER_DATA: userDataDir
    }
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function runWithApp(prefix, handler) {
  const baseDir = createTempDir(prefix);
  const { app, page } = await launchApp(baseDir);
  try {
    await handler({ app, page, baseDir });
  } finally {
    await app.close();
    fs.rmSync(baseDir, { recursive: true, force: true });
  }
}

async function stubSaveDialog(app, filePath) {
  await app.evaluate(({ filePath: target }) => {
    const { dialog } = require('electron');
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: target });
  }, { filePath });
}

async function stubOpenDialog(app, filePath) {
  await app.evaluate(({ filePath: target }) => {
    const { dialog } = require('electron');
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [target] });
  }, { filePath });
}

async function waitFor(condition, { timeoutMs = 15000, intervalMs = 250 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await condition();
    if (ok) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

async function waitForOrThrow(condition, message, options) {
  const ok = await waitFor(condition, options);
  if (!ok) {
    throw new Error(message);
  }
}

async function getWindowPartition(app, target) {
  return app.evaluate(({ target }) => {
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.getAllWindows().find((w) => {
      try { return w.webContents.getURL().includes(target); } catch (err) { return false; }
    });
    if (!win) return null;
    return { partition: win.webContents.session.getPartition() };
  }, { target });
}

async function focusApp(page) {
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

async function isClipboardBannerVisible(page) {
  return page.evaluate(() => !document.getElementById('clipboardBanner')?.classList.contains('hidden'));
}

function startTestServer() {
  let reloadCount = 0;
  const server = http.createServer((req, res) => {
    const url = req.url || '/';
    if (url.startsWith('/redirect')) {
      res.statusCode = 302;
      res.setHeader('Location', '/meta');
      res.end();
      return;
    }
    if (url.startsWith('/meta')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(`<!doctype html>
<html>
<head>
  <title>Meta Title</title>
  <meta property="og:title" content="Meta Title">
  <meta property="og:description" content="Meta Description">
  <meta property="og:site_name" content="Test Site">
  <meta name="theme-color" content="#112233">
  <link rel="icon" href="/favicon.ico">
</head>
<body>Meta Page</body>
</html>`);
      return;
    }
    if (url.startsWith('/page1')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html><body>
        <h1>Page 1</h1>
        <a href="/page2">Next</a>
      </body></html>`);
      return;
    }
    if (url.startsWith('/page2')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html><body>
        <h1>Page 2</h1>
        <a href="/page1">Back</a>
      </body></html>`);
      return;
    }
    if (url.startsWith('/reload')) {
      reloadCount += 1;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(`<!doctype html><html><body>
        <div id="count">${reloadCount}</div>
      </body></html>`);
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('ok');
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        server,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

async function runExportImportJsonTest() {
  await runWithApp('plana-export-json-', async ({ app, page, baseDir }) => {
    const exportPath = path.join(baseDir, 'links.json');
    await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/export-json',
      title: 'Export JSON'
    }));
    await stubSaveDialog(app, exportPath);
    const savedPath = await page.evaluate(() => window.electron.exportLinks());
    assert.strictEqual(savedPath, exportPath);
    const raw = fs.readFileSync(exportPath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(parsed.some((link) => link.url === 'https://example.com/export-json'));
  });

  await runWithApp('plana-import-json-', async ({ app, page, baseDir }) => {
    const importPath = path.join(baseDir, 'import.json');
    const payload = [{
      url: 'https://example.com/import-json',
      title: 'Import JSON',
      tags: ['json']
    }];
    fs.writeFileSync(importPath, JSON.stringify(payload, null, 2), 'utf8');
    await stubOpenDialog(app, importPath);
    const result = await page.evaluate(() => window.electron.importLinks());
    assert.ok(result);
    const links = await page.evaluate(() => window.electron.getLinks());
    assert.ok(links.some((link) => link.url === 'https://example.com/import-json'));
  });
}

async function runExportImportCsvTest() {
  await runWithApp('plana-export-csv-', async ({ app, page, baseDir }) => {
    const exportPath = path.join(baseDir, 'links.csv');
    await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/export-csv',
      title: 'Export CSV'
    }));
    await stubSaveDialog(app, exportPath);
    const savedPath = await page.evaluate(() => window.electron.exportLinksCsv());
    assert.strictEqual(savedPath, exportPath);
    const raw = fs.readFileSync(exportPath, 'utf8');
    assert.ok(raw.includes('https://example.com/export-csv'));
  });

  await runWithApp('plana-import-csv-', async ({ app, page, baseDir }) => {
    const importPath = path.join(baseDir, 'import.csv');
    const csv = [
      'id,url,title,tags,favorite,pinned,folder,notes,priority',
      '1,https://example.com/import-csv,CSV Title,alpha|beta,true,false,Folder,Notes,high'
    ].join('\n');
    fs.writeFileSync(importPath, csv, 'utf8');
    await stubOpenDialog(app, importPath);
    const added = await page.evaluate(() => window.electron.importLinksCsv());
    assert.strictEqual(added, 1);
    const links = await page.evaluate(() => window.electron.getLinks());
    const link = links.find((item) => item.url === 'https://example.com/import-csv');
    assert.ok(link);
    assert.strictEqual(link.title, 'CSV Title');
    assert.deepEqual(link.tags, ['alpha', 'beta']);
    assert.strictEqual(link.priority, 'high');
  });
}

async function runManualBackupTest() {
  await runWithApp('plana-backup-', async ({ page, baseDir }) => {
    await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/backup',
      title: 'Backup'
    }));
    const first = await page.evaluate(() => window.electron.manualBackup(2));
    assert.ok(first);
    const second = await page.evaluate(() => window.electron.manualBackup(2));
    assert.ok(second);
    const third = await page.evaluate(() => window.electron.manualBackup(2));
    assert.ok(third);
    const backupsDir = path.join(baseDir, 'backups');
    const backups = fs.readdirSync(backupsDir).filter((file) => file.startsWith('links-'));
    assert.ok(backups.length <= 2);
  });
}

async function runFolderSyncTest() {
  await runWithApp('plana-sync-', async ({ page }) => {
    const syncDir = createTempDir('plana-sync-folder-');
    try {
      const syncFile = path.join(syncDir, 'links.json');
      await page.evaluate(() => window.electron.addLink({
        url: 'https://example.com/sync-local',
        title: 'Sync Local'
      }));
      await page.evaluate((dir) => window.electron.setSetting('syncFolder', dir), syncDir);
      await page.evaluate(() => window.electron.setSetting('useFolderSync', true));

      await waitForOrThrow(() => fs.existsSync(syncFile), 'sync file should be written', { timeoutMs: 10000 });
      const wrapper = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
      assert.ok(wrapper && wrapper.updatedAt && Array.isArray(wrapper.links));
      assert.ok(wrapper.links.some((link) => link.url === 'https://example.com/sync-local'));

      const incoming = {
        updatedAt: Date.now() + 1000,
        links: [{
          id: Date.now(),
          url: 'https://example.com/sync-remote',
          title: 'Sync Remote',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorite: false,
          tags: [],
          pinned: false,
          folder: '',
          notes: '',
          priority: 'normal',
          openCount: 0,
          lastOpenedAt: null,
          deletedAt: null,
          sortOrder: 10,
          metadata: {},
          health: {}
        }]
      };
      fs.writeFileSync(syncFile, JSON.stringify(incoming, null, 2), 'utf8');

      await waitForOrThrow(async () => {
        const links = await page.evaluate(() => window.electron.getLinks());
        return links.some((link) => link.url === 'https://example.com/sync-remote');
      }, 'sync should pull remote link', { timeoutMs: 12000, intervalMs: 500 });
    } finally {
      fs.rmSync(syncDir, { recursive: true, force: true });
    }
  });
}

async function runMetadataHealthTest() {
  const server = await startTestServer();
  try {
    await runWithApp('plana-meta-health-', async ({ page }) => {
      const created = await page.evaluate((url) => window.electron.addLink({
        url,
        title: ''
      }), `${server.baseUrl}/meta`);

      await page.evaluate((id) => window.electron.refreshLinkMetadata(id), created.id);
      await page.evaluate((id) => window.electron.refreshLinkHealth(id), created.id);

      await waitForOrThrow(async () => {
        const links = await page.evaluate(() => window.electron.getLinks());
        const link = links.find((item) => item.id === created.id);
        return !!(link && link.metadata && link.metadata.lastFetchedAt && link.health && link.health.checkedAt);
      }, 'metadata and health should refresh', { timeoutMs: 20000, intervalMs: 500 });

      const link = await page.evaluate((id) => {
        return window.electron.getLinks().then((links) => links.find((item) => item.id === id));
      }, created.id);
      assert.strictEqual(link.metadata.title, 'Meta Title');
      assert.strictEqual(link.health.status, 'ok');
    });
  } finally {
    await server.close();
  }
}

async function runLinkSessionModeTest() {
  const server = await startTestServer();
  try {
    await runWithApp('plana-session-', async ({ app, page }) => {
      const link = await page.evaluate((url) => window.electron.addLink({
        url,
        title: 'Session Link'
      }), `${server.baseUrl}/page1`);

      await page.evaluate(() => window.electron.setSetting('linkSessionMode', 'shared'));
      let winPromise = app.waitForEvent('window');
      await page.evaluate((id, url) => window.electron.openLinkWithId(id, url), link.id, link.url);
      let linkWindow = await winPromise;
      try {
        let info;
        await waitForOrThrow(async () => {
          info = await getWindowPartition(app, server.baseUrl);
          return !!info;
        }, 'shared mode window should appear');
        assert.ok(!info.partition || info.partition === 'persist:default');
      } finally {
        await linkWindow.close();
      }

      await page.evaluate(() => window.electron.setSetting('linkSessionMode', 'per-link'));
      winPromise = app.waitForEvent('window');
      await page.evaluate((id, url) => window.electron.openLinkWithId(id, url), link.id, link.url);
      linkWindow = await winPromise;
      try {
        let info;
        await waitForOrThrow(async () => {
          info = await getWindowPartition(app, server.baseUrl);
          return !!info;
        }, 'per-link window should appear');
        assert.strictEqual(info.partition, `persist:link-${Math.floor(link.id)}`);
      } finally {
        await linkWindow.close();
      }

      await page.evaluate(() => window.electron.setSetting('linkSessionMode', 'incognito'));
      winPromise = app.waitForEvent('window');
      await page.evaluate((id, url) => window.electron.openLinkWithId(id, url), link.id, link.url);
      linkWindow = await winPromise;
      try {
        let info;
        await waitForOrThrow(async () => {
          info = await getWindowPartition(app, server.baseUrl);
          return !!info;
        }, 'incognito window should appear');
        assert.ok(info.partition && info.partition.startsWith('temp-'));
      } finally {
        await linkWindow.close();
      }
    });
  } finally {
    await server.close();
  }
}

async function runLinkActionsTest() {
  await runWithApp('plana-actions-', async ({ page }) => {
    const first = await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/first',
      title: 'First'
    }));
    const second = await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/second',
      title: 'Second'
    }));

    const fav = await page.evaluate((id) => window.electron.toggleFavorite(id), first.id);
    assert.strictEqual(fav, true);
    let links = await page.evaluate(() => window.electron.getLinks());
    let link = links.find((item) => item.id === first.id);
    assert.strictEqual(link.favorite, true);

    const pin = await page.evaluate((id) => window.electron.setLinkPinned(id, true), first.id);
    assert.strictEqual(pin, true);
    links = await page.evaluate(() => window.electron.getLinks());
    link = links.find((item) => item.id === first.id);
    assert.strictEqual(link.pinned, true);

    const tagsOk = await page.evaluate((ids) => window.electron.bulkUpdateTags(ids, ['alpha', 'beta']), [first.id, second.id]);
    assert.strictEqual(tagsOk, true);
    links = await page.evaluate(() => window.electron.getLinks());
    assert.ok(links.find((item) => item.id === second.id).tags.includes('alpha'));

    const reordered = await page.evaluate((ids) => window.electron.reorderLinks(ids), [second.id, first.id]);
    assert.strictEqual(reordered, true);
    links = await page.evaluate(() => window.electron.getLinks());
    assert.strictEqual(links[0].id, second.id);
  });
}

async function runWindowControlsTest() {
  await runWithApp('plana-window-controls-', async ({ page }) => {
    const start = await page.evaluate(() => windowManager.getBounds());
    assert.ok(start);
    await page.keyboard.press('Control+Alt+ArrowRight');
    await waitForOrThrow(async () => {
      const bounds = await page.evaluate(() => windowManager.getBounds());
      return bounds.width >= start.width + 10;
    }, 'window should resize', { timeoutMs: 3000, intervalMs: 200 });

    await page.keyboard.press('Control+Alt+Shift+ArrowDown');
    await waitForOrThrow(async () => {
      const bounds = await page.evaluate(() => windowManager.getBounds());
      return bounds.y >= start.y + 10;
    }, 'window should move', { timeoutMs: 3000, intervalMs: 200 });

    const reset = await page.evaluate(() => window.electron.resetWindowBounds());
    assert.strictEqual(reset, true);
    const after = await page.evaluate(() => windowManager.getBounds());
    assert.ok(after.width > 0 && after.height > 0);
  });
}

async function runClipboardBannerTest() {
  await runWithApp('plana-clipboard-banner-', async ({ page }) => {
    await writeClipboardText('not-a-url');
    const invalid = await page.evaluate(() => window.electron.peekClipboardLink());
    assert.strictEqual(invalid, null);

    await writeClipboardText('https://example.com/banner');
    await focusApp(page);
    await waitForOrThrow(() => isClipboardBannerVisible(page), 'clipboard banner should show', { timeoutMs: 8000, intervalMs: 250 });

    await page.click('#dismissClipboardBannerBtn');
    const hidden = await page.evaluate(() => document.getElementById('clipboardBanner')?.classList.contains('hidden'));
    assert.strictEqual(hidden, true);

    await writeClipboardText('https://example.com/banner2');
    await focusApp(page);
    await waitForOrThrow(() => isClipboardBannerVisible(page), 'clipboard banner should show again', { timeoutMs: 8000, intervalMs: 250 });

    await page.click('#useClipboardLinkBtn');
    const inputValue = await page.evaluate(() => document.getElementById('urlInput')?.value);
    assert.strictEqual(inputValue, 'https://example.com/banner2');
  });
}

async function runSettingsEdgeCaseTest() {
  await runWithApp('plana-settings-', async ({ page, baseDir }) => {
    const customDataPath = path.join(baseDir, 'custom', 'links.json');
    const customOk = await page.evaluate((target) => window.electron.setSetting('customDataFile', target), customDataPath);
    assert.strictEqual(customOk, true);
    assert.ok(fs.existsSync(customDataPath));

    const langOk = await page.evaluate(() => window.electron.setSetting('language', 'es'));
    assert.strictEqual(langOk, true);
    const lang = await page.evaluate(() => window.electron.getSetting('language'));
    assert.strictEqual(lang, 'en');

    const badPath = path.join(baseDir, 'missing.png');
    const backgroundOk = await page.evaluate((target) => window.electron.setSetting('backgroundImagePath', target), badPath);
    assert.strictEqual(backgroundOk, false);
  });
}

async function runLinkWindowNavigationTest() {
  const server = await startTestServer();
  try {
    await runWithApp('plana-link-nav-', async ({ app, page }) => {
      const link = await page.evaluate((url) => window.electron.addLink({
        url,
        title: 'Nav'
      }), `${server.baseUrl}/page1`);
      const winPromise = app.waitForEvent('window');
      await page.evaluate((id, url) => window.electron.openLinkWithId(id, url), link.id, link.url);
      const linkWindow = await winPromise;
      try {
        await linkWindow.waitForLoadState('domcontentloaded');
        await linkWindow.evaluate((target) => { window.location.href = `${target}/page2`; }, server.baseUrl);
        await linkWindow.waitForLoadState('domcontentloaded');
        assert.ok(linkWindow.url().includes('/page2'));

        await linkWindow.keyboard.press('Alt+ArrowLeft');
        await linkWindow.waitForLoadState('domcontentloaded');
        await waitForOrThrow(() => linkWindow.url().includes('/page1'), 'back navigation should reach page1', { timeoutMs: 8000 });

        await linkWindow.keyboard.press('Alt+ArrowRight');
        await linkWindow.waitForLoadState('domcontentloaded');
        await waitForOrThrow(() => linkWindow.url().includes('/page2'), 'forward navigation should reach page2', { timeoutMs: 8000 });

        await linkWindow.goto(`${server.baseUrl}/reload`);
        const before = await linkWindow.evaluate(() => document.getElementById('count')?.textContent);
        await linkWindow.keyboard.press('Alt+R');
        await linkWindow.waitForLoadState('domcontentloaded');
        const after = await linkWindow.evaluate(() => document.getElementById('count')?.textContent);
        assert.notStrictEqual(after, before);

        await linkWindow.keyboard.press('Alt+C');
        await waitForOrThrow(async () => {
          const copied = await readClipboardText();
          return copied.includes('/reload');
        }, 'clipboard should contain reloaded URL', { timeoutMs: 2000, intervalMs: 100 });
      } finally {
        await linkWindow.close();
      }
    });
  } finally {
    await server.close();
  }
}

async function runAuxWindowTest() {
  await runWithApp('plana-aux-', async ({ app, page }) => {
    const chatPromise = app.waitForEvent('window');
    await page.evaluate(() => window.electron.openChatWindow());
    const chatWindow = await chatPromise;
    try {
      await chatWindow.waitForLoadState('domcontentloaded');
      assert.ok(chatWindow.url().includes('chat=1'));
    } finally {
      await chatWindow.close();
    }
  });
}

(async () => {
  const reporter = createReporter('Extended tests');
  const run = async (label, fn) => {
    reporter.start(label);
    try {
      await fn();
      reporter.pass(label);
    } catch (err) {
      reporter.fail(label, err);
      throw err;
    }
  };

  try {
    await run('Export/import JSON', runExportImportJsonTest);
    await run('Export/import CSV', runExportImportCsvTest);
    await run('Manual backup', runManualBackupTest);
    await run('Folder sync', runFolderSyncTest);
    await run('Metadata + health', runMetadataHealthTest);
    await run('Link session modes', runLinkSessionModeTest);
    await run('Link actions', runLinkActionsTest);
    await run('Window controls', runWindowControlsTest);
    await run('Clipboard banner', runClipboardBannerTest);
    await run('Settings edge cases', runSettingsEdgeCaseTest);
    await run('Link window navigation', runLinkWindowNavigationTest);
    await run('Chat window', runAuxWindowTest);
    reporter.finalize();
    process.exit(0);
  } catch (_err) {
    reporter.finalize();
    process.exit(1);
  }
})();
