import type { Chat } from "../types";

const STORAGE_KEY = "gigachat_ui:state:v1";

export interface PersistedState {
  chats: Chat[];
  activeChatId: string | null;
}

function isValidChat(value: unknown): value is Chat {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.lastMessageAt === "string" &&
    Array.isArray(c.messages)
  );
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const chats = Array.isArray(parsed.chats)
      ? parsed.chats.filter(isValidChat)
      : [];
    const activeChatId =
      typeof parsed.activeChatId === "string" ? parsed.activeChatId : null;
    return { chats, activeChatId };
  } catch (err) {
    console.warn("[storage] failed to load state:", err);
    return null;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[storage] failed to save state:", err);
  }
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
