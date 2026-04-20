import type { Chat } from "../../types";
import { ChatItem } from "./ChatItem";
import styles from "./ChatList.module.css";

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatList({
  chats,
  activeChatId,
  onSelect,
  onEdit,
  onDelete,
}: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className={styles.empty}>Ничего не найдено</div>
    );
  }

  return (
    <div className={styles.list}>
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
