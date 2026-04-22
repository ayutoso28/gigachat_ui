import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Message } from "./Message";
import type { Message as ChatMessage } from "../../types";

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m-1",
    role: "user",
    content: "Привет, мир",
    timestamp: "2026-04-20T10:05:00.000Z",
    ...overrides,
  };
}

function hasClassContaining(el: HTMLElement | null, fragment: string): boolean {
  if (!el) return false;
  return Array.from(el.classList).some((c) => c.includes(fragment));
}

describe("Message", () => {
  describe("user вариант", () => {
    it("рендерит контент сообщения", () => {
      const msg = makeMessage({ role: "user", content: "Пользовательский текст" });
      render(<Message message={msg} />);

      expect(screen.getByText("Пользовательский текст")).toBeInTheDocument();
    });

    it("использует user-стили на баббле", () => {
      const msg = makeMessage({ role: "user", content: "я" });
      const { container } = render(<Message message={msg} />);

      const bubble = container.querySelector('[class*="bubble"]') as HTMLElement;
      expect(bubble).not.toBeNull();
      expect(hasClassContaining(bubble, "bubbleUser")).toBe(true);
    });

    it("показывает автора «Вы»", () => {
      const msg = makeMessage({ role: "user", content: "x" });
      render(<Message message={msg} />);
      expect(screen.getByText("Вы")).toBeInTheDocument();
    });

    it("у user-варианта нет кнопки «Копировать»", () => {
      const msg = makeMessage({ role: "user", content: "x" });
      render(<Message message={msg} />);

      expect(
        screen.queryByRole("button", { name: /скопировать сообщение/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("assistant вариант", () => {
    it("рендерит контент сообщения", () => {
      const msg = makeMessage({
        role: "assistant",
        content: "Ассистент отвечает",
      });
      render(<Message message={msg} />);

      expect(screen.getByText("Ассистент отвечает")).toBeInTheDocument();
    });

    it("использует assistant-стили на баббле", () => {
      const msg = makeMessage({ role: "assistant", content: "a" });
      const { container } = render(<Message message={msg} />);

      const bubble = container.querySelector('[class*="bubble"]') as HTMLElement;
      expect(bubble).not.toBeNull();
      expect(hasClassContaining(bubble, "bubbleAssistant")).toBe(true);
    });

    it("показывает автора «GigaChat» и кнопку «Копировать»", () => {
      const msg = makeMessage({ role: "assistant", content: "a" });
      render(<Message message={msg} />);

      expect(screen.getByText("GigaChat")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /скопировать сообщение/i })
      ).toBeInTheDocument();
    });
  });

  describe("проп variant переопределяет role", () => {
    it("variant=assistant на сообщении с role=user рендерит assistant UI", () => {
      const msg = makeMessage({ role: "user", content: "смешанный" });
      render(<Message message={msg} variant="assistant" />);

      expect(screen.getByText("GigaChat")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /скопировать сообщение/i })
      ).toBeInTheDocument();
    });
  });
});
