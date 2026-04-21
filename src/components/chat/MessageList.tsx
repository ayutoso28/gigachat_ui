import { useEffect, useRef } from "react";
import type { Message as ChatMessage } from "../../types";
import { EmptyState } from "../ui/EmptyState";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import styles from "./MessageList.module.css";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={styles.container}>
        <EmptyState />
      </div>
    );
  }

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";
  const showTyping = isLoading && !lastIsAssistant;

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {messages.map((m) => (
          <Message key={m.id} message={m} variant={m.role} />
        ))}
        <TypingIndicator isVisible={showTyping} />
        <div ref={anchorRef} aria-hidden="true" />
      </div>
    </div>
  );
}
