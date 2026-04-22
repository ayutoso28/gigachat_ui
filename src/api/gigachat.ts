import type { AuthState, Message } from "../types";
import { clearTokenCache, getValidAccessToken } from "./auth";

const API_URL =
  import.meta.env.VITE_GIGACHAT_API_URL ?? "/api/giga/api/v1";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatCompletionMessage[];
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionOptions {
  auth: AuthState;
  signal?: AbortSignal;
  onChunk?: (accumulated: string) => void;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SESSION_ID = uuid();

function buildHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "X-Request-ID": uuid(),
    "X-Session-ID": SESSION_ID,
    "X-Client-ID": "gigachat-ui",
  };
}

function buildBody(request: ChatCompletionRequest): string {
  return JSON.stringify({
    model: request.model ?? "GigaChat",
    stream: request.stream ?? true,
    messages: request.messages,
    temperature: request.temperature,
    top_p: request.top_p,
    max_tokens: request.max_tokens,
  });
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.message || data?.error?.message || JSON.stringify(data);
  } catch {
    const text = await response.text().catch(() => "");
    return text || response.statusText;
  }
}

async function consumeStream(
  response: Response,
  onChunk?: (accumulated: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Пустой ответ от сервера");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIdx;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
      buffer = buffer.slice(newlineIdx + 1);

      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        const choice = parsed.choices?.[0];
        const delta: string =
          choice?.delta?.content ?? choice?.message?.content ?? "";
        if (delta) {
          accumulated += delta;
          onChunk?.(accumulated);
        }
      } catch {
        // пропускаем битые чанки
      }
    }
  }

  return accumulated;
}

async function performRequest(
  request: ChatCompletionRequest,
  accessToken: string,
  signal: AbortSignal | undefined,
  onChunk: ((accumulated: string) => void) | undefined,
): Promise<string> {
  const response = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: buildBody(request),
    signal,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const error = new Error(
      `GigaChat API ${response.status}${message ? `: ${message}` : ""}`,
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    return await consumeStream(response, onChunk);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (content) onChunk?.(content);
  return content;
}

export async function createChatCompletion(
  request: ChatCompletionRequest,
  options: ChatCompletionOptions,
): Promise<string> {
  const { auth, signal, onChunk } = options;

  let accessToken = await getValidAccessToken(auth);

  try {
    return await performRequest(request, accessToken, signal, onChunk);
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 401) {
      clearTokenCache();
      accessToken = await getValidAccessToken(auth);
      return await performRequest(request, accessToken, signal, onChunk);
    }
    throw err;
  }
}

export function buildMessageHistory(
  systemPrompt: string | null,
  messages: Message[],
): ChatCompletionMessage[] {
  const result: ChatCompletionMessage[] = [];
  if (systemPrompt && systemPrompt.trim()) {
    result.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
}
