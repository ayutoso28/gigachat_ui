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

export async function proxyRequest(
  request: Request,
  upstreamBase: string,
  prefix: string,
): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const rest =
    incomingUrl.pathname.startsWith(prefix)
      ? incomingUrl.pathname.slice(prefix.length)
      : incomingUrl.pathname;
  const targetUrl = `${upstreamBase}${rest}${incomingUrl.search}`;

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
}
