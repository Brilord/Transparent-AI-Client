"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import exampleOperation from "../example-operation.png";
import exampleOperation2 from "../example-operation2.png";

type Lang = "en" | "ko" | "ja";

type Copy = {
  nav: {
    logo: string;
    example: string;
    features: string;
    workflow: string;
    shortcuts: string;
    contact: string;
    cta: string;
    langLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryAction: string;
    secondaryAction: string;
    metaCards: string[];
  };
  demo: {
    eyebrow: string;
    caption: string;
    imageAlt: string;
  };
  demoTwo: {
    eyebrow: string;
    caption: string;
    imageAlt: string;
  };
  floating: {
    title: string;
    body: string;
    pills: string[];
  };
  features: {
    heading: string;
    lead: string;
    items: { title: string; body: string; }[];
  };
  workflow: {
    heading: string;
    lead: string;
    steps: { number: string; title: string; body: string; }[];
    panel: { title: string; items: string[]; };
  };
  shortcuts: {
    heading: string;
    lead: string;
    items: { title: string; keys: string; }[];
  };
  contact: {
    heading: string;
    lead: string;
    items: { title: string; body: string; href: string; }[];
  };
  cta: {
    heading: string;
    lead: string;
    primary: string;
    secondary: string;
  };
  footer: {
    brand: string;
    tagline: string;
  };
};

const enCopy: Copy = {
  nav: {
    logo: "Transparent Link Client",
    example: "Example",
    features: "Features",
    workflow: "Workflow",
    shortcuts: "Shortcuts",
    contact: "Contact",
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
  demoTwo: {
    eyebrow: "Example 2",
    caption:
      "Another example of Transparent AI Client running a multi-window workspace.",
    imageAlt:
      "Second example of the Transparent AI Client showing another window layout."
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
        title: "Transparent glass windows",
        body:
          "Opacity slider, always-on-top, and injected resizers keep your workspace calm."
      },
      {
        title: "Capture from anywhere",
        body:
          "Clipboard detection, drag-and-drop, and a quick capture form save links fast."
      },
      {
        title: "Tags, folders, notes, priorities",
        body:
          "Organize with tag chips, folder groups, notes, and priority lanes."
      },
      {
        title: "Metadata + health checks",
        body:
          "Auto-fetch titles, descriptions, favicons, and periodic link status."
      },
      {
        title: "Workspaces + layouts",
        body: "Save and restore window positions across sessions."
      },
      {
        title: "Import, export, and sync",
        body:
          "JSON/CSV import-export, custom storage paths, and folder sync."
      },
      {
        title: "Keyboard control + snapping",
        body:
          "Command palette, window shortcuts, and snap-to-edge controls."
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
        "Choose a custom storage path or sync a folder."
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
  contact: {
    heading: "Reach the developer",
    lead: "Have feedback, bugs, or partnerships? Reach out below.",
    items: [
      {
        title: "GitHub Issues",
        body: "Report bugs or request features.",
        href: "https://github.com/Brilord/PlanaV2.0/issues"
      },
      {
        title: "GitHub Discussions",
        body: "Ask questions or share workflows.",
        href: "https://github.com/Brilord/PlanaV2.0/discussions"
      }
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
};

const koCopy: Copy = {
  nav: {
    logo: "투명 링크 클라이언트",
    example: "예시",
    features: "특징",
    workflow: "워크플로",
    shortcuts: "단축키",
    contact: "연락",
    cta: "앱 받기",
    langLabel: "언어"
  },
  hero: {
    eyebrow: "링크 클라이언트를 위한 투명 브라우저 창",
    title:
      "탭을 어지럽히지 않고 모든 링크를 바로 앞에. 투명 링크 클라이언트가 차분한 작업 공간을 만듭니다.",
    lead:
      "태그, 폴더, 메모, 워크스페이스가 있는 데스크톱 링크 보관함. 빠르게 캡처하고, 즉시 창을 열고, 키보드 단축키로 조작하세요.",
    primaryAction: "데스크톱용 다운로드",
    secondaryAction: "기능 살펴보기",
    metaCards: ["로컬 JSON 저장", "퍼지 검색과 태그", "워크스페이스 스냅샷"]
  },
  demo: {
    eyebrow: "예시",
    caption:
      "Transparent AI Client가 링크 라이브러리와 떠 있는 창을 실행하는 모습입니다.",
    imageAlt:
      "투명한 창과 저장된 링크를 보여주는 Transparent AI Client 워크플로 예시."
  },
  demoTwo: {
    eyebrow: "예시 2",
    caption: "여러 창 작업 공간을 보여주는 또 다른 예시입니다.",
    imageAlt: "다른 창 배치를 보여주는 Transparent AI Client 두 번째 예시."
  },
  floating: {
    title: "명령 팔레트",
    body: "링크를 검색하고 편집하고 즉시 실행하세요.",
    pills: ["Ctrl + K", "퍼지", "태그"]
  },
  features: {
    heading: "브라우저 혼잡 대신 집중을 위해",
    lead:
      "이 클라이언트는 연구, 대시보드, 레퍼런스를 탭 막대 뒤로 숨기지 않습니다.",
    items: [
      {
        title: "투명 유리 창",
        body:
          "투명도 슬라이더, 항상 위, 리사이저 주입으로 작업 공간을 차분하게 유지합니다."
      },
      {
        title: "어디서나 캡처",
        body:
          "클립보드 감지, 드래그 앤 드롭, 빠른 캡처 폼으로 링크를 즉시 저장합니다."
      },
      {
        title: "태그, 폴더, 메모, 우선순위",
        body:
          "태그 칩, 폴더 그룹, 메모, 우선순위 레인으로 정리합니다."
      },
      {
        title: "메타데이터 + 상태 체크",
        body:
          "제목, 설명, 파비콘을 자동 수집하고 링크 상태를 주기적으로 확인합니다."
      },
      {
        title: "워크스페이스 + 레이아웃",
        body: "창 위치를 저장하고 다음에도 복원합니다."
      },
      {
        title: "가져오기, 내보내기, 동기화",
        body:
          "JSON/CSV 가져오기·내보내기, 저장 경로 선택, 폴더 동기화를 지원합니다."
      },
      {
        title: "키보드 제어 + 스냅",
        body:
          "명령 팔레트, 단축키, 화면 스냅으로 키보드 중심 제어를 제공합니다."
      }
    ]
  },
  workflow: {
    heading: "캡처부터 실행까지 하나의 흐름",
    lead:
      "모든 것을 로컬에 저장하고, 모든 동작을 커서 근처에 유지해 몰입을 끊지 않습니다.",
    steps: [
      {
        number: "01",
        title: "맥락과 함께 캡처",
        body: "태그, 폴더, 우선순위, 메모로 목적을 남기세요."
      },
      {
        number: "02",
        title: "유리 창 실행",
        body:
          "투명 창으로 열어 작업 공간을 방해하지 않게 유지합니다."
      },
      {
        number: "03",
        title: "레이아웃 저장",
        body:
          "워크스페이스를 스냅샷으로 저장하고 같은 레이아웃으로 복원합니다."
      }
    ],
    panel: {
      title: "옵션 및 제어",
      items: [
        "열려 있는 모든 창의 투명도 조절.",
        "집중을 위한 항상 위 모드.",
        "허용된 페이지에 리사이저 주입.",
        "공유, 링크별, 시크릿 세션 전환.",
        "저장 경로를 바꾸거나 폴더 동기화."
      ]
    }
  },
  shortcuts: {
    heading: "첫날부터 키보드 중심",
    lead: "손을 키보드에 두도록 돕는 단축키.",
    items: [
      { title: "창 크기 조절", keys: "Ctrl + Alt + Arrows" },
      { title: "창 이동", keys: "Ctrl + Alt + Shift + Arrows" },
      { title: "명령 팔레트 열기", keys: "Ctrl + K" },
      { title: "창 가운데 정렬", keys: "Ctrl + Alt + C" }
    ]
  },
  contact: {
    heading: "개발자에게 연락",
    lead: "피드백, 버그, 협업 제안은 아래 채널로 연락하세요.",
    items: [
      {
        title: "GitHub Issues",
        body: "버그 신고 또는 기능 요청.",
        href: "https://github.com/Brilord/PlanaV2.0/issues"
      },
      {
        title: "GitHub Discussions",
        body: "질문이나 워크플로 공유.",
        href: "https://github.com/Brilord/PlanaV2.0/discussions"
      }
    ]
  },
  cta: {
    heading: "차분한 링크 작업 공간을 시작할 준비가 됐나요?",
    lead:
      "이 투명 링크 클라이언트는 Windows, macOS, Linux에서 실행됩니다. JSON 또는 CSV로 내보내 휴대하세요.",
    primary: "최신 빌드 다운로드",
    secondary: "문서 보기"
  },
  footer: {
    brand: "Transparent Link Client",
    tagline: "투명한 로컬-퍼스트 링크 컨트롤."
  }
};

const jaCopy: Copy = {
  nav: {
    logo: "透明リンククライアント",
    example: "例",
    features: "機能",
    workflow: "ワークフロー",
    shortcuts: "ショートカット",
    contact: "連絡",
    cta: "アプリを入手",
    langLabel: "言語"
  },
  hero: {
    eyebrow: "リンククライアントのための透明ブラウザウィンドウ",
    title:
      "タブの混雑を避け、すべてのリンクを手元に。透明リンククライアントが静かな作業空間を作ります。",
    lead:
      "タグ、フォルダ、メモ、ワークスペース付きのデスクトップリンク保管庫。素早くキャプチャし、即座にウィンドウを開き、キーボードで操作できます。",
    primaryAction: "デスクトップ版をダウンロード",
    secondaryAction: "機能を見る",
    metaCards: ["ローカルJSON保存", "あいまい検索とタグ", "ワークスペーススナップショット"]
  },
  demo: {
    eyebrow: "例",
    caption:
      "Transparent AI Clientがリンクライブラリとフローティングウィンドウを動かす例です。",
    imageAlt:
      "透明ウィンドウと保存済みリンクを示すTransparent AI Clientのワークフロー例。"
  },
  demoTwo: {
    eyebrow: "例 2",
    caption: "複数ウィンドウの作業空間を示す別の例です。",
    imageAlt: "別のウィンドウ配置を示すTransparent AI Clientの2つ目の例。"
  },
  floating: {
    title: "コマンドパレット",
    body: "リンクを検索・編集し、すぐに起動できます。",
    pills: ["Ctrl + K", "あいまい検索", "タグ"]
  },
  features: {
    heading: "ブラウザの混雑より集中を",
    lead:
      "研究やダッシュボード、参考資料をタブの裏に隠しません。",
    items: [
      {
        title: "透明ガラスウィンドウ",
        body:
          "透明度スライダー、常に最前面、リサイザー注入で落ち着いた作業空間に。"
      },
      {
        title: "どこでもキャプチャ",
        body:
          "クリップボード検出、ドラッグ&ドロップ、クイック入力で素早く保存。"
      },
      {
        title: "タグ・フォルダ・メモ・優先度",
        body:
          "タグチップ、フォルダ、メモ、優先度レーンで整理。"
      },
      {
        title: "メタデータ&ヘルスチェック",
        body:
          "タイトル/説明/ファビコンを自動取得し、リンク状態を定期チェック。"
      },
      {
        title: "ワークスペース&レイアウト",
        body: "ウィンドウ配置を保存して復元。"
      },
      {
        title: "インポート/エクスポート/同期",
        body:
          "JSON/CSVの入出力、保存パス変更、フォルダ同期。"
      },
      {
        title: "キーボード操作&スナップ",
        body:
          "コマンドパレット、ショートカット、スナップ操作。"
      }
    ]
  },
  workflow: {
    heading: "キャプチャから起動までの一本の流れ",
    lead:
      "すべてをローカルに保存し、操作をカーソル近くに保つことで集中を維持します。",
    steps: [
      {
        number: "01",
        title: "文脈と一緒にキャプチャ",
        body: "タグ、フォルダ、優先度、メモで目的を残します。"
      },
      {
        number: "02",
        title: "ガラスウィンドウを起動",
        body:
          "透明ウィンドウで開き、作業空間を邪魔しません。"
      },
      {
        number: "03",
        title: "レイアウトを保存",
        body:
          "ワークスペースをスナップショットし、同じ配置で復元します。"
      }
    ],
    panel: {
      title: "オプションとコントロール",
      items: [
        "開いているすべてのウィンドウの透明度を調整。",
        "集中用の常に最前面モード。",
        "許可されたページにリサイザーを注入。",
        "共有/リンク別/シークレットセッションの切替。",
        "保存パス変更またはフォルダ同期。"
      ]
    }
  },
  shortcuts: {
    heading: "初日からキーボード中心",
    lead: "手をキーボードに置いたまま操作できます。",
    items: [
      { title: "ウィンドウサイズ調整", keys: "Ctrl + Alt + Arrows" },
      { title: "ウィンドウ移動", keys: "Ctrl + Alt + Shift + Arrows" },
      { title: "コマンドパレットを開く", keys: "Ctrl + K" },
      { title: "ウィンドウを中央に", keys: "Ctrl + Alt + C" }
    ]
  },
  contact: {
    heading: "開発者に連絡",
    lead: "フィードバック、バグ報告、相談は以下から。",
    items: [
      {
        title: "GitHub Issues",
        body: "バグ報告や機能リクエスト。",
        href: "https://github.com/Brilord/PlanaV2.0/issues"
      },
      {
        title: "GitHub Discussions",
        body: "質問やワークフローの共有。",
        href: "https://github.com/Brilord/PlanaV2.0/discussions"
      }
    ]
  },
  cta: {
    heading: "落ち着いたリンク作業空間を始めませんか？",
    lead:
      "この透明リンククライアントはWindows、macOS、Linuxで動作します。JSONまたはCSVでエクスポートして持ち運べます。",
    primary: "最新ビルドをダウンロード",
    secondary: "ドキュメントを見る"
  },
  footer: {
    brand: "Transparent Link Client",
    tagline: "透明でローカルファーストなリンク管理。"
  }
};

const copy: Record<Lang, Copy> = {
  en: enCopy,
  ko: koCopy,
  ja: jaCopy
};
function getLangParam(value: string | null): Lang {
  if (value === "ko") return "ko";
  if (value === "ja") return "ja";
  return "en";
}

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const language = (navigator.languages && navigator.languages.length)
    ? navigator.languages[0]
    : navigator.language;
  if (!language) return "en";
  const normalized = language.toLowerCase();
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("ja")) return "ja";
  return "en";
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasLangParam = searchParams.get("lang") !== null;
  const [lang, setLang] = useState<Lang>(() => getLangParam(searchParams.get("lang")));
  const t: Copy = copy[lang];

  useEffect(() => {
    if (hasLangParam) return;
    const detected = detectBrowserLang();
    if (detected !== lang) setLang(detected);
    router.replace(`?lang=${detected}`, { scroll: false });
  }, [hasLangParam, lang, router]);

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
            <a href="#contact">{t.nav.contact}</a>
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
              <a
                className={`lang-pill${lang === "ja" ? " active" : ""}`}
                href="?lang=ja"
              >
                JA
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
              <p className="eyebrow">{t.demoTwo.eyebrow}</p>
              <div className="demo-frame">
                <Image
                  src={exampleOperation2}
                  alt={t.demoTwo.imageAlt}
                  className="demo-image"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="demo-caption">{t.demoTwo.caption}</div>
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

      <section id="contact" className="section contact">
        <div className="section-heading">
          <h2>{t.contact.heading}</h2>
          <p>{t.contact.lead}</p>
        </div>
        <div className="contact-grid">
          {t.contact.items.map((item) => (
            <a
              key={item.title}
              className="contact-card"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className="contact-title">{item.title}</div>
              <p className="contact-body">{item.body}</p>
            </a>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="page" />}>
      <HomeContent />
    </Suspense>
  );
}

