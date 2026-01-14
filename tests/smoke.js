const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert/strict');
const { _electron: electron } = require('playwright-core');
const clipboardy = require('clipboardy');

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

async function runIpcSmokeTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-smoke-'));
  const { app, page } = await launchApp(baseDir);

  const initialLinks = await page.evaluate(() => window.electron.getLinks());
  assert.ok(Array.isArray(initialLinks), 'getLinks should return an array');

  const created = await page.evaluate(() => window.electron.addLink({
    url: 'https://example.com',
    title: 'Example'
  }));
  assert.ok(created && created.id, 'addLink should return a new link');

  const updated = await page.evaluate((id) => window.electron.updateLink({
    id,
    title: 'Example Updated'
  }), created.id);
  assert.equal(updated, true, 'updateLink should return true');

  const tagsUpdated = await page.evaluate((id) => window.electron.bulkUpdateTags([id], ['smoke']), created.id);
  assert.equal(tagsUpdated, true, 'bulkUpdateTags should return true');

  const afterUpdate = await page.evaluate(() => window.electron.getLinks());
  const updatedLink = afterUpdate.find((link) => link.url === 'https://example.com');
  assert.equal(updatedLink.title, 'Example Updated', 'link title should update');
  assert.deepEqual(updatedLink.tags, ['smoke'], 'link tags should update');

  const deleted = await page.evaluate((id) => window.electron.bulkDelete([id]), created.id);
  assert.equal(deleted, true, 'bulkDelete should return true');

  const afterDelete = await page.evaluate(() => window.electron.getLinks());
  const deletedLink = afterDelete.find((link) => link.id === created.id);
  assert.ok(deletedLink && deletedLink.deletedAt, 'link should be soft-deleted');

  const restored = await page.evaluate((id) => window.electron.bulkRestore([id]), created.id);
  assert.equal(restored, true, 'bulkRestore should return true');

  const afterRestore = await page.evaluate(() => window.electron.getLinks());
  const restoredLink = afterRestore.find((link) => link.id === created.id);
  assert.ok(restoredLink && !restoredLink.deletedAt, 'link should be restored');

  const prevState = await page.evaluate(async (id) => {
    const links = await window.electron.getLinks();
    const link = links.find((item) => item.id === id);
    return {
      openCount: link ? link.openCount : 0,
      lastOpenedAt: link ? link.lastOpenedAt : null
    };
  }, created.id);

  const linkWindowPromise = app.waitForEvent('window');
  await page.evaluate((id) => window.electron.openLinkWithId(id, 'https://example.com'), created.id);
  const linkWindow = await linkWindowPromise;
  await linkWindow.close();

  const undone = await page.evaluate(({ id, prev }) => window.electron.undoLinkOpen(id, prev), {
    id: created.id,
    prev: prevState
  });
  assert.equal(undone, true, 'undoLinkOpen should succeed');
  const afterUndo = await page.evaluate(async (id) => {
    const links = await window.electron.getLinks();
    const link = links.find((item) => item.id === id);
    return link ? { openCount: link.openCount, lastOpenedAt: link.lastOpenedAt } : null;
  }, created.id);
  assert.strictEqual(afterUndo?.openCount, prevState.openCount);

  await app.close();
}

async function runLanguageLinkingTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-lang-'));
  const { app, page } = await launchApp(baseDir);

  await page.waitForSelector('#addBtn', { timeout: 10000 });

  const snapshot = await page.evaluate(() => {
    const captureTitle = document.querySelector('[data-i18n="section.capture"]')?.textContent?.trim();
    const urlPlaceholder = document.getElementById('urlInput')?.placeholder;
    const addLabel = document.getElementById('addBtn')?.textContent?.trim();
    const quickStatsLabel = document.querySelector('[data-i18n="stats.total"]')?.textContent?.trim();
    return { captureTitle, urlPlaceholder, addLabel, quickStatsLabel };
  });

  assert.notStrictEqual(snapshot.captureTitle, 'section.capture', 'capture section title should be translated');
  assert.ok(snapshot.urlPlaceholder && !snapshot.urlPlaceholder.includes('placeholders.'), 'URL placeholder should be localized text');
  assert.notStrictEqual(snapshot.addLabel, 'actions.addLink', 'Add button text should be translated');
  assert.notStrictEqual(snapshot.quickStatsLabel, 'stats.total', 'Quick stats label should be translated');

  await app.close();
}

async function runSettingsPersistenceTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-settings-'));
  const { app, page } = await launchApp(baseDir);
  await page.waitForSelector('#settingsBtn');

  await page.evaluate(() => Promise.all([
    window.electron.setSetting('injectResizers', false),
    window.electron.setSetting('alwaysOnTop', true)
  ]));
  const [resizers, alwaysOnTop] = await Promise.all([
    page.evaluate(() => window.electron.getSetting('injectResizers')),
    page.evaluate(() => window.electron.getSetting('alwaysOnTop'))
  ]);
  assert.strictEqual(resizers, false);
  assert.strictEqual(alwaysOnTop, true);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#settingsBtn');
  await page.click('#settingsBtn');
  await page.waitForSelector('#settingsPanel:not(.hidden)');
  const panelState = await page.evaluate(() => ({
    resizers: document.getElementById('injectResizersChk')?.checked,
    always: document.getElementById('alwaysOnTopChk')?.checked
  }));
  assert.strictEqual(panelState.resizers, false);
  assert.strictEqual(panelState.always, true);

  await app.close();
}

async function runClipboardImportTest() {
  const urls = ['https://example.com/clipboard', 'https://example.org/clipboard'];
  clipboardy.writeSync(urls.join('\n'));
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-clipboard-'));
  const { app, page } = await launchApp(baseDir);
  await page.waitForSelector('#addBtn');

  const result = await page.evaluate(() => window.electron.importClipboardLinks({
    tags: ['clipboard-test'],
    priority: 'low'
  }));
  assert.ok(result.added >= urls.length, 'importClipboardLinks should add new entries');

  const links = await page.evaluate(() => window.electron.getLinks());
  urls.forEach((url) => {
    assert.ok(links.some((link) => link.url === url), `clipboard URL ${url} should exist`);
  });

  await app.close();
}

async function runAuxWindowTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-layout-'));
  const { app, page } = await launchApp(baseDir);
  await page.waitForSelector('#settingsBtn');

  const layoutPromise = app.waitForEvent('window');
  await page.evaluate(() => window.electron.openLayoutWindow());
  const layoutPage = await layoutPromise;
  await layoutPage.waitForLoadState('domcontentloaded');
  const layoutUrl = layoutPage.url();
  assert.ok(layoutUrl.includes('layout'), 'Layout window should load layout.html');
  await layoutPage.close();

  await app.close();
}

async function runLanguageApiTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-lang-api-'));
  const { app, page } = await launchApp(baseDir);
  await page.waitForSelector('#settingsBtn');

  await page.evaluate(() => window.electron.setSetting('language', 'ko'));
  await page.waitForFunction(() => document.documentElement.lang === 'ko');
  const addLabel = await page.evaluate(() => document.getElementById('addBtn')?.textContent?.trim());
  assert.strictEqual(addLabel, '링크 추가');
  const currentLanguage = await page.evaluate(() => window.electron.getSetting('language'));
  assert.strictEqual(currentLanguage, 'ko');

  await page.evaluate(() => window.electron.setSetting('language', 'en'));
  await app.close();
}

async function runE2ePersistenceTest() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plana-e2e-'));
  let app = null;
  try {
    const launch = await launchApp(baseDir);
    app = launch.app;
    const page = launch.page;

    const created = await page.evaluate(() => window.electron.addLink({
      url: 'https://example.com/persist',
      title: 'Persisted'
    }));
    assert.ok(created && created.id, 'addLink should create a link');
    await app.close();
    app = null;

    const relaunch = await launchApp(baseDir);
    app = relaunch.app;
    const page2 = relaunch.page;
    const links = await page2.evaluate(() => window.electron.getLinks());
    assert.ok(links.some((link) => link.url === 'https://example.com/persist'), 'link should persist after relaunch');
    await app.close();
  } finally {
    if (app) await app.close();
  }
}

(async () => {
  await runIpcSmokeTest();
  await runLanguageLinkingTest();
  await runSettingsPersistenceTest();
  await runClipboardImportTest();
  await runLanguageApiTest();
  await runAuxWindowTest();
  await runE2ePersistenceTest();
  console.log('Smoke tests passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
