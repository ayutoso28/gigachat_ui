import { useMemo } from "react";
import type { Chat } from "../../types";
import { Button } from "../ui/Button";
import { CloseIcon, PlusIcon, SparkleIcon } from "../ui/icons";
import { SearchInput } from "./SearchInput";
import { ChatList } from "./ChatList";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onEditChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
}

export function Sidebar({
  chats,
  activeChatId,
  searchQuery,
  onSearchChange,
  onNewChat,
  onSelectChat,
  onEditChat,
  onDeleteChat,
  onCloseMobile,
  isMobileOpen,
}: SidebarProps) {
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  return (
    <aside
      className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ""}`}
      aria-label="Боковая панель чатов"
    >
      <div className={styles.header}>
        <div className={styles.logo}>
          <SparkleIcon width={20} height={20} />
          <span>GigaChat</span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCloseMobile}
            aria-label="Закрыть боковую панель"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className={styles.newChatRow}>
        <Button
          variant="secondary"
          fullWidth
          icon={<PlusIcon width={16} height={16} />}
          onClick={onNewChat}
        >
          Новый чат
        </Button>
      </div>

      <div className={styles.searchRow}>
        <SearchInput value={searchQuery} onChange={onSearchChange} />
      </div>

      <ChatList
        chats={filteredChats}
        activeChatId={activeChatId}
        onSelect={onSelectChat}
        onEdit={onEditChat}
        onDelete={onDeleteChat}
      />
    </aside>
  );
}
