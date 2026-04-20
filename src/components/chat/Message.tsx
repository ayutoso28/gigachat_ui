import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon } from "../ui/icons";
import type { ChatMessage } from "../../types";
import styles from "./Message.module.css";

interface MessageProps {
  message: ChatMessage;
  variant?: "user" | "assistant";
}

export function Message({ message, variant }: MessageProps) {
  const actualVariant = variant ?? message.role;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const isUser = actualVariant === "user";

  return (
    <div
      className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}
    >
      {!isUser && (
        <div className={styles.avatar} aria-hidden="true">
          <span className={styles.avatarGlyph}>G</span>
        </div>
      )}

      <div className={styles.group}>
        <div className={styles.meta}>
          <span className={styles.author}>
            {isUser ? "Вы" : "GigaChat"}
          </span>
        </div>

        <div
          className={`${styles.bubble} ${
            isUser ? styles.bubbleUser : styles.bubbleAssistant
          }`}
        >
          <div className={styles.markdown}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopy}
            aria-label="Скопировать сообщение"
            title={copied ? "Скопировано" : "Копировать"}
          >
            {copied ? (
              <CheckIcon width={14} height={14} />
            ) : (
              <CopyIcon width={14} height={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
