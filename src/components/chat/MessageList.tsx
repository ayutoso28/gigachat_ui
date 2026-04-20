import type { ChatMessage } from "../../types";
import { EmptyState } from "../ui/EmptyState";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import styles from "./MessageList.module.css";

interface MessageListProps {
  messages: ChatMessage[];
  isAssistantTyping?: boolean;
}

export function MessageList({
  messages,
  isAssistantTyping = false,
}: MessageListProps) {
  if (messages.length === 0 && !isAssistantTyping) {
    return (
      <div className={styles.container}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {isAssistantTyping && <TypingIndicator isVisible />}
      </div>
    </div>
  );
}
