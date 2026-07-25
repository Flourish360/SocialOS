"use client";
import { useEffect } from "react";

const STYLES = `
  :root {
    --bg: #0D0D14;
    --surface: #1A1A27;
    --card: #20202E;
    --border: #2C2C40;
    --accent: #7C3AED;
    --accent-dim: #4C1D95;
    --accent-light: #A78BFA;
    --accent-glow: rgba(124,58,237,0.12);
    --text: #F0EFF8;
    --muted: #8080A0;
    --subtle: #4A4A65;
    --green: #34D399;
    --green-bg: rgba(52,211,153,0.1);
    --amber: #FBBF24;
    --amber-bg: rgba(251,191,36,0.1);
    --red: #F87171;
    --red-bg: rgba(248,113,113,0.1);
    --code-bg: #080810;
    --sidebar-w: 240px;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #F6F5FB; --surface: #FFFFFF; --card: #F0EFF8; --border: #DDD9F0;
      --accent: #6D28D9; --accent-dim: #EDE9FE; --accent-light: #7C3AED;
      --accent-glow: rgba(109,40,217,0.08); --text: #1A1830; --muted: #6B6B8A;
      --subtle: #B0ADCC; --green: #059669; --green-bg: rgba(5,150,105,0.08);
      --amber: #D97706; --amber-bg: rgba(217,119,6,0.08);
      --red: #DC2626; --red-bg: rgba(220,38,38,0.08); --code-bg: #1A1830;
    }
  }
  :root[data-theme="light"] {
    --bg: #F6F5FB; --surface: #FFFFFF; --card: #F0EFF8; --border: #DDD9F0;
    --accent: #6D28D9; --accent-dim: #EDE9FE; --accent-light: #7C3AED;
    --accent-glow: rgba(109,40,217,0.08); --text: #1A1830; --muted: #6B6B8A;
    --subtle: #B0ADCC; --green: #059669; --green-bg: rgba(5,150,105,0.08);
    --amber: #D97706; --amber-bg: rgba(217,119,6,0.08);
    --red: #DC2626; --red-bg: rgba(220,38,38,0.08); --code-bg: #1A1830;
  }
  :root[data-theme="dark"] {
    --bg: #0D0D14; --surface: #1A1A27; --card: #20202E; --border: #2C2C40;
    --accent: #7C3AED; --accent-dim: #4C1D95; --accent-light: #A78BFA;
    --accent-glow: rgba(124,58,237,0.12); --text: #F0EFF8; --muted: #8080A0;
    --subtle: #4A4A65; --green: #34D399; --green-bg: rgba(52,211,153,0.1);
    --amber: #FBBF24; --amber-bg: rgba(251,191,36,0.1);
    --red: #F87171; --red-bg: rgba(248,113,113,0.1); --code-bg: #080810;
  }

  .docs-root *, .docs-root *::before, .docs-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .docs-root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
  }

  .docs-root .topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 52px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px;
    gap: 16px;
  }
  .docs-root .topbar-logo { display: flex; align-items: center; gap: 8px; }
  .docs-root .logo-mark {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .docs-root .logo-mark svg { width: 16px; height: 16px; }
  .docs-root .logo-name { font-weight: 700; font-size: 14px; letter-spacing: -0.2px; }
  .docs-root .logo-sep { color: var(--subtle); font-size: 18px; font-weight: 200; margin: 0 4px; }
  .docs-root .logo-sub { font-size: 13px; color: var(--muted); font-weight: 500; }
  .docs-root .topbar-badge {
    margin-left: auto;
    font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    background: var(--accent-glow);
    color: var(--accent-light);
    border: 1px solid var(--accent-dim);
    padding: 3px 10px; border-radius: 20px;
  }

  .docs-root .shell { display: flex; padding-top: 52px; min-height: 100vh; }

  .docs-root .sidebar {
    width: var(--sidebar-w);
    flex-shrink: 0;
    position: fixed;
    top: 52px; bottom: 0; left: 0;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    background: var(--surface);
    padding: 24px 0 40px;
  }
  .docs-root .sidebar::-webkit-scrollbar { width: 4px; }
  .docs-root .sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .docs-root .nav-group { margin-bottom: 28px; }
  .docs-root .nav-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: var(--subtle);
    padding: 0 20px 8px;
  }
  .docs-root .nav-link {
    display: block; padding: 6px 20px;
    font-size: 13px; color: var(--muted);
    text-decoration: none; border-left: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .docs-root .nav-link:hover { color: var(--text); background: var(--accent-glow); }
  .docs-root .nav-link.active { color: var(--accent-light); border-left-color: var(--accent); background: var(--accent-glow); }

  .docs-root .content {
    margin-left: var(--sidebar-w);
    flex: 1;
    max-width: 820px;
    padding: 48px 56px 80px;
  }

  .docs-root .section { margin-bottom: 64px; scroll-margin-top: 80px; }
  .docs-root .section-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--accent-light);
    margin-bottom: 8px;
  }
  .docs-root h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 12px; }
  .docs-root h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.3; margin-bottom: 12px; }
  .docs-root h3 { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  .docs-root p { color: var(--muted); line-height: 1.7; margin-bottom: 16px; max-width: 64ch; }
  .docs-root p strong { color: var(--text); font-weight: 600; }
  .docs-root .divider { border: none; border-top: 1px solid var(--border); margin: 48px 0; }

  .docs-root .endpoint-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .docs-root .method {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    padding: 3px 9px; border-radius: 6px;
  }
  .docs-root .method-post { background: var(--accent-glow); color: var(--accent-light); border: 1px solid var(--accent-dim); }
  .docs-root .method-get  { background: var(--green-bg); color: var(--green); border: 1px solid rgba(52,211,153,0.25); }
  .docs-root .method-del  { background: var(--red-bg); color: var(--red); border: 1px solid rgba(248,113,113,0.25); }
  .docs-root .endpoint-path {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 14px; color: var(--text); font-weight: 500;
  }

  .docs-root .code-block {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin: 16px 0;
    overflow: hidden;
  }
  .docs-root .code-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--surface); }
  .docs-root .code-tab {
    padding: 8px 16px;
    font-size: 12px; font-weight: 600;
    color: var(--muted); cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    user-select: none;
    background: none; border-top: none; border-left: none; border-right: none;
  }
  .docs-root .code-tab.active { color: var(--accent-light); border-bottom-color: var(--accent); }
  .docs-root .code-tab:hover:not(.active) { color: var(--text); }
  .docs-root .code-pane { display: none; }
  .docs-root .code-pane.active { display: block; }
  .docs-root pre {
    padding: 20px;
    overflow-x: auto;
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 12.5px;
    line-height: 1.65;
    color: #C9C7E8;
  }
  .docs-root .code-block pre { margin: 0; border-radius: 0; background: transparent; border: none; }

  .docs-root .kw  { color: #C792EA; }
  .docs-root .str { color: #C3E88D; }
  .docs-root .num { color: #F78C6C; }
  .docs-root .fn  { color: #82AAFF; }
  .docs-root .cm  { color: #546E7A; font-style: italic; }
  .docs-root .key { color: #A78BFA; }
  .docs-root .val { color: #C3E88D; }

  .docs-root code {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 4px;
    color: var(--accent-light);
  }

  .docs-root .param-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .docs-root .param-table th {
    text-align: left; padding: 8px 12px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; color: var(--subtle);
    border-bottom: 1px solid var(--border);
  }
  .docs-root .param-table td {
    padding: 10px 12px;
    vertical-align: top;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .docs-root .param-table tr:last-child td { border-bottom: none; }
  .docs-root .param-name {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 12px; color: var(--accent-light); font-weight: 600;
  }
  .docs-root .param-type {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 11px; color: var(--muted);
  }
  .docs-root .param-req {
    font-size: 10px; font-weight: 700; padding: 2px 6px;
    border-radius: 4px; letter-spacing: 0.3px;
    background: var(--accent-glow); color: var(--accent-light);
    border: 1px solid var(--accent-dim);
  }
  .docs-root .param-opt {
    font-size: 10px; font-weight: 600; padding: 2px 6px;
    border-radius: 4px; color: var(--subtle); border: 1px solid var(--border);
  }
  .docs-root .param-desc { color: var(--muted); font-size: 13px; }

  .docs-root .callout {
    border-radius: 8px; padding: 14px 16px; margin: 16px 0;
    display: flex; gap: 12px; font-size: 13px; line-height: 1.6;
  }
  .docs-root .callout-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .docs-root .callout-body { color: var(--muted); }
  .docs-root .callout-body strong { color: var(--text); font-weight: 600; }
  .docs-root .callout-warning { background: var(--amber-bg); border: 1px solid rgba(251,191,36,0.2); }
  .docs-root .callout-info    { background: var(--accent-glow); border: 1px solid var(--accent-dim); }
  .docs-root .callout-success { background: var(--green-bg); border: 1px solid rgba(52,211,153,0.2); }

  .docs-root .template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0; }
  .docs-root .template-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px;
  }
  .docs-root .template-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .docs-root .template-trigger {
    font-size: 11px; color: var(--muted);
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    margin-bottom: 6px;
  }
  .docs-root .template-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

  .docs-root .error-row td:first-child {
    font-family: "SF Mono", "Fira Code", ui-monospace, monospace;
    font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums;
  }

  .docs-root .steps { list-style: none; margin: 16px 0; }
  .docs-root .steps li {
    display: flex; gap: 14px; padding: 12px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px; color: var(--muted);
  }
  .docs-root .steps li:last-child { border-bottom: none; }
  .docs-root .step-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent-glow); border: 1px solid var(--accent-dim);
    color: var(--accent-light); font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }
  .docs-root .steps li strong { color: var(--text); }

  @media (max-width: 768px) {
    .docs-root .sidebar { display: none; }
    .docs-root .content { margin-left: 0; padding: 32px 24px 60px; }
    .docs-root .template-grid { grid-template-columns: 1fr; }
  }
`;

const BODY_HTML = `
<div class="topbar">
  <div class="topbar-logo">
    <div class="logo-mark">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="2.5" fill="white"/>
        <line x1="10" y1="2" x2="10" y2="6.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="10" y1="13.5" x2="10" y2="18" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="10" x2="6.5" y2="10" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="13.5" y1="10" x2="18" y2="10" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <span class="logo-name">SocialOS</span>
    <span class="logo-sep">/</span>
    <span class="logo-sub">E-commerce API</span>
  </div>
  <div class="topbar-badge">v1.0</div>
</div>

<div class="shell">
  <nav class="sidebar" aria-label="Documentation navigation">
    <div class="nav-group">
      <div class="nav-label">Getting Started</div>
      <a href="#overview" class="nav-link active">Overview</a>
      <a href="#quickstart" class="nav-link">Quick Start</a>
      <a href="#authentication" class="nav-link">Authentication</a>
    </div>
    <div class="nav-group">
      <div class="nav-label">Endpoints</div>
      <a href="#product" class="nav-link">POST /product</a>
      <a href="#sale" class="nav-link">POST /sale</a>
      <a href="#keys" class="nav-link">Key Management</a>
    </div>
    <div class="nav-group">
      <div class="nav-label">Reference</div>
      <a href="#templates" class="nav-link">Sale Templates</a>
      <a href="#platforms" class="nav-link">Platform Captions</a>
      <a href="#errors" class="nav-link">Error Codes</a>
    </div>
    <div class="nav-group">
      <div class="nav-label">Guides</div>
      <a href="#nodejs" class="nav-link">Node.js Guide</a>
      <a href="#python" class="nav-link">Python Guide</a>
      <a href="#best-practices" class="nav-link">Best Practices</a>
    </div>
  </nav>

  <main class="content">

    <section class="section" id="overview">
      <div class="section-eyebrow">Introduction</div>
      <h1>E-commerce API</h1>
      <p>Connect any store to SocialOS and automatically post products and sales across all your social media accounts. When a product is listed or an item sells, SocialOS generates platform-native captions using AI and publishes instantly.</p>
      <p>Two endpoints. One API key. Works with any stack.</p>
      <div class="callout callout-info">
        <div class="callout-icon">&#128161;</div>
        <div class="callout-body"><strong>Base URL:</strong> All endpoints are relative to <code>https://social-os-frontend-smoky.vercel.app</code>. Set this as <code>SOCIALOS_BASE_URL</code> in your store environment.</div>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="quickstart">
      <h2>Quick Start</h2>
      <p>You can be posting from your store in under 5 minutes.</p>
      <ol class="steps">
        <li><span class="step-num">1</span><div><strong>Connect your social accounts</strong> in SocialOS Settings. Instagram, TikTok, Twitter, LinkedIn, and Facebook are supported.</div></li>
        <li><span class="step-num">2</span><div><strong>Generate an API key</strong> at SocialOS Store Feed, then API Keys. Copy it immediately. It is shown once only.</div></li>
        <li><span class="step-num">3</span><div><strong>Add two environment variables</strong> to your store: <code>SOCIALOS_BASE_URL</code> set to <code>https://social-os-frontend-smoky.vercel.app</code> and <code>SOCIALOS_API_KEY</code> set to your key.</div></li>
        <li><span class="step-num">4</span><div><strong>Call the product endpoint</strong> when you publish a new item, and the sale endpoint when an order is confirmed.</div></li>
      </ol>
    </section>

    <hr class="divider">

    <section class="section" id="authentication">
      <h2>Authentication</h2>
      <p>Pass your API key in the <code>X-Api-Key</code> request header. No OAuth, no login flows. Just a single header on every request.</p>
      <div class="code-block">
        <pre><span class="cm"># Every request requires this header</span>
X-Api-Key: sk_live_your_key_here</pre>
      </div>
      <div class="callout callout-warning">
        <div class="callout-icon">&#9888;</div>
        <div class="callout-body"><strong>Keep your key secret.</strong> Never expose it in client-side JavaScript, commit it to git, or log it. Store it as an environment variable on your server only.</div>
      </div>
      <p>Keys are hashed with HMAC-SHA256 before storage. The plain key never touches your database or ours after the moment of creation.</p>
    </section>

    <hr class="divider">

    <section class="section" id="product">
      <div class="endpoint-header">
        <span class="method method-post">POST</span>
        <span class="endpoint-path">/api/ecommerce/product</span>
      </div>
      <h2>Announce a New Product</h2>
      <p>Call this when a product goes live on your store. SocialOS generates a platform-native caption for each connected social account and creates a post immediately or queues it.</p>

      <h3>Request body</h3>
      <div style="overflow-x:auto">
        <table class="param-table">
          <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td class="param-name">name</td><td class="param-type">string</td><td><span class="param-req">Required</span></td><td class="param-desc">Product name exactly as it appears in your store.</td></tr>
            <tr><td class="param-name">price</td><td class="param-type">float</td><td><span class="param-req">Required</span></td><td class="param-desc">Numeric price. Do not include currency symbols.</td></tr>
            <tr><td class="param-name">currency</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">ISO 4217 currency code. Defaults to <code>"USD"</code>.</td></tr>
            <tr><td class="param-name">description</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Product description. Included in AI caption context.</td></tr>
            <tr><td class="param-name">images</td><td class="param-type">string[]</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Array of publicly accessible image URLs. Must not require authentication or signed URLs.</td></tr>
            <tr><td class="param-name">url</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Canonical product URL on your store.</td></tr>
            <tr><td class="param-name">attributes</td><td class="param-type">object</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Key-value pairs: color, sizes, material, SKU, etc. Used to enrich AI captions.</td></tr>
            <tr><td class="param-name">platforms</td><td class="param-type">string[]</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Limit to specific platforms: <code>instagram</code>, <code>tiktok</code>, <code>twitter</code>, <code>linkedin</code>, <code>facebook</code>. Omit to post to all connected accounts.</td></tr>
            <tr><td class="param-name">action</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc"><code>"post_now"</code> publishes immediately. <code>"queue"</code> adds to the scheduling queue. Defaults to <code>"queue"</code>.</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Example request</h3>
      <div class="code-block">
        <pre>{
  <span class="key">"name"</span>: <span class="str">"Air Max 90"</span>,
  <span class="key">"price"</span>: <span class="num">129.99</span>,
  <span class="key">"currency"</span>: <span class="str">"USD"</span>,
  <span class="key">"description"</span>: <span class="str">"Classic running shoe with cushioned sole"</span>,
  <span class="key">"images"</span>: [<span class="str">"https://mystore.com/img/airmax.jpg"</span>],
  <span class="key">"url"</span>: <span class="str">"https://mystore.com/products/air-max-90"</span>,
  <span class="key">"attributes"</span>: {
    <span class="key">"color"</span>: <span class="str">"White/Black"</span>,
    <span class="key">"sizes"</span>: [<span class="str">"7"</span>, <span class="str">"8"</span>, <span class="str">"9"</span>, <span class="str">"10"</span>]
  },
  <span class="key">"action"</span>: <span class="str">"post_now"</span>
}</pre>
      </div>

      <h3>Response</h3>
      <div class="code-block">
        <pre>{
  <span class="key">"job_id"</span>: <span class="str">"api-key-uuid"</span>,
  <span class="key">"store"</span>: <span class="str">"My Fashion Store"</span>,
  <span class="key">"posts_created"</span>: <span class="num">3</span>,
  <span class="key">"action"</span>: <span class="str">"post_now"</span>,
  <span class="key">"results"</span>: [
    {
      <span class="key">"platform"</span>: <span class="str">"instagram"</span>,
      <span class="key">"post_id"</span>: <span class="str">"uuid"</span>,
      <span class="key">"status"</span>: <span class="str">"published"</span>,
      <span class="key">"caption_preview"</span>: <span class="str">"New drop: Air Max 90..."</span>
    }
  ]
}</pre>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="sale">
      <div class="endpoint-header">
        <span class="method method-post">POST</span>
        <span class="endpoint-path">/api/ecommerce/sale</span>
      </div>
      <h2>Announce a Sale</h2>
      <p>Call this when an order is confirmed, not at payment initiation. SocialOS automatically picks the right caption template based on stock, buyer location, and whether the item is one-of-a-kind.</p>

      <div class="callout callout-info">
        <div class="callout-icon">&#128161;</div>
        <div class="callout-body"><strong>Timing matters.</strong> Call this only after <code>order.status === "confirmed"</code>. Posting on a payment that later fails creates a false sold-out signal.</div>
      </div>

      <h3>Request body</h3>
      <div style="overflow-x:auto">
        <table class="param-table">
          <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td class="param-name">order_id</td><td class="param-type">string</td><td><span class="param-req">Required</span></td><td class="param-desc">Your order's unique ID (e.g. <code>"ord_abc123"</code>). Used to deduplicate: the same order will never post twice, even if your webhook fires more than once.</td></tr>
            <tr><td class="param-name">order_status</td><td class="param-type">string</td><td><span class="param-req">Required</span></td><td class="param-desc">Must be exactly <code>"confirmed"</code>. Any other value is rejected with a 422. Never call this endpoint before the order is confirmed.</td></tr>
            <tr><td class="param-name">product_name</td><td class="param-type">string</td><td><span class="param-req">Required</span></td><td class="param-desc">Name of the product that sold.</td></tr>
            <tr><td class="param-name">price</td><td class="param-type">float</td><td><span class="param-req">Required</span></td><td class="param-desc">Sale price of the item.</td></tr>
            <tr><td class="param-name">currency</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">ISO 4217 currency code. Defaults to <code>"USD"</code>.</td></tr>
            <tr><td class="param-name">image</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Single public image URL for the sold product.</td></tr>
            <tr><td class="param-name">quantity_sold</td><td class="param-type">int</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Number of units in this order. Used for milestone detection. Defaults to <code>1</code>.</td></tr>
            <tr><td class="param-name">units_remaining</td><td class="param-type">int</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Stock remaining after this sale. Triggers scarcity template at 5 or fewer, sold-out template at 0.</td></tr>
            <tr><td class="param-name">is_unique</td><td class="param-type">bool</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Set <code>true</code> for handmade, vintage, or one-of-a-kind items. No restock messaging. Defaults to <code>false</code>.</td></tr>
            <tr><td class="param-name">buyer_location</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">City or region of the buyer (e.g. <code>"Lagos, Nigeria"</code>). Enables social proof template.</td></tr>
            <tr><td class="param-name">platforms</td><td class="param-type">string[]</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Limit platforms. Omit to post to all.</td></tr>
            <tr><td class="param-name">action</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc"><code>"post_now"</code> or <code>"queue"</code>. Defaults to <code>"post_now"</code>.</td></tr>
            <tr><td class="param-name">template</td><td class="param-type">string</td><td><span class="param-opt">Optional</span></td><td class="param-desc">Override auto-selection. One of: <code>scarcity</code>, <code>social_proof</code>, <code>hype</code>, <code>milestone</code>, <code>sold_out</code>, <code>unique_item</code>, <code>fomo</code>.</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Example request</h3>
      <div class="code-block">
        <pre>{
  <span class="key">"order_id"</span>: <span class="str">"ord_abc123"</span>,
  <span class="key">"order_status"</span>: <span class="str">"confirmed"</span>,
  <span class="key">"product_name"</span>: <span class="str">"Air Max 90 White/Black Size 9"</span>,
  <span class="key">"price"</span>: <span class="num">129.99</span>,
  <span class="key">"image"</span>: <span class="str">"https://mystore.com/img/airmax.jpg"</span>,
  <span class="key">"quantity_sold"</span>: <span class="num">1</span>,
  <span class="key">"units_remaining"</span>: <span class="num">3</span>,
  <span class="key">"buyer_location"</span>: <span class="str">"New York, US"</span>,
  <span class="key">"action"</span>: <span class="str">"post_now"</span>
}

<span class="cm">// Auto-selects "scarcity" template (units_remaining = 3)</span>
<span class="cm">// Duplicate calls with the same order_id return 409 and are ignored safely.</span></pre>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="keys">
      <h2>Key Management</h2>
      <p>API keys are managed from the SocialOS dashboard at Store Feed, then API Keys. The endpoints below are also available for programmatic access (uses your JWT, not an API key).</p>
      <div style="overflow-x:auto">
        <table class="param-table">
          <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
          <tbody>
            <tr>
              <td><span class="method method-get">GET</span></td>
              <td class="param-name">/api/ecommerce/keys</td>
              <td class="param-desc">List all active keys. Never returns the full key, only the prefix.</td>
            </tr>
            <tr>
              <td><span class="method method-post">POST</span></td>
              <td class="param-name">/api/ecommerce/keys</td>
              <td class="param-desc">Create a new key. Returns the full key once. Body: <code>{"name": "Store name"}</code>.</td>
            </tr>
            <tr>
              <td><span class="method method-del">DELETE</span></td>
              <td class="param-name">/api/ecommerce/keys/{id}</td>
              <td class="param-desc">Revoke a key immediately. Any website using it stops working at once.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="templates">
      <h2>Sale Templates</h2>
      <p>SocialOS picks the caption template automatically based on the data you send. You can also override it manually with the <code>template</code> field.</p>
      <div class="callout callout-info">
        <div class="callout-icon">&#127919;</div>
        <div class="callout-body"><strong>Auto-selection priority:</strong> manual override, then unique_item, then sold_out, then scarcity, then social_proof, then milestone, then hype.</div>
      </div>
      <div class="template-grid">
        <div class="template-card">
          <div class="template-name">scarcity</div>
          <div class="template-trigger">units_remaining &lt;= 5</div>
          <div class="template-desc">Creates urgency around low stock. Leads with "Only X left!"</div>
        </div>
        <div class="template-card">
          <div class="template-name">social_proof</div>
          <div class="template-trigger">buyer_location is provided</div>
          <div class="template-desc">Highlights a real purchase. "Just shipped to Lagos!"</div>
        </div>
        <div class="template-card">
          <div class="template-name">unique_item</div>
          <div class="template-trigger">is_unique: true</div>
          <div class="template-desc">For handmade, vintage, or one-of-a-kind items. No restock language.</div>
        </div>
        <div class="template-card">
          <div class="template-name">sold_out</div>
          <div class="template-trigger">units_remaining = 0</div>
          <div class="template-desc">Announces full sell-out. Drives follow for restock signals.</div>
        </div>
        <div class="template-card">
          <div class="template-name">milestone</div>
          <div class="template-trigger">quantity_sold % 10 = 0</div>
          <div class="template-desc">Celebrates every 10th sale with a gratitude-forward post.</div>
        </div>
        <div class="template-card">
          <div class="template-name">hype</div>
          <div class="template-trigger">Default fallback</div>
          <div class="template-desc">High-energy celebration for any sale. Works for everything.</div>
        </div>
        <div class="template-card">
          <div class="template-name">fomo</div>
          <div class="template-trigger">template: "fomo" override</div>
          <div class="template-desc">Targets hesitant shoppers. "Still thinking about it?"</div>
        </div>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="platforms">
      <h2>Platform Captions</h2>
      <p>Every caption is generated separately per platform with rules specific to that platform's audience and format.</p>
      <div style="overflow-x:auto">
        <table class="param-table">
          <thead><tr><th>Platform</th><th>Tone</th><th>Hashtags</th><th>Limit</th></tr></thead>
          <tbody>
            <tr><td class="param-name">instagram</td><td class="param-desc">Engaging, emoji-forward</td><td>5 to 8</td><td>2,200 chars</td></tr>
            <tr><td class="param-name">tiktok</td><td class="param-desc">Punchy hook, CTA-driven</td><td>2 to 3</td><td>150 chars</td></tr>
            <tr><td class="param-name">twitter</td><td class="param-desc">Concise, 1 emoji max</td><td>None</td><td>240 chars</td></tr>
            <tr><td class="param-name">linkedin</td><td class="param-desc">Professional, no hashtags</td><td>None</td><td>2 to 3 sentences</td></tr>
            <tr><td class="param-name">facebook</td><td class="param-desc">Casual, friendly CTA</td><td>None</td><td>180 chars</td></tr>
          </tbody>
        </table>
      </div>
      <div class="callout callout-success">
        <div class="callout-icon">&#10003;</div>
        <div class="callout-body">Em dashes are banned from all AI-generated captions. Captions use commas, colons, and periods instead for a cleaner social-native tone.</div>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="errors">
      <h2>Error Codes</h2>
      <div style="overflow-x:auto">
        <table class="param-table error-row">
          <thead><tr><th>Code</th><th>Meaning</th><th>How to fix</th></tr></thead>
          <tbody>
            <tr><td>401</td><td class="param-desc">Missing or invalid API key</td><td class="param-desc">Check the <code>X-Api-Key</code> header. Make sure the key hasn't been revoked.</td></tr>
            <tr><td>409</td><td class="param-desc">Duplicate order</td><td class="param-desc">This <code>order_id</code> was already posted. Safe to ignore — deduplication is automatic.</td></tr>
            <tr><td>422</td><td class="param-desc">No connected social accounts</td><td class="param-desc">Connect at least one platform in SocialOS Settings, or remove the <code>platforms</code> filter.</td></tr>
            <tr><td>422</td><td class="param-desc">Validation error</td><td class="param-desc">Check the <code>detail</code> field in the response for the specific field that failed.</td></tr>
            <tr><td>429</td><td class="param-desc">Rate limit exceeded</td><td class="param-desc">Slow down requests. Default limit is 200 requests per minute per IP.</td></tr>
            <tr><td>500</td><td class="param-desc">Server error</td><td class="param-desc">Retry once. If it persists, check Railway logs or contact support.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="nodejs">
      <h2>Node.js Guide</h2>
      <p>Works with Express, Next.js API routes, or any Node.js backend.</p>
      <div class="code-block">
        <div class="code-tabs">
          <button class="code-tab active" onclick="window._docsTab(this,'node-setup')">Setup</button>
          <button class="code-tab" onclick="window._docsTab(this,'node-product')">Product</button>
          <button class="code-tab" onclick="window._docsTab(this,'node-sale')">Sale</button>
        </div>
        <div class="code-pane active" id="node-setup">
          <pre><span class="cm">// utils/socialos.js</span>
<span class="kw">const</span> SOCIALOS_URL = <span class="str">"https://social-os-frontend-smoky.vercel.app"</span>;
<span class="kw">const</span> SOCIALOS_KEY = process.env.<span class="val">SOCIALOS_API_KEY</span>;

<span class="kw">async function</span> <span class="fn">socialosPost</span>(path, body) {
  <span class="kw">const</span> res = <span class="kw">await</span> <span class="fn">fetch</span>(\`\${SOCIALOS_URL}\${path}\`, {
    method: <span class="str">"POST"</span>,
    headers: {
      <span class="str">"Content-Type"</span>: <span class="str">"application/json"</span>,
      <span class="str">"X-Api-Key"</span>: SOCIALOS_KEY,
    },
    body: <span class="fn">JSON.stringify</span>(body),
  });
  <span class="kw">if</span> (!res.ok) <span class="kw">throw new</span> <span class="fn">Error</span>(<span class="kw">await</span> res.<span class="fn">text</span>());
  <span class="kw">return</span> res.<span class="fn">json</span>();
}

module.exports = { socialosPost };</pre>
        </div>
        <div class="code-pane" id="node-product">
          <pre><span class="kw">const</span> { socialosPost } = <span class="fn">require</span>(<span class="str">"./utils/socialos"</span>);

<span class="cm">// Call when a product goes live</span>
<span class="kw">async function</span> <span class="fn">announceProduct</span>(product) {
  <span class="kw">return</span> <span class="fn">socialosPost</span>(<span class="str">"/api/ecommerce/product"</span>, {
    name:        product.title,
    price:       product.price,
    currency:    <span class="str">"USD"</span>,
    description: product.description,
    images:      product.images.map(i =&gt; i.url),
    url:         \`https://mystore.com/products/\${product.slug}\`,
    attributes:  { color: product.color, sizes: product.sizes },
    action:      <span class="str">"post_now"</span>,
  });
}

<span class="cm">// Example: in your product publish webhook</span>
app.<span class="fn">post</span>(<span class="str">"/webhooks/product-published"</span>, <span class="kw">async</span> (req, res) =&gt; {
  <span class="kw">await</span> <span class="fn">announceProduct</span>(req.body.product);
  res.<span class="fn">sendStatus</span>(<span class="num">200</span>);
});</pre>
        </div>
        <div class="code-pane" id="node-sale">
          <pre><span class="cm">// Call on order confirmed, not payment initiated</span>
<span class="kw">async function</span> <span class="fn">announceSale</span>(order, item) {
  <span class="kw">return</span> <span class="fn">socialosPost</span>(<span class="str">"/api/ecommerce/sale"</span>, {
    order_id:        order.id,
    order_status:    <span class="str">"confirmed"</span>,
    product_name:    item.name,
    price:           item.price,
    image:           item.image,
    quantity_sold:   item.quantity,
    units_remaining: item.stock_after,
    is_unique:       item.is_one_of_a_kind,
    buyer_location:  order.shipping_city,
    action:          <span class="str">"post_now"</span>,
  });
}

app.<span class="fn">post</span>(<span class="str">"/webhooks/order-confirmed"</span>, <span class="kw">async</span> (req, res) =&gt; {
  <span class="kw">const</span> { order } = req.body;
  <span class="kw">for</span> (<span class="kw">const</span> item <span class="kw">of</span> order.items) {
    <span class="kw">await</span> <span class="fn">announceSale</span>(order, item);
  }
  res.<span class="fn">sendStatus</span>(<span class="num">200</span>);
});</pre>
        </div>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="python">
      <h2>Python Guide</h2>
      <p>Works with Django, Flask, FastAPI, or any Python backend.</p>
      <div class="code-block">
        <div class="code-tabs">
          <button class="code-tab active" onclick="window._docsTab(this,'py-setup')">Setup</button>
          <button class="code-tab" onclick="window._docsTab(this,'py-product')">Product</button>
          <button class="code-tab" onclick="window._docsTab(this,'py-sale')">Sale</button>
        </div>
        <div class="code-pane active" id="py-setup">
          <pre><span class="cm"># utils/socialos.py</span>
<span class="kw">import</span> os, httpx

SOCIALOS_URL = <span class="str">"https://social-os-frontend-smoky.vercel.app"</span>
HEADERS = {
    <span class="str">"X-Api-Key"</span>: os.environ[<span class="str">"SOCIALOS_API_KEY"</span>],
    <span class="str">"Content-Type"</span>: <span class="str">"application/json"</span>,
}

<span class="kw">def</span> <span class="fn">socialos_post</span>(path: <span class="fn">str</span>, body: <span class="fn">dict</span>) -&gt; <span class="fn">dict</span>:
    r = httpx.<span class="fn">post</span>(
        f"{SOCIALOS_URL}{path}",
        headers=HEADERS,
        json=body,
        timeout=<span class="num">30</span>,
    )
    r.<span class="fn">raise_for_status</span>()
    <span class="kw">return</span> r.<span class="fn">json</span>()</pre>
        </div>
        <div class="code-pane" id="py-product">
          <pre><span class="kw">from</span> .socialos <span class="kw">import</span> socialos_post

<span class="kw">def</span> <span class="fn">announce_product</span>(product):
    <span class="kw">return</span> <span class="fn">socialos_post</span>(<span class="str">"/api/ecommerce/product"</span>, {
        <span class="str">"name"</span>:        product.title,
        <span class="str">"price"</span>:       <span class="fn">float</span>(product.price),
        <span class="str">"currency"</span>:    <span class="str">"USD"</span>,
        <span class="str">"description"</span>: product.description,
        <span class="str">"images"</span>:      [img.url <span class="kw">for</span> img <span class="kw">in</span> product.images.<span class="fn">all</span>()],
        <span class="str">"url"</span>:         product.<span class="fn">get_absolute_url</span>(),
        <span class="str">"attributes"</span>:  {<span class="str">"color"</span>: product.color},
        <span class="str">"action"</span>:      <span class="str">"post_now"</span>,
    })

<span class="cm"># Django signal example</span>
<span class="kw">from</span> django.db.models.signals <span class="kw">import</span> post_save
<span class="kw">from</span> django.dispatch <span class="kw">import</span> receiver

@receiver(post_save, sender=Product)
<span class="kw">def</span> <span class="fn">on_product_published</span>(sender, instance, created, **kwargs):
    <span class="kw">if</span> created <span class="kw">and</span> instance.is_published:
        <span class="fn">announce_product</span>(instance)</pre>
        </div>
        <div class="code-pane" id="py-sale">
          <pre><span class="kw">def</span> <span class="fn">announce_sale</span>(order, order_item):
    <span class="kw">return</span> <span class="fn">socialos_post</span>(<span class="str">"/api/ecommerce/sale"</span>, {
        <span class="str">"order_id"</span>:        order.id,
        <span class="str">"order_status"</span>:    <span class="str">"confirmed"</span>,
        <span class="str">"product_name"</span>:    order_item.product.title,
        <span class="str">"price"</span>:           <span class="fn">float</span>(order_item.price),
        <span class="str">"image"</span>:           order_item.product.main_image.url,
        <span class="str">"quantity_sold"</span>:   order_item.quantity,
        <span class="str">"units_remaining"</span>: order_item.product.stock,
        <span class="str">"is_unique"</span>:       order_item.product.is_unique,
        <span class="str">"buyer_location"</span>:  order_item.order.shipping_city,
        <span class="str">"action"</span>:          <span class="str">"post_now"</span>,
    })

<span class="cm"># Call when order transitions to confirmed status</span>
<span class="kw">def</span> <span class="fn">on_order_confirmed</span>(order):
    <span class="kw">for</span> item <span class="kw">in</span> order.items.<span class="fn">all</span>():
        <span class="fn">announce_sale</span>(order, item)</pre>
        </div>
      </div>
    </section>

    <hr class="divider">

    <section class="section" id="best-practices">
      <h2>Best Practices</h2>

      <h3>Image URLs</h3>
      <p>Images must be <strong>publicly accessible</strong> at the time social platforms process the post. Signed URLs with short expiry, auth-protected CDN paths, and localhost URLs will fail silently. Shopify and WooCommerce product images are public by default.</p>

      <h3>One call per line item</h3>
      <p>If an order contains 3 different products, call <code>/api/ecommerce/sale</code> once per line item, not once per order. Each product gets its own post with the correct stock count and attributes.</p>

      <h3>Retry on 5xx only</h3>
      <p>Retry failed requests only on <code>500</code> or <code>503</code> responses, and only once, with a 2-second delay. Do not retry <code>401</code>, <code>422</code>, or <code>429</code> errors without fixing the underlying cause first.</p>

      <h3>API key rotation</h3>
      <p>If a key is ever exposed, revoke it immediately from Store Feed, then API Keys, and generate a new one. Update your environment variable, then redeploy. Keys are bound to the <code>API_KEY_SECRET</code> on the server. Changing that secret invalidates all keys at once.</p>

      <div class="callout callout-warning">
        <div class="callout-icon">&#9888;</div>
        <div class="callout-body"><strong>Never post on payment initiation.</strong> Always wait for order confirmation. A failed payment followed by a "just sold!" post damages trust and creates false scarcity signals.</div>
      </div>
    </section>

  </main>
</div>
`;

export default function EcommerceDocs() {
  useEffect(() => {
    (window as any)._docsTab = function (btn: Element, paneId: string) {
      const block = btn.closest(".code-block");
      if (!block) return;
      block.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"));
      block.querySelectorAll(".code-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const pane = document.getElementById(paneId);
      if (pane) pane.classList.add("active");
    };

    const sections = document.querySelectorAll(".docs-root .section");
    const navLinks = document.querySelectorAll(".docs-root .nav-link");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            const link = document.querySelector(
              `.docs-root .nav-link[href="#${entry.target.id}"]`
            );
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((s) => observer.observe(s));

    return () => {
      observer.disconnect();
      delete (window as any)._docsTab;
    };
  }, []);

  return (
    <div className="docs-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
    </div>
  );
}
