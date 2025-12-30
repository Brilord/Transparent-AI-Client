import Image from "next/image";
import exampleOperation from "../example-operation.png";

export default function Home() {
  return (
    <div className="page">
      <header className="hero">
        <nav className="nav">
          <div className="logo">Transparent Link Client</div>
          <div className="nav-links">
            <a href="#demo">Example</a>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#shortcuts">Shortcuts</a>
            <a className="nav-cta" href="#download">
              Get the app
            </a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              A transparent browser window for a link client
            </p>
            <h1>
              Keep every tab in reach without the clutter. This is a transparent
              browser window for a link client that turns links into a calm
              workspace.
            </h1>
            <p className="lead">
              A desktop link vault with tags, folders, notes, and workspaces.
              Capture fast, launch windows instantly, and drive everything with
              keyboard shortcuts.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#download">
                Download for desktop
              </a>
              <a className="button ghost" href="#features">
                Explore features
              </a>
            </div>
            <div className="hero-meta">
              <div className="meta-card">Local JSON storage</div>
              <div className="meta-card">Fuzzy search and tags</div>
              <div className="meta-card">Workspace snapshots</div>
            </div>
          </div>

          <div className="hero-visual">
            <section id="demo" className="hero-demo lift">
              <p className="eyebrow">Example</p>
              <div className="demo-frame">
                <Image
                  src={exampleOperation}
                  alt="Example of the Transparent AI Client workflow showing transparent windows and saved links."
                  className="demo-image"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="demo-caption">
                Example of Transparent AI Client running a link library with floating windows.
              </div>
            </section>
            <div className="floating-card drift">
              <div className="floating-title">Command palette</div>
              <p>Search links, edit, and launch in seconds.</p>
              <div className="pill-row">
                <span className="pill">Ctrl + K</span>
                <span className="pill">Fuzzy</span>
                <span className="pill">Tags</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section">
        <div className="section-heading">
          <h2>Built for focus, not browser chaos</h2>
          <p>
            This client keeps your research, dashboards, and references close
            without hiding behind a crowded tab bar.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>Glass UI and transparency</h3>
            <p>
              Frameless windows with adjustable opacity keep your workspace
              light, calm, and always readable.
            </p>
          </article>
          <article className="feature-card">
            <h3>Fast capture flows</h3>
            <p>
              Paste URLs, pull from the clipboard, or drag and drop to capture
              context instantly.
            </p>
          </article>
          <article className="feature-card">
            <h3>Tags, folders, and priorities</h3>
            <p>
              Organize by tag chips, folder groups, and priority lanes to keep
              projects sorted.
            </p>
          </article>
          <article className="feature-card">
            <h3>Workspaces and recents</h3>
            <p>
              Save window layouts, restore them later, and jump to recent or
              frequent links.
            </p>
          </article>
          <article className="feature-card">
            <h3>Command palette control</h3>
            <p>
              Search, edit, and launch from the keyboard with the built-in
              palette and shortcuts.
            </p>
          </article>
          <article className="feature-card">
            <h3>Precision window tools</h3>
            <p>
              Resize and move with mouse or keys, including snapping and reset
              commands.
            </p>
          </article>
        </div>
      </section>

      <section id="workflow" className="section split">
        <div>
          <h2>One flow from capture to launch</h2>
          <p>
            The client stores everything locally and keeps every action close to
            the cursor so you never lose momentum.
          </p>
          <div className="step-list">
            <div className="step">
              <div className="step-number">01</div>
              <div>
                <h3>Capture with context</h3>
                <p>
                  Add tags, folder, priority, and notes so every link carries
                  its purpose.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <div>
                <h3>Launch glass windows</h3>
                <p>
                  Open links in transparent windows that stay on top without
                  hijacking your workspace.
                </p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <div>
                <h3>Save the layout</h3>
                <p>
                  Snapshot a workspace and restore it later with the same window
                  layout.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Options and controls</div>
          <ul className="panel-list">
            <li>Adjust transparency for every open window.</li>
            <li>Always on top mode for focused research.</li>
            <li>Inject resizers into web pages when allowed.</li>
            <li>Switch between shared, per-link, or incognito sessions.</li>
            <li>Choose any links.json storage folder.</li>
          </ul>
        </div>
      </section>

      <section id="shortcuts" className="section">
        <div className="section-heading">
          <h2>Keyboard-ready from day one</h2>
          <p>These shortcuts keep your hands on the keys.</p>
        </div>
        <div className="shortcut-grid">
          <div className="shortcut-card">
            <div className="shortcut-title">Resize window</div>
            <div className="shortcut-keys">Ctrl + Alt + Arrows</div>
          </div>
          <div className="shortcut-card">
            <div className="shortcut-title">Move window</div>
            <div className="shortcut-keys">Ctrl + Alt + Shift + Arrows</div>
          </div>
          <div className="shortcut-card">
            <div className="shortcut-title">Open command palette</div>
            <div className="shortcut-keys">Ctrl + K</div>
          </div>
          <div className="shortcut-card">
            <div className="shortcut-title">Center window</div>
            <div className="shortcut-keys">Ctrl + Alt + C</div>
          </div>
        </div>
      </section>

      <section id="download" className="section cta">
        <div>
          <h2>Ready to run a calmer link workspace?</h2>
          <p>
            This transparent link client runs on Windows, macOS, and Linux.
            Export JSON or CSV and keep everything portable.
          </p>
        </div>
        <div className="cta-actions">
          <a
            className="button primary"
            href="https://github.com/Brilord/PlanaV2.0/releases"
          >
            Download latest build
          </a>
          <a
            className="button ghost"
            href="https://github.com/Brilord/PlanaV2.0#readme"
          >
            View documentation
          </a>
        </div>
      </section>

      <footer className="footer">
        <div>Transparent Link Client</div>
        <div className="footer-links">
          <span>Transparent, local-first link control.</span>
        </div>
      </footer>
    </div>
  );
}
