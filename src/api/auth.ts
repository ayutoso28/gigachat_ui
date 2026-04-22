import type { AuthState, Scope } from "../types";

const AUTH_URL =
  import.meta.env.VITE_GIGACHAT_AUTH_URL ?? "/api/ngw/api/v2/oauth";

const REFRESH_BUFFER_MS = 60_000;

interface TokenInfo {
  accessToken: string;
  expiresAt: number;
}

interface CachedToken extends TokenInfo {
  credentials: string;
  scope: Scope;
}

let cached: CachedToken | null = null;
let inFlight: {
  credentials: string;
  scope: Scope;
  promise: Promise<TokenInfo>;
} | null = null;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function sanitizeCredentials(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "");
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned.charCodeAt(i) > 0xff) {
      throw new Error(
        "Ключ авторизации содержит недопустимые символы. Скопируйте Base64-строку из личного кабинета без лишнего текста.",
      );
    }
  }
  if (!/^[A-Za-z0-9+/]+=*$/.test(cleaned)) {
    throw new Error(
      "Ключ авторизации должен быть валидной Base64-строкой из личного кабинета.",
    );
  }
  return cleaned;
}

async function requestToken(
  credentials: string,
  scope: Scope,
): Promise<TokenInfo> {
  const cleanCredentials = sanitizeCredentials(credentials);
  const body = new URLSearchParams({ scope });

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${cleanCredentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: uuid(),
    },
    body,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.message || data?.error_description || "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(
      `Не удалось получить токен доступа (${response.status})${
        detail ? `: ${detail}` : ""
      }`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_at: number;
  };

  return {
    accessToken: data.access_token,
    expiresAt: data.expires_at,
  };
}

export async function getValidAccessToken(auth: AuthState): Promise<string> {
  const now = Date.now();

  if (
    cached &&
    cached.credentials === auth.credentials &&
    cached.scope === auth.scope &&
    cached.expiresAt > now + REFRESH_BUFFER_MS
  ) {
    return cached.accessToken;
  }

  if (
    inFlight &&
    inFlight.credentials === auth.credentials &&
    inFlight.scope === auth.scope
  ) {
    const info = await inFlight.promise;
    return info.accessToken;
  }

  const promise = requestToken(auth.credentials, auth.scope);
  inFlight = { credentials: auth.credentials, scope: auth.scope, promise };

  try {
    const info = await promise;
    cached = {
      credentials: auth.credentials,
      scope: auth.scope,
      accessToken: info.accessToken,
      expiresAt: info.expiresAt,
    };
    return info.accessToken;
  } finally {
    if (inFlight && inFlight.promise === promise) {
      inFlight = null;
    }
  }
}

export async function validateCredentials(auth: AuthState): Promise<void> {
  await getValidAccessToken(auth);
}

export function clearTokenCache(): void {
  cached = null;
  inFlight = null;
}
