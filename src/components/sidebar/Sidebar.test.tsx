import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Chat } from "../../types";
import { ChatProvider } from "../../app/providers/ChatProvider";
import { Sidebar } from "./Sidebar";

const STORAGE_KEY = "gigachat_ui:state:v1";

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: "c",
    title: "Чат",
    lastMessageAt: "2026-04-20T10:00:00.000Z",
    messages: [],
    ...overrides,
  };
}

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void store.set(k, String(v))),
    removeItem: vi.fn((k: string) => void store.delete(k)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
    __store: store,
  };
}

function seedChats(ls: ReturnType<typeof createLocalStorageMock>, chats: Chat[], active?: string | null) {
  ls.__store.set(
    STORAGE_KEY,
    JSON.stringify({ chats, activeChatId: active ?? chats[0]?.id ?? null }),
  );
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <ChatProvider>
        <Sidebar />
      </ChatProvider>
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  let ls: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("поиск по чатам", () => {
    it("при пустом запросе показывает все чаты", () => {
      seedChats(ls, [
        makeChat({ id: "a", title: "Первый" }),
        makeChat({ id: "b", title: "Второй" }),
        makeChat({ id: "c", title: "Третий" }),
      ]);
      renderSidebar();

      expect(screen.getByText("Первый")).toBeInTheDocument();
      expect(screen.getByText("Второй")).toBeInTheDocument();
      expect(screen.getByText("Третий")).toBeInTheDocument();
    });

    it("фильтрует чаты по подстроке в названии (регистронезависимо)", async () => {
      seedChats(ls, [
        makeChat({ id: "a", title: "React советы" }),
        makeChat({ id: "b", title: "Vue заметки" }),
        makeChat({ id: "c", title: "TypeScript и REACT" }),
      ]);
      const user = userEvent.setup();
      renderSidebar();

      const search = screen.getByRole("searchbox");
      await user.type(search, "react");

      expect(screen.getByText("React советы")).toBeInTheDocument();
      expect(screen.getByText("TypeScript и REACT")).toBeInTheDocument();
      expect(screen.queryByText("Vue заметки")).not.toBeInTheDocument();
    });

    it("находит чат по подстроке в содержимом сообщений", async () => {
      seedChats(ls, [
        makeChat({
          id: "a",
          title: "Обычный чат",
          messages: [
            {
              id: "m-1",
              role: "user",
              content: "расскажи про кубернетис",
              timestamp: "2026-04-20T10:05:00.000Z",
            },
          ],
        }),
        makeChat({ id: "b", title: "Другое" }),
      ]);
      const user = userEvent.setup();
      renderSidebar();

      const search = screen.getByRole("searchbox");
      await user.type(search, "кубернетис");

      expect(screen.getByText("Обычный чат")).toBeInTheDocument();
      expect(screen.queryByText("Другое")).not.toBeInTheDocument();
    });

    it("показывает пустое состояние, если под запрос ничего не подходит", async () => {
      seedChats(ls, [makeChat({ id: "a", title: "Первый" })]);
      const user = userEvent.setup();
      renderSidebar();

      const search = screen.getByRole("searchbox");
      await user.type(search, "совсем-не-найдётся");

      expect(screen.getByText(/ничего не найдено/i)).toBeInTheDocument();
    });
  });

  describe("удаление чата", () => {
    it("клик по иконке удаления открывает диалог подтверждения", async () => {
      seedChats(ls, [makeChat({ id: "a", title: "Удалить меня" })]);
      const user = userEvent.setup();
      renderSidebar();

      const item = screen.getByText("Удалить меня").closest("[role=\"button\"]") as HTMLElement;
      const deleteBtn = within(item).getByRole("button", { name: /удалить чат/i });
      await user.click(deleteBtn);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/удалить чат\?/i)).toBeInTheDocument();
      expect(
        within(dialog).getByText(/«удалить меня»/i),
      ).toBeInTheDocument();
    });

    it("подтверждение диалога удаляет чат из списка", async () => {
      seedChats(ls, [
        makeChat({ id: "a", title: "Оставить" }),
        makeChat({ id: "b", title: "Удалить" }),
      ]);
      const user = userEvent.setup();
      renderSidebar();

      const toDelete = screen.getByText("Удалить").closest("[role=\"button\"]") as HTMLElement;
      await user.click(within(toDelete).getByRole("button", { name: /удалить чат/i }));

      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Удалить" }));

      expect(screen.queryByText("Удалить")).not.toBeInTheDocument();
      expect(screen.getByText("Оставить")).toBeInTheDocument();
    });

    it("отмена диалога оставляет чат на месте", async () => {
      seedChats(ls, [makeChat({ id: "a", title: "Не трогать" })]);
      const user = userEvent.setup();
      renderSidebar();

      const item = screen.getByText("Не трогать").closest("[role=\"button\"]") as HTMLElement;
      await user.click(within(item).getByRole("button", { name: /удалить чат/i }));

      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: /отмена/i }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Не трогать")).toBeInTheDocument();
    });
  });

  describe("создание чата", () => {
    it("клик по кнопке «Новый чат» добавляет чат в начало списка", async () => {
      seedChats(ls, [makeChat({ id: "a", title: "Старый" })]);
      const user = userEvent.setup();
      renderSidebar();

      await user.click(screen.getByRole("button", { name: /новый чат/i }));

      expect(screen.getByText("Старый")).toBeInTheDocument();
      // "Новый чат" есть и в кнопке, и в заголовке нового элемента списка — должно быть ≥ 2 вхождений
      expect(screen.getAllByText(/новый чат/i).length).toBeGreaterThanOrEqual(2);
    });
  });
});
