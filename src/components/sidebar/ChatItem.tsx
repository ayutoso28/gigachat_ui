import { EditIcon, TrashIcon } from "../ui/icons";
import type { Chat } from "../../types";
import styles from "./ChatItem.module.css";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function ChatItem({
  chat,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ChatItemProps) {
  const handleAction = (
    e: React.MouseEvent,
    action: (id: string) => void,
  ) => {
    e.stopPropagation();
    action(chat.id);
  };

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      onClick={() => onSelect(chat.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(chat.id);
        }
      }}
    >
      <div className={styles.content}>
        <span className={styles.title}>{chat.title}</span>
        <span className={styles.date}>{formatDate(chat.lastMessageAt)}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          aria-label="Переименовать чат"
          title="Переименовать"
          onClick={(e) => handleAction(e, onEdit)}
        >
          <EditIcon width={15} height={15} />
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          aria-label="Удалить чат"
          title="Удалить"
          onClick={(e) => handleAction(e, onDelete)}
        >
          <TrashIcon width={15} height={15} />
        </button>
      </div>
    </div>
  );
}
