import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputArea } from "./InputArea";

describe("InputArea", () => {
  it("кнопка отправки отключена при пустом поле", () => {
    render(<InputArea onSend={() => {}} />);

    const sendBtn = screen.getByRole("button", { name: /отправить сообщение/i });
    expect(sendBtn).toBeDisabled();
  });

  it("кнопка отправки становится активной после ввода текста", async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={() => {}} />);

    const textarea = screen.getByRole("textbox", { name: /сообщение/i });
    await user.type(textarea, "привет");

    const sendBtn = screen.getByRole("button", { name: /отправить сообщение/i });
    expect(sendBtn).toBeEnabled();
  });

  it("кнопка отправки снова отключена, если ввод — только пробелы", async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={() => {}} />);

    const textarea = screen.getByRole("textbox", { name: /сообщение/i });
    await user.type(textarea, "   ");

    const sendBtn = screen.getByRole("button", { name: /отправить сообщение/i });
    expect(sendBtn).toBeDisabled();
  });

  it("клик по кнопке отправки вызывает onSend с подстриженным текстом", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByRole("textbox", { name: /сообщение/i });
    await user.type(textarea, "  привет  ");
    await user.click(
      screen.getByRole("button", { name: /отправить сообщение/i })
    );

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("привет");
  });

  it("очищает поле после успешной отправки", async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={() => {}} />);

    const textarea = screen.getByRole("textbox", {
      name: /сообщение/i,
    }) as HTMLTextAreaElement;
    await user.type(textarea, "текст");
    await user.click(
      screen.getByRole("button", { name: /отправить сообщение/i })
    );

    expect(textarea.value).toBe("");
  });

  it("нажатие Enter отправляет сообщение", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByRole("textbox", { name: /сообщение/i });
    await user.type(textarea, "через enter{Enter}");

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("через enter");
  });

  it("Shift+Enter НЕ отправляет, а переносит строку", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<InputArea onSend={onSend} />);

    const textarea = screen.getByRole("textbox", {
      name: /сообщение/i,
    }) as HTMLTextAreaElement;
    await user.type(textarea, "строка 1{Shift>}{Enter}{/Shift}строка 2");

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea.value).toContain("\n");
  });

  it("во время загрузки показывает кнопку Стоп вместо Отправить, вызывает onStop", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(
      <InputArea onSend={() => {}} onStop={onStop} isLoading={true} />
    );

    expect(
      screen.queryByRole("button", { name: /отправить сообщение/i })
    ).not.toBeInTheDocument();

    const stopBtn = screen.getByRole("button", {
      name: /остановить генерацию/i,
    });
    await user.click(stopBtn);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("во время загрузки textarea заблокирована", () => {
    render(<InputArea onSend={() => {}} isLoading={true} />);
    const textarea = screen.getByRole("textbox", { name: /сообщение/i });
    expect(textarea).toBeDisabled();
  });

  it("отображает сообщение об ошибке, если передан проп error", () => {
    render(<InputArea onSend={() => {}} error="Что-то пошло не так" />);
    expect(screen.getByText("Что-то пошло не так")).toBeInTheDocument();
  });
});
