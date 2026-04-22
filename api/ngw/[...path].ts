export const config = { runtime: "edge" };

const UPSTREAM = "https://ngw.devices.sberbank.ru:9443";
const PREFIX = "/api/ngw";

const DROP_REQ_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-id",
  "x-vercel-deployment-url",
  "x-vercel-forwarded-for",
  "x-vercel-proxy-signature",
  "x-vercel-proxy-signature-ts",
]);

const DROP_RES_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

export default async function handler(request: Request): Promise<Response> {
  try {
    const incomingUrl = new URL(request.url);
    const rest = incomingUrl.pathname.startsWith(PREFIX)
      ? incomingUrl.pathname.slice(PREFIX.length)
      : incomingUrl.pathname;
    const targetUrl = `${UPSTREAM}${rest}${incomingUrl.search}`;

    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
      if (!DROP_REQ_HEADERS.has(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    const hasBody = request.method !== "GET" && request.method !== "HEAD";

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!DROP_RES_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "proxy_failed", detail: message }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}
