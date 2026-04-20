import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { PaperclipIcon, SendIcon, StopIcon } from "../ui/icons";
import { ErrorMessage } from "../ui/ErrorMessage";
import styles from "./InputArea.module.css";

interface InputAreaProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  error?: string | null;
}

const MAX_ROWS = 5;

export function InputArea({
  onSend,
  onStop,
  isGenerating = false,
  error,
}: InputAreaProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const maxHeight = lineHeight * MAX_ROWS + 24;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isGenerating;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      {error && <ErrorMessage message={error} className={styles.error} />}
      <div className={styles.box}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Прикрепить изображение"
          title="Прикрепить изображение"
          disabled={isGenerating}
        >
          <PaperclipIcon />
        </button>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Напишите сообщение..."
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Сообщение"
        />

        {isGenerating ? (
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.stop}`}
            onClick={onStop}
            aria-label="Остановить генерацию"
            title="Остановить"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.send} ${
              canSend ? styles.sendActive : ""
            }`}
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Отправить сообщение"
            title="Отправить"
          >
            <SendIcon />
          </button>
        )}
      </div>
      <div className={styles.hint}>
        Enter — отправить · Shift + Enter — новая строка
      </div>
    </div>
  );
}
