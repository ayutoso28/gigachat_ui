import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Chat } from "../types";
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from "./storage";

const STORAGE_KEY = "gigachat_ui:state:v1";

interface LocalStorageMock {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  key: ReturnType<typeof vi.fn>;
  readonly length: number;
  __store: Map<string, string>;
}

function createLocalStorageMock(): LocalStorageMock {
  const store = new Map<string, string>();
  const mock: LocalStorageMock = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
    __store: store,
  };
  return mock;
}

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "chat-1",
    title: "Чат",
    lastMessageAt: "2026-04-20T10:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

describe("storage", () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("savePersistedState", () => {
    it("сохраняет состояние в localStorage под ключом STORAGE_KEY", () => {
      const chat = makeChat({ id: "a" });
      savePersistedState({ chats: [chat], activeChatId: "a" });

      expect(ls.setItem).toHaveBeenCalledTimes(1);
      const [key, value] = ls.setItem.mock.calls[0];
      expect(key).toBe(STORAGE_KEY);
      expect(JSON.parse(value as string)).toEqual({
        chats: [chat],
        activeChatId: "a",
      });
    });

    it("не падает, если setItem бросает (например, QuotaExceededError)", () => {
      ls.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() =>
        savePersistedState({ chats: [], activeChatId: null })
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe("loadPersistedState", () => {
    it("возвращает null, если ключа в localStorage нет", () => {
      expect(loadPersistedState()).toBeNull();
    });

    it("корректно восстанавливает ранее сохранённое состояние", () => {
      const chat = makeChat({ id: "a", title: "Восстановленный" });
      const payload = { chats: [chat], activeChatId: "a" };
      ls.__store.set(STORAGE_KEY, JSON.stringify(payload));

      const loaded = loadPersistedState();
      expect(loaded).toEqual(payload);
    });

    it("при невалидном JSON не падает и возвращает null", () => {
      ls.__store.set(STORAGE_KEY, "{не валидный json");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => loadPersistedState()).not.toThrow();
      expect(loadPersistedState()).toBeNull();
      expect(warn).toHaveBeenCalled();
    });

    it("отфильтровывает битые элементы chats, не падая", () => {
      const good = makeChat({ id: "ok" });
      const bad = { id: 123, title: null };
      ls.__store.set(
        STORAGE_KEY,
        JSON.stringify({ chats: [good, bad], activeChatId: "ok" })
      );

      const loaded = loadPersistedState();
      expect(loaded).not.toBeNull();
      expect(loaded!.chats).toHaveLength(1);
      expect(loaded!.chats[0]).toEqual(good);
    });

    it("возвращает пустой chats, если поле не массив", () => {
      ls.__store.set(
        STORAGE_KEY,
        JSON.stringify({ chats: "not-array", activeChatId: null })
      );

      const loaded = loadPersistedState();
      expect(loaded).toEqual({ chats: [], activeChatId: null });
    });

    it("нормализует нестроковый activeChatId в null", () => {
      ls.__store.set(
        STORAGE_KEY,
        JSON.stringify({ chats: [], activeChatId: 42 })
      );

      const loaded = loadPersistedState();
      expect(loaded!.activeChatId).toBeNull();
    });
  });

  describe("интеграционный round-trip", () => {
    it("save → load возвращает то же состояние", () => {
      const chat = makeChat({
        id: "round",
        title: "Туда-обратно",
        messages: [
          {
            id: "m-1",
            role: "user",
            content: "Привет",
            timestamp: "2026-04-20T10:05:00.000Z",
          },
        ],
      });

      savePersistedState({ chats: [chat], activeChatId: "round" });
      const loaded = loadPersistedState();

      expect(loaded).toEqual({ chats: [chat], activeChatId: "round" });
    });
  });

  describe("clearPersistedState", () => {
    it("удаляет запись из localStorage", () => {
      ls.__store.set(STORAGE_KEY, JSON.stringify({ chats: [], activeChatId: null }));

      clearPersistedState();

      expect(ls.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(ls.__store.has(STORAGE_KEY)).toBe(false);
    });

    it("не падает, если removeItem бросает", () => {
      ls.removeItem.mockImplementation(() => {
        throw new Error("boom");
      });
      expect(() => clearPersistedState()).not.toThrow();
    });
  });
});
