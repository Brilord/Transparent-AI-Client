"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import exampleOperation from "../example-operation.png";

type Lang = "en" | "ko";

type Copy = typeof copy.en;

const copy = {
  en: {
    nav: {
      logo: "Transparent Link Client",
      example: "Example",
      features: "Features",
      workflow: "Workflow",
      shortcuts: "Shortcuts",
      cta: "Get the app",
      langLabel: "Language"
    },
    hero: {
      eyebrow: "A transparent browser window for a link client",
      title:
        "Keep every tab in reach without the clutter. This is a transparent browser window for a link client that turns links into a calm workspace.",
      lead:
        "A desktop link vault with tags, folders, notes, and workspaces. Capture fast, launch windows instantly, and drive everything with keyboard shortcuts.",
      primaryAction: "Download for desktop",
      secondaryAction: "Explore features",
      metaCards: ["Local JSON storage", "Fuzzy search and tags", "Workspace snapshots"]
    },
    demo: {
      eyebrow: "Example",
      caption:
        "Example of Transparent AI Client running a link library with floating windows.",
      imageAlt:
        "Example of the Transparent AI Client workflow showing transparent windows and saved links."
    },
    floating: {
      title: "Command palette",
      body: "Search links, edit, and launch in seconds.",
      pills: ["Ctrl + K", "Fuzzy", "Tags"]
    },
    features: {
      heading: "Built for focus, not browser chaos",
      lead:
        "This client keeps your research, dashboards, and references close without hiding behind a crowded tab bar.",
      items: [
        {
          title: "Glass UI and transparency",
          body:
            "Frameless windows with adjustable opacity keep your workspace light, calm, and always readable."
        },
        {
          title: "Fast capture flows",
          body:
            "Paste URLs, pull from the clipboard, or drag and drop to capture context instantly."
        },
        {
          title: "Tags, folders, and priorities",
          body:
            "Organize by tag chips, folder groups, and priority lanes to keep projects sorted."
        },
        {
          title: "Workspaces and recents",
          body:
            "Save window layouts, restore them later, and jump to recent or frequent links."
        },
        {
          title: "Command palette control",
          body:
            "Search, edit, and launch from the keyboard with the built-in palette and shortcuts."
        },
        {
          title: "Precision window tools",
          body:
            "Resize and move with mouse or keys, including snapping and reset commands."
        }
      ]
    },
    workflow: {
      heading: "One flow from capture to launch",
      lead:
        "The client stores everything locally and keeps every action close to the cursor so you never lose momentum.",
      steps: [
        {
          number: "01",
          title: "Capture with context",
          body: "Add tags, folder, priority, and notes so every link carries its purpose."
        },
        {
          number: "02",
          title: "Launch glass windows",
          body:
            "Open links in transparent windows that stay on top without hijacking your workspace."
        },
        {
          number: "03",
          title: "Save the layout",
          body:
            "Snapshot a workspace and restore it later with the same window layout."
        }
      ],
      panel: {
        title: "Options and controls",
        items: [
          "Adjust transparency for every open window.",
          "Always on top mode for focused research.",
          "Inject resizers into web pages when allowed.",
          "Switch between shared, per-link, or incognito sessions.",
          "Choose any links.json storage folder."
        ]
      }
    },
    shortcuts: {
      heading: "Keyboard-ready from day one",
      lead: "These shortcuts keep your hands on the keys.",
      items: [
        { title: "Resize window", keys: "Ctrl + Alt + Arrows" },
        { title: "Move window", keys: "Ctrl + Alt + Shift + Arrows" },
        { title: "Open command palette", keys: "Ctrl + K" },
        { title: "Center window", keys: "Ctrl + Alt + C" }
      ]
    },
    cta: {
      heading: "Ready to run a calmer link workspace?",
      lead:
        "This transparent link client runs on Windows, macOS, and Linux. Export JSON or CSV and keep everything portable.",
      primary: "Download latest build",
      secondary: "View documentation"
    },
    footer: {
      brand: "Transparent Link Client",
      tagline: "Transparent, local-first link control."
    }
  },
  ko: {
    nav: {
      logo: "투명 링크 클라이언트",
      example: "예시",
      features: "특징",
      workflow: "워크플로",
      shortcuts: "단축키",
      cta: "앱 받기",
      langLabel: "언어"
    },
    hero: {
      eyebrow: "링크 클라이언트를 위한 투명 브라우저 창",
      title:
        "복잡한 탭 없이 모든 링크를 가까이. 투명 링크 클라이언트로 차분한 작업 공간을 만드세요.",
      lead:
        "태그, 폴더, 메모, 워크스페이스를 갖춘 데스크톱 링크 보관함. 빠르게 저장하고, 즉시 창을 열며, 키보드 단축키로 제어하세요.",
      primaryAction: "데스크톱 다운로드",
      secondaryAction: "기능 살펴보기",
      metaCards: ["로컬 JSON 저장", "퍼지 검색과 태그", "워크스페이스 스냅샷"]
    },
    demo: {
      eyebrow: "예시",
      caption: "Transparent AI Client가 떠 있는 창으로 링크 라이브러리를 운영하는 예시.",
      imageAlt:
        "Transparent AI Client 워크플로우 예시. 투명 창과 저장된 링크를 보여줍니다."
    },
    floating: {
      title: "명령 팔레트",
      body: "링크를 검색하고 편집하며 몇 초 만에 실행하세요.",
      pills: ["Ctrl + K", "퍼지", "태그"]
    },
    features: {
      heading: "브라우저 혼잡이 아닌 집중을 위해",
      lead:
        "이 클라이언트는 연구, 대시보드, 레퍼런스를 탭 바에 가리지 않고 가까이 둡니다.",
      items: [
        {
          title: "글래스 UI와 투명도",
          body:
            "프레임 없는 창과 조절 가능한 투명도로 공간을 가볍고 차분하게 유지합니다."
        },
        {
          title: "빠른 캡처 흐름",
          body:
            "URL 붙여넣기, 클립보드 가져오기, 드래그 앤 드롭으로 맥락을 즉시 저장."
        },
        {
          title: "태그, 폴더, 우선순위",
          body:
            "태그 칩, 폴더 그룹, 우선순위로 프로젝트를 정리."
        },
        {
          title: "워크스페이스와 최근 항목",
          body:
            "창 레이아웃을 저장/복원하고 최근/자주 쓰는 링크로 이동."
        },
        {
          title: "명령 팔레트 제어",
          body: "키보드로 검색, 편집, 실행."
        },
        {
          title: "정밀 창 도구",
          body:
            "마우스 또는 키로 크기/이동, 스냅과 초기화."
        }
      ]
    },
    workflow: {
      heading: "캡처에서 실행까지 하나의 흐름",
      lead:
        "클라이언트는 모든 것을 로컬에 저장하고, 모든 동작을 커서 근처에 두어 흐름을 끊지 않습니다.",
      steps: [
        {
          number: "01",
          title: "맥락을 담아 캡처",
          body: "태그, 폴더, 우선순위, 메모로 링크의 목적을 기록."
        },
        {
          number: "02",
          title: "글래스 창 실행",
          body:
            "투명 창으로 링크를 열어 항상 위에 두면서도 작업을 방해하지 않습니다."
        },
        {
          number: "03",
          title: "레이아웃 저장",
          body:
            "워크스페이스를 스냅샷하고 동일한 레이아웃으로 복원."
        }
      ],
      panel: {
        title: "옵션과 제어",
        items: [
          "열려 있는 모든 창의 투명도 조절.",
          "집중을 위한 항상 위 모드.",
          "가능한 경우 웹 페이지에 리사이저 삽입.",
          "공유/링크별/시크릿 세션 전환.",
          "links.json 저장 위치 선택."
        ]
      }
    },
    shortcuts: {
      heading: "첫날부터 키보드 중심",
      lead: "이 단축키로 손을 키보드에 두세요.",
      items: [
        { title: "창 크기 조절", keys: "Ctrl + Alt + 화살표" },
        { title: "창 이동", keys: "Ctrl + Alt + Shift + 화살표" },
        { title: "명령 팔레트 열기", keys: "Ctrl + K" },
        { title: "창 가운데 정렬", keys: "Ctrl + Alt + C" }
      ]
    },
    cta: {
      heading: "더 차분한 링크 작업 공간을 시작할 준비가 되었나요?",
      lead:
        "이 투명 링크 클라이언트는 Windows, macOS, Linux를 지원합니다. JSON 또는 CSV로 내보내 휴대성을 유지하세요.",
      primary: "최신 빌드 다운로드",
      secondary: "문서 보기"
    },
    footer: {
      brand: "Transparent Link Client",
      tagline: "투명하고 로컬-퍼스트 링크 관리."
    }
  }
} as const;

function getLangParam(value: string | null): Lang {
  return value === "ko" ? "ko" : "en";
}

export default function Home() {
  const searchParams = useSearchParams();
  const lang = getLangParam(searchParams.get("lang"));
  const t: Copy = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  return (
    <div className="page">
      <header className="hero">
        <nav className="nav">
          <div className="logo">{t.nav.logo}</div>
          <div className="nav-links">
            <a href="#demo">{t.nav.example}</a>
            <a href="#features">{t.nav.features}</a>
            <a href="#workflow">{t.nav.workflow}</a>
            <a href="#shortcuts">{t.nav.shortcuts}</a>
            <a className="nav-cta" href="#download">
              {t.nav.cta}
            </a>
            <div className="lang-switch" aria-label={t.nav.langLabel}>
              <a
                className={`lang-pill${lang === "en" ? " active" : ""}`}
                href="?lang=en"
              >
                EN
              </a>
              <a
                className={`lang-pill${lang === "ko" ? " active" : ""}`}
                href="?lang=ko"
              >
                KO
              </a>
            </div>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="lead">{t.hero.lead}</p>
            <div className="hero-actions">
              <a className="button primary" href="#download">
                {t.hero.primaryAction}
              </a>
              <a className="button ghost" href="#features">
                {t.hero.secondaryAction}
              </a>
            </div>
            <div className="hero-meta">
              {t.hero.metaCards.map((item) => (
                <div key={item} className="meta-card">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <section id="demo" className="hero-demo lift">
              <p className="eyebrow">{t.demo.eyebrow}</p>
              <div className="demo-frame">
                <Image
                  src={exampleOperation}
                  alt={t.demo.imageAlt}
                  className="demo-image"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="demo-caption">{t.demo.caption}</div>
            </section>
            <div className="floating-card drift">
              <div className="floating-title">{t.floating.title}</div>
              <p>{t.floating.body}</p>
              <div className="pill-row">
                {t.floating.pills.map((pill) => (
                  <span key={pill} className="pill">
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section">
        <div className="section-heading">
          <h2>{t.features.heading}</h2>
          <p>{t.features.lead}</p>
        </div>
        <div className="feature-grid">
          {t.features.items.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="section split">
        <div>
          <h2>{t.workflow.heading}</h2>
          <p>{t.workflow.lead}</p>
          <div className="step-list">
            {t.workflow.steps.map((step) => (
              <div key={step.number} className="step">
                <div className="step-number">{step.number}</div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">{t.workflow.panel.title}</div>
          <ul className="panel-list">
            {t.workflow.panel.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="shortcuts" className="section">
        <div className="section-heading">
          <h2>{t.shortcuts.heading}</h2>
          <p>{t.shortcuts.lead}</p>
        </div>
        <div className="shortcut-grid">
          {t.shortcuts.items.map((item) => (
            <div key={item.title} className="shortcut-card">
              <div className="shortcut-title">{item.title}</div>
              <div className="shortcut-keys">{item.keys}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="download" className="section cta">
        <div>
          <h2>{t.cta.heading}</h2>
          <p>{t.cta.lead}</p>
        </div>
        <div className="cta-actions">
          <a
            className="button primary"
            href="https://github.com/Brilord/PlanaV2.0/releases"
          >
            {t.cta.primary}
          </a>
          <a
            className="button ghost"
            href="https://github.com/Brilord/PlanaV2.0#readme"
          >
            {t.cta.secondary}
          </a>
        </div>
      </section>

      <footer className="footer">
        <div>{t.footer.brand}</div>
        <div className="footer-links">
          <span>{t.footer.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
