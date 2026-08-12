import { NextRequest, NextResponse } from "next/server";

// Server-side only — never sent to the browser bundle.
const BACKEND = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

// Raise Vercel's default timeout for AI caption generation requests.
export const maxDuration = 30;

// This proxy forwards user-scoped, authenticated requests (API keys, feed, account
// data). It must never be cached, or two different users can be served each other's
// responses. Next's fetch() defaults GET requests to force-cache otherwise.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function handler(req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname; // e.g. /api/ecommerce/feed
  const search   = req.nextUrl.search;   // e.g. ?status=published
  const target   = `${BACKEND}${pathname}${search}`;

  // Forward all headers except hop-by-hop ones that break upstream servers.
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "connection" || lower === "transfer-encoding") continue;
    headers.set(key, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      cache: "no-store",
      // @ts-expect-error duplex is required by the Fetch spec for streaming bodies
      duplex: "half",
    });
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach the backend. Check BACKEND_URL or Railway status." },
      { status: 502 },
    );
  }

  // Forward response headers, stripping encoding headers that Node's fetch
  // already handled (it decompresses gzip/br automatically, so forwarding
  // Content-Encoding would cause the browser to double-decompress and fail).
  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "content-encoding" || lower === "content-length") continue;
    responseHeaders.set(key, value);
  }

  return new NextResponse(upstream.body, {
    status:  upstream.status,
    headers: responseHeaders,
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
