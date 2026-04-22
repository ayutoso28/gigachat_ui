import { describe, it, expect } from "vitest";
import type { Chat, ChatAction, ChatState, Message } from "../types";
import { DEFAULT_CHAT_TITLE, chatReducer } from "./chatReducer";

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "chat-1",
    title: "Чат 1",
    lastMessageAt: "2026-04-20T10:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "m-1",
    role: "user",
    content: "Привет",
    timestamp: "2026-04-20T10:05:00.000Z",
    ...overrides,
  };
}

function makeState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    chats: [],
    activeChatId: null,
    loadingByChat: {},
    errorByChat: {},
    ...overrides,
  };
}

describe("chatReducer", () => {
  describe("CREATE_CHAT", () => {
    it("добавляет чат в начало списка и делает его активным", () => {
      const existing = makeChat({ id: "old" });
      const state = makeState({ chats: [existing], activeChatId: "old" });
      const fresh = makeChat({ id: "new", title: DEFAULT_CHAT_TITLE });

      const next = chatReducer(state, {
        type: "CREATE_CHAT",
        payload: fresh,
      });

      expect(next.chats).toHaveLength(2);
      expect(next.chats[0]).toEqual(fresh);
      expect(next.chats[1]).toEqual(existing);
      expect(next.activeChatId).toBe("new");
    });

    it("каждый созданный чат имеет уникальный id (payload контракт)", () => {
      const state = makeState();
      const first = chatReducer(state, {
        type: "CREATE_CHAT",
        payload: makeChat({ id: "a" }),
      });
      const second = chatReducer(first, {
        type: "CREATE_CHAT",
        payload: makeChat({ id: "b" }),
      });

      const ids = second.chats.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("APPEND_MESSAGE", () => {
    it("увеличивает длину messages на 1, новое сообщение в конце", () => {
      const existingMsg = makeMessage({ id: "m-1", content: "один" });
      const chat = makeChat({ id: "c", messages: [existingMsg] });
      const state = makeState({ chats: [chat], activeChatId: "c" });
      const added = makeMessage({ id: "m-2", content: "два" });

      const next = chatReducer(state, {
        type: "APPEND_MESSAGE",
        payload: { chatId: "c", message: added },
      });

      const messages = next.chats[0].messages;
      expect(messages).toHaveLength(2);
      expect(messages[messages.length - 1]).toEqual(added);
    });

    it("обновляет lastMessageAt у чата на timestamp сообщения", () => {
      const chat = makeChat({
        id: "c",
        lastMessageAt: "2026-01-01T00:00:00.000Z",
      });
      const state = makeState({ chats: [chat], activeChatId: "c" });
      const message = makeMessage({ timestamp: "2026-04-20T10:15:00.000Z" });

      const next = chatReducer(state, {
        type: "APPEND_MESSAGE",
        payload: { chatId: "c", message },
      });

      expect(next.chats[0].lastMessageAt).toBe("2026-04-20T10:15:00.000Z");
    });

    it("игнорирует действие, если chatId не найден", () => {
      const chat = makeChat({ id: "c" });
      const state = makeState({ chats: [chat], activeChatId: "c" });

      const next = chatReducer(state, {
        type: "APPEND_MESSAGE",
        payload: { chatId: "missing", message: makeMessage() },
      });

      expect(next.chats[0].messages).toHaveLength(0);
    });
  });

  describe("DELETE_CHAT", () => {
    it("удаляет чат из списка", () => {
      const a = makeChat({ id: "a" });
      const b = makeChat({ id: "b" });
      const state = makeState({ chats: [a, b], activeChatId: "a" });

      const next = chatReducer(state, { type: "DELETE_CHAT", payload: "a" });

      expect(next.chats).toHaveLength(1);
      expect(next.chats[0].id).toBe("b");
    });

    it("при удалении активного чата переключает activeChatId на первый оставшийся", () => {
      const a = makeChat({ id: "a" });
      const b = makeChat({ id: "b" });
      const state = makeState({ chats: [a, b], activeChatId: "a" });

      const next = chatReducer(state, { type: "DELETE_CHAT", payload: "a" });

      expect(next.activeChatId).toBe("b");
    });

    it("сбрасывает activeChatId в null при удалении единственного чата", () => {
      const a = makeChat({ id: "a" });
      const state = makeState({ chats: [a], activeChatId: "a" });

      const next = chatReducer(state, { type: "DELETE_CHAT", payload: "a" });

      expect(next.chats).toHaveLength(0);
      expect(next.activeChatId).toBeNull();
    });

    it("не меняет activeChatId, если удалён неактивный чат", () => {
      const a = makeChat({ id: "a" });
      const b = makeChat({ id: "b" });
      const state = makeState({ chats: [a, b], activeChatId: "a" });

      const next = chatReducer(state, { type: "DELETE_CHAT", payload: "b" });

      expect(next.activeChatId).toBe("a");
    });

    it("очищает loadingByChat и errorByChat у удалённого чата", () => {
      const a = makeChat({ id: "a" });
      const state = makeState({
        chats: [a],
        activeChatId: "a",
        loadingByChat: { a: true },
        errorByChat: { a: "boom" },
      });

      const next = chatReducer(state, { type: "DELETE_CHAT", payload: "a" });

      expect(next.loadingByChat).not.toHaveProperty("a");
      expect(next.errorByChat).not.toHaveProperty("a");
    });
  });

  describe("RENAME_CHAT", () => {
    it("корректно обновляет название чата по id", () => {
      const a = makeChat({ id: "a", title: "Старое" });
      const b = makeChat({ id: "b", title: "Другой" });
      const state = makeState({ chats: [a, b], activeChatId: "a" });

      const next = chatReducer(state, {
        type: "RENAME_CHAT",
        payload: { id: "a", title: "Новое имя" },
      });

      expect(next.chats.find((c) => c.id === "a")!.title).toBe("Новое имя");
      expect(next.chats.find((c) => c.id === "b")!.title).toBe("Другой");
    });

    it("подставляет дефолтное название при пустой строке", () => {
      const a = makeChat({ id: "a", title: "Имя" });
      const state = makeState({ chats: [a], activeChatId: "a" });

      const next = chatReducer(state, {
        type: "RENAME_CHAT",
        payload: { id: "a", title: "" },
      });

      expect(next.chats[0].title).toBe(DEFAULT_CHAT_TITLE);
    });
  });

  describe("прочие действия", () => {
    it("SELECT_CHAT меняет activeChatId", () => {
      const state = makeState({ activeChatId: "a" });
      const next = chatReducer(state, {
        type: "SELECT_CHAT",
        payload: "b",
      });
      expect(next.activeChatId).toBe("b");
    });

    it("UPDATE_MESSAGE обновляет content конкретного сообщения", () => {
      const msg = makeMessage({ id: "m-1", content: "исходное" });
      const chat = makeChat({ id: "c", messages: [msg] });
      const state = makeState({ chats: [chat] });

      const next = chatReducer(state, {
        type: "UPDATE_MESSAGE",
        payload: { chatId: "c", messageId: "m-1", content: "обновлено" },
      });

      expect(next.chats[0].messages[0].content).toBe("обновлено");
    });

    it("REMOVE_MESSAGE убирает сообщение по id", () => {
      const chat = makeChat({
        id: "c",
        messages: [
          makeMessage({ id: "m-1" }),
          makeMessage({ id: "m-2" }),
        ],
      });
      const state = makeState({ chats: [chat] });

      const next = chatReducer(state, {
        type: "REMOVE_MESSAGE",
        payload: { chatId: "c", messageId: "m-1" },
      });

      expect(next.chats[0].messages).toHaveLength(1);
      expect(next.chats[0].messages[0].id).toBe("m-2");
    });

    it("SET_LOADING записывает флаг по chatId", () => {
      const state = makeState();
      const next = chatReducer(state, {
        type: "SET_LOADING",
        payload: { chatId: "c", isLoading: true },
      });
      expect(next.loadingByChat["c"]).toBe(true);
    });

    it("SET_ERROR записывает ошибку по chatId", () => {
      const state = makeState();
      const next = chatReducer(state, {
        type: "SET_ERROR",
        payload: { chatId: "c", error: "boom" },
      });
      expect(next.errorByChat["c"]).toBe("boom");
    });

    it("неизвестное действие возвращает state без изменений", () => {
      const state = makeState({ activeChatId: "x" });
      const next = chatReducer(state, { type: "UNKNOWN" } as unknown as ChatAction);
      expect(next).toBe(state);
    });
  });
});
