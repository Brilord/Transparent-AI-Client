function createReporter(suiteName) {
  const frames = ['-', '\\', '|', '/'];
  let frameIdx = 0;
  let timer = null;
  let current = null;
  let passed = 0;
  let failed = 0;
  let headerPrinted = false;

  const lineWidth = () => Math.max(40, process.stdout.columns || 80);

  const clearLine = () => {
    const width = lineWidth();
    process.stdout.write('\r' + ' '.repeat(width) + '\r');
  };

  const render = () => {
    if (!current) return;
    const frame = frames[frameIdx];
    frameIdx = (frameIdx + 1) % frames.length;
    process.stdout.write(`\r[${frame}] ${current}`);
  };

  const ensureHeader = () => {
    if (headerPrinted) return;
    headerPrinted = true;
    if (suiteName) console.log(`== ${suiteName} ==`);
  };

  const start = (label) => {
    ensureHeader();
    current = label;
    if (!timer) timer = setInterval(render, 120);
    render();
  };

  const pass = (label) => {
    passed += 1;
    if (current) clearLine();
    console.log(`[PASS] ${label}`);
    current = null;
  };

  const fail = (label, err) => {
    failed += 1;
    if (current) clearLine();
    console.log(`[FAIL] ${label}`);
    if (err) {
      const message = err && err.stack ? err.stack : String(err);
      console.log(message);
    }
    current = null;
  };

  const info = (message) => {
    if (current) clearLine();
    console.log(`[INFO] ${message}`);
    if (current) render();
  };

  const finalize = () => {
    if (timer) clearInterval(timer);
    timer = null;
    if (current) clearLine();
    current = null;
    ensureHeader();
    console.log(`[DONE] ${passed} passed, ${failed} failed.`);
  };

  return { start, pass, fail, info, finalize };
}

module.exports = { createReporter };
