const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert/strict');
const { _electron: electron } = require('playwright-core');

async function launchApp(userDataDir) {
  const app = await electron.launch({
    args: [path.join(__dirname, '..', 'main.js')],
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
  await runE2ePersistenceTest();
  console.log('Smoke tests passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
