process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

export const config = { runtime: "nodejs" };

const UPSTREAM = "https://gigachat.devices.sberbank.ru";
const PREFIX = "/api/giga";

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

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const incomingPath = req.url || "/";
    const qIdx = incomingPath.indexOf("?");
    const pathname = qIdx === -1 ? incomingPath : incomingPath.slice(0, qIdx);
    const search = qIdx === -1 ? "" : incomingPath.slice(qIdx);
    const rest = pathname.startsWith(PREFIX)
      ? pathname.slice(PREFIX.length)
      : pathname;
    const targetUrl = `${UPSTREAM}${rest}${search}`;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (DROP_REQ_HEADERS.has(key.toLowerCase())) continue;
      forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
    }

    const method = req.method || "GET";
    const hasBody = method !== "GET" && method !== "HEAD";

    let body: Buffer | undefined;
    if (hasBody) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      body = Buffer.concat(chunks);
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (!DROP_RES_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    if (upstream.body) {
      Readable.fromWeb(upstream.body as WebReadableStream).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "Error";
    const cause =
      err instanceof Error && "cause" in err
        ? String((err as { cause?: unknown }).cause)
        : undefined;
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({ error: "proxy_failed", name, detail: message, cause }),
    );
  }
}
