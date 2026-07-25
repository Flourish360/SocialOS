import { NextRequest, NextResponse } from "next/server";

// Server-side only — never sent to the browser bundle.
const BACKEND = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

// Raise Vercel's default timeout for AI caption generation requests.
export const maxDuration = 30;

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
      // @ts-expect-error duplex is required by the Fetch spec for streaming bodies
      duplex: "half",
    });
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach the backend. Check BACKEND_URL or Railway status." },
      { status: 502 },
    );
  }

  // Stream the response straight through — handles JSON, streaming AI, and file downloads.
  return new NextResponse(upstream.body, {
    status:  upstream.status,
    headers: upstream.headers,
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
