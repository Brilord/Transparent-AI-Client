# Repository metadata for Codex/Claude

This repo hosts the Transparent AI Client, an Electron-based link manager that enriches saved URLs with metadata and lets you open them inside transparent windows.

## Entrypoints

- `src/main/main.js` – Electron main process setup, metadata queue, IPC handlers, and background jobs.
- `src/main/preload.js` – Exposes renderer-safe APIs (settings, link management, metadata refresh).
- `src/renderer/renderer.js` – DOM wiring for the UI, metadata indicators, form handlers, and settings sync.
- `src/renderer/index.html` + `styles.css` – Core markup and CSS, including metadata preview templates.
- `package.json` – npm scripts (`start`, `dev`, `test`, platform builds) and dependency graph.

## Directory roles

- `assets/` – packaging/resizing assets used during builds.
- `transparent-ai-client-dist/` & `dist/` – build outputs; ignore for development.
- `tests/` – Playwright-based smoke and metadata refresh validation suites.
- `website/` – marketing/landing pages (not required for app logic).

## Key workflows

- `npm install` → populates `node_modules`.
- `npm start` → runs packaged Electron app (main + renderer).
- `npm run dev` → starts reloading dev mode with additional logging.
- `npm test` → launches smoke tests ensuring metadata, health, and capture flows work.
- `npm run build:<platform>` → produces installers/zips under `transparent-ai-client-dist/`.

## Metadata exposure expectations

1. Link metadata: each saved link stores `metadata` (title, description, favicon, preview image, colors) plus health/timestamps. This is refreshed via `metadataQueue` and surfaced in the renderer through indicators and metadata panels.
2. Settings affecting metadata live in `appSettings` (e.g., `metadataEnabled`, `metadataRefreshIntervalMinutes`) and are persisted via the settings file.
3. Injection/resizer logic is optional; fallback controls in the renderer cover metadata actions (refresh button, indicator status).

## How to help future agents

1. Use `src/main/main.js` and `src/renderer/renderer.js` to answer questions about metadata handling, IPC events, or UI states.
2. Refer to `README.md` / `TECHNICAL_README.md` for higher-level workflows, packaging, and troubleshooting guidance.
3. Mention `tests/extended.js` when discussing metadata-refresh expectations because it asserts the metadata queue works.

If additional structured metadata is required (e.g., JSON schema), derive it from the above sections and document it here before the next step.
