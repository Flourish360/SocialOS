import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "E-commerce API Docs | SocialOS",
  description: "Connect your store to SocialOS and auto-post products and sales to all your social platforms.",
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}

function Method({ type }: { type: "POST" | "GET" | "DELETE" }) {
  const colors = {
    POST:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    GET:    "bg-sky-500/20 text-sky-300 border-sky-500/30",
    DELETE: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${colors[type]}`}>
      {type}
    </span>
  );
}

function Badge({ req }: { req: boolean }) {
  return req
    ? <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Required</span>
    : <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">Optional</span>;
}

function Callout({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
      <span className="text-lg shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="space-y-5">{children}</section>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-slate-100 border-b border-slate-800 pb-3">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{children}</h3>;
}

function ParamTable({ rows }: {
  rows: { name: string; type: string; req: boolean; desc: React.ReactNode }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80 text-left">
            <th className="px-4 py-3 text-slate-400 font-semibold w-40">Field</th>
            <th className="px-4 py-3 text-slate-400 font-semibold w-24">Type</th>
            <th className="px-4 py-3 text-slate-400 font-semibold w-24">Required</th>
            <th className="px-4 py-3 text-slate-400 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => (
            <tr key={r.name} className="bg-slate-900/40 hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3 font-mono text-violet-300 text-xs">{r.name}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{r.type}</td>
              <td className="px-4 py-3"><Badge req={r.req} /></td>
              <td className="px-4 py-3 text-slate-400 text-xs leading-relaxed">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
      <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

export default function EcommerceDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
          <span className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center text-white text-xs font-bold">S</span>
          SocialOS
        </Link>
        <span className="text-xs text-slate-500 font-mono">E-commerce API</span>
        <Link href="/store" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Store Feed
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-14">

        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full">
            E-commerce API
          </div>
          <h1 className="text-4xl font-bold text-white">Connect your store</h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Send product listings and sale events to SocialOS. We generate AI captions per platform and post to all your connected accounts automatically.
          </p>
        </div>

        {/* Quick start */}
        <Section id="quickstart">
          <H2>Quick start</H2>
          <ol className="space-y-4">
            {[
              { step: "1", title: "Generate an API key", body: <>Go to <Link href="/store" className="text-violet-400 hover:underline">Store Feed &gt; API Keys</Link> and generate a key. Copy it immediately. It is shown once only.</> },
              { step: "2", title: "Add to your environment", body: <><Code>SOCIALOS_API_KEY=sk_live_...</Code> in your store&apos;s environment variables.</> },
              { step: "3", title: "Call the endpoints", body: "Send a POST request when a product is listed or an order is confirmed. SocialOS handles the captions and posting." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <span className="w-7 h-7 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{step}</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </ol>
        </Section>

        {/* Auth */}
        <Section id="auth">
          <H2>Authentication</H2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pass your API key in the <Code>X-Api-Key</Code> request header. No OAuth, no login flows. Just a single header on every request.
          </p>
          <CodeBlock>{`POST /api/ecommerce/product
X-Api-Key: sk_live_your_key_here
Content-Type: application/json`}</CodeBlock>
          <Callout icon="🔒">
            Keys are hashed with HMAC-SHA256 before storage. The plain key never touches your database or ours after the moment of creation.
          </Callout>
        </Section>

        {/* Product endpoint */}
        <Section id="product">
          <H2>Announce a new product</H2>
          <div className="flex items-center gap-3">
            <Method type="POST" />
            <code className="text-sm font-mono text-emerald-400">/api/ecommerce/product</code>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Call this when a product goes live in your store. SocialOS generates platform-specific captions with Claude and queues or posts across all connected accounts.
          </p>
          <H3>Request body</H3>
          <ParamTable rows={[
            { name: "name",        type: "string",   req: true,  desc: "Product name." },
            { name: "price",       type: "float",    req: true,  desc: "Price of the product." },
            { name: "currency",    type: "string",   req: false, desc: <>ISO 4217 currency code. Defaults to <Code>USD</Code>.</> },
            { name: "description", type: "string",   req: false, desc: "Product description. Included in caption context." },
            { name: "images",      type: "string[]", req: false, desc: "Public image URLs. First image is used as the post thumbnail." },
            { name: "url",         type: "string",   req: false, desc: "Product page URL." },
            { name: "attributes",  type: "object",   req: false, desc: <>Key-value pairs e.g. <Code>{`{"color":"white","size":"M"}`}</Code>.</> },
            { name: "platforms",   type: "string[]", req: false, desc: "Limit to specific platforms. Omit to post to all connected accounts." },
            { name: "action",      type: "string",   req: false, desc: <><Code>post_now</Code> or <Code>queue</Code>. Defaults to <Code>queue</Code>.</> },
          ]} />
          <H3>Example</H3>
          <CodeBlock>{`// Node.js
await fetch("https://your-app.vercel.app/api/ecommerce/product", {
  method: "POST",
  headers: {
    "X-Api-Key": process.env.SOCIALOS_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Air Max 90 White/Black",
    price: 129.99,
    currency: "USD",
    description: "Classic colourway, leather upper, full-length Air unit.",
    images: ["https://mystore.com/img/airmax.jpg"],
    url: "https://mystore.com/products/air-max-90",
    attributes: { size: "9", color: "White/Black" },
    action: "post_now",
  }),
});`}</CodeBlock>
        </Section>

        {/* Sale endpoint */}
        <Section id="sale">
          <H2>Announce a sale</H2>
          <div className="flex items-center gap-3">
            <Method type="POST" />
            <code className="text-sm font-mono text-emerald-400">/api/ecommerce/sale</code>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Call this when an order is confirmed, not at payment initiation. SocialOS picks the right caption template based on stock, buyer location, and whether the item is one-of-a-kind.
          </p>
          <Callout icon="⚠️">
            <strong className="text-slate-200">Never post on payment initiation.</strong> Always wait for order confirmation. A failed payment followed by a sold-out post damages trust and creates false scarcity signals.
          </Callout>
          <H3>Request body</H3>
          <ParamTable rows={[
            { name: "order_id",       type: "string", req: true,  desc: <>Your order&apos;s unique ID (e.g. <Code>ord_abc123</Code>). Used for deduplication. The same order will never post twice, even if your webhook fires more than once.</> },
            { name: "order_status",   type: "string", req: true,  desc: <>Must be exactly <Code>confirmed</Code>. Any other value is rejected with a 422. Never call this endpoint before the order is confirmed.</> },
            { name: "product_name",   type: "string", req: true,  desc: "Name of the product that sold." },
            { name: "price",          type: "float",  req: true,  desc: "Sale price." },
            { name: "currency",       type: "string", req: false, desc: <>ISO 4217 code. Defaults to <Code>USD</Code>.</> },
            { name: "image",          type: "string", req: false, desc: "Single public image URL for the sold product." },
            { name: "quantity_sold",  type: "int",    req: false, desc: "Units in this order. Used for milestone detection. Defaults to 1." },
            { name: "units_remaining",type: "int",    req: false, desc: "Stock after this sale. Triggers scarcity template at 5 or fewer, sold-out at 0." },
            { name: "is_unique",      type: "bool",   req: false, desc: <>Set <Code>true</Code> for handmade, vintage, or one-of-a-kind items. Uses language like &ldquo;found its forever home&rdquo;. No restock messaging.</> },
            { name: "buyer_location", type: "string", req: false, desc: <>City or region of the buyer (e.g. <Code>Lagos, Nigeria</Code>). Enables the social proof template.</> },
            { name: "platforms",      type: "string[]", req: false, desc: "Limit platforms. Omit to post to all." },
            { name: "action",         type: "string", req: false, desc: <><Code>post_now</Code> or <Code>queue</Code>. Defaults to <Code>post_now</Code>.</> },
            { name: "template",       type: "string", req: false, desc: <>Override auto-selection: <Code>scarcity</Code>, <Code>social_proof</Code>, <Code>hype</Code>, <Code>milestone</Code>, <Code>sold_out</Code>, <Code>unique_item</Code>, <Code>fomo</Code>.</> },
          ]} />
          <H3>Example</H3>
          <CodeBlock>{`// Node.js — call on order.confirmed webhook, never on payment initiation
await fetch("https://your-app.vercel.app/api/ecommerce/sale", {
  method: "POST",
  headers: {
    "X-Api-Key": process.env.SOCIALOS_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    order_id: "ord_abc123",
    order_status: "confirmed",
    product_name: "Air Max 90 White/Black Size 9",
    price: 129.99,
    image: "https://mystore.com/img/airmax.jpg",
    quantity_sold: 1,
    units_remaining: 3,
    buyer_location: "New York, US",
    action: "post_now",
  }),
});

// Auto-selects "scarcity" template (units_remaining = 3)
// Duplicate calls with the same order_id return 409 and are ignored safely.`}</CodeBlock>

          <H3>Caption templates</H3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "scarcity",     label: "Scarcity",     when: "units_remaining <= 5" },
              { key: "sold_out",     label: "Sold out",     when: "units_remaining = 0" },
              { key: "unique_item",  label: "Unique item",  when: "is_unique = true" },
              { key: "social_proof", label: "Social proof", when: "buyer_location provided" },
              { key: "milestone",    label: "Milestone",    when: "quantity_sold >= 10" },
              { key: "fomo",         label: "FOMO",         when: "default fallback" },
              { key: "hype",         label: "Hype",         when: "manual override only" },
            ].map((t) => (
              <div key={t.key} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">when: {t.when}</p>
                </div>
                <Code>{t.key}</Code>
              </div>
            ))}
          </div>
        </Section>

        {/* Python example */}
        <Section id="python">
          <H2>Python example</H2>
          <CodeBlock>{`import httpx, os

SOCIALOS_KEY = os.environ["SOCIALOS_API_KEY"]
BASE = "https://your-app.vercel.app"

def on_order_confirmed(order):
    httpx.post(
        f"{BASE}/api/ecommerce/sale",
        headers={"X-Api-Key": SOCIALOS_KEY},
        json={
            "order_id":     order["id"],
            "order_status": "confirmed",
            "product_name": order["product"]["name"],
            "price":        order["total"],
            "currency":     order["currency"],
            "image":        order["product"]["image_url"],
            "units_remaining": order["product"]["stock_after"],
            "buyer_location":  order["shipping"]["city"],
        },
        timeout=15,
    ).raise_for_status()`}</CodeBlock>
        </Section>

        {/* Key management */}
        <Section id="keys">
          <H2>Key management</H2>
          <p className="text-slate-400 text-sm leading-relaxed">
            API keys are managed from <Link href="/store" className="text-violet-400 hover:underline">Store Feed &gt; API Keys</Link>. The endpoints below are also available for programmatic access (uses your JWT session, not an API key).
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-left">
                  <th className="px-4 py-3 text-slate-400 font-semibold">Method</th>
                  <th className="px-4 py-3 text-slate-400 font-semibold">Path</th>
                  <th className="px-4 py-3 text-slate-400 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { method: "GET" as const,    path: "/api/ecommerce/keys",       desc: "List all active keys. Never returns the full key, only the prefix." },
                  { method: "POST" as const,   path: "/api/ecommerce/keys",       desc: "Create a new key. Returns the full key once only." },
                  { method: "DELETE" as const, path: "/api/ecommerce/keys/:id",   desc: "Revoke a key immediately. Any website using it stops working at once." },
                  { method: "GET" as const,    path: "/api/ecommerce/feed",       desc: "List the last 50 product and sale posts." },
                ].map((r) => (
                  <tr key={r.method + r.path} className="bg-slate-900/40 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3"><Method type={r.method} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-violet-300">{r.path}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Best practices */}
        <Section id="tips">
          <H2>Best practices</H2>
          <div className="space-y-3">
            {[
              { icon: "🔄", title: "Retry safely", body: "Retry on 500 or 503, once, with a 2-second delay. Never retry 401, 422, or 429 without fixing the underlying cause first. The 409 on duplicate order_id is safe to ignore." },
              { icon: "📦", title: "One call per line item", body: "If an order contains 3 products, call /sale once per product, not once per order. Each product gets its own post with the correct stock and attributes." },
              { icon: "🔑", title: "Rotate keys safely", body: "If a key is ever exposed, revoke it from Store Feed > API Keys and generate a new one. Update your environment variable, then redeploy your store." },
              { icon: "🌍", title: "Unique items", body: "Set is_unique: true for handmade, vintage, or one-of-a-kind items. The caption will use found-its-forever-home language with no restock messaging, which is more honest and more effective." },
            ].map((t) => (
              <div key={t.title} className="flex gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <span className="text-xl shrink-0">{t.icon}</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">{t.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-8 flex items-center justify-between text-xs text-slate-600">
          <span>SocialOS E-commerce API</span>
          <Link href="/store" className="text-violet-400 hover:text-violet-300 transition-colors">
            Go to Store Feed
          </Link>
        </div>

      </div>
    </div>
  );
}
