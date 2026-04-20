import type { ReactNode } from "react";
import { ChatBubbleIcon } from "./icons";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title = "Начните новый диалог",
  description = "Задайте вопрос GigaChat — и получите ответ за пару секунд.",
  icon,
}: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrap}>
        {icon ?? <ChatBubbleIcon width={36} height={36} />}
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
