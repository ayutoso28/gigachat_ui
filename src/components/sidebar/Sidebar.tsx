import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Chat } from "../../types";
import { useChat } from "../../app/providers/ChatProvider";
import { DEFAULT_CHAT_TITLE } from "../../store/chatReducer";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { CloseIcon, PlusIcon, SparkleIcon } from "../ui/icons";
import { SearchInput } from "./SearchInput";
import { ChatList } from "./ChatList";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function matchesQuery(chat: Chat, q: string): boolean {
  if (chat.title.toLowerCase().includes(q)) return true;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].content.toLowerCase().includes(q)) return true;
  }
  return false;
}

export function Sidebar({ onCloseMobile, isMobileOpen }: SidebarProps) {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return state.chats;
    return state.chats.filter((c) => matchesQuery(c, q));
  }, [state.chats, searchQuery]);

  const handleSelect = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`);
      onCloseMobile?.();
    },
    [navigate, onCloseMobile],
  );

  const handleNewChat = useCallback(() => {
    const now = new Date().toISOString();
    const newChat: Chat = {
      id: uid("chat"),
      title: DEFAULT_CHAT_TITLE,
      lastMessageAt: now,
      messages: [],
    };
    dispatch({ type: "CREATE_CHAT", payload: newChat });
    navigate(`/chat/${newChat.id}`);
    onCloseMobile?.();
  }, [dispatch, navigate, onCloseMobile]);

  const handleRename = useCallback(
    (id: string) => {
      const chat = state.chats.find((c) => c.id === id);
      if (!chat) return;
      const nextTitle = window.prompt("Новое название чата", chat.title);
      if (nextTitle === null) return;
      dispatch({
        type: "RENAME_CHAT",
        payload: { id, title: nextTitle.trim() },
      });
    },
    [state.chats, dispatch],
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!pendingDeleteId) return;
    const wasActive = state.activeChatId === pendingDeleteId;
    const remaining = state.chats.filter((c) => c.id !== pendingDeleteId);
    dispatch({ type: "DELETE_CHAT", payload: pendingDeleteId });
    setPendingDeleteId(null);
    if (wasActive) {
      navigate(remaining.length > 0 ? `/chat/${remaining[0].id}` : "/");
    }
  }, [pendingDeleteId, state.activeChatId, state.chats, dispatch, navigate]);

  const handleDeleteCancel = useCallback(() => setPendingDeleteId(null), []);

  const pendingChat =
    pendingDeleteId !== null
      ? state.chats.find((c) => c.id === pendingDeleteId) ?? null
      : null;

  return (
    <>
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
            onClick={handleNewChat}
          >
            Новый чат
          </Button>
        </div>

        <div className={styles.searchRow}>
          <SearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>

        <ChatList
          chats={filteredChats}
          activeChatId={state.activeChatId}
          emptyMessage={
            state.chats.length === 0
              ? "Пока нет чатов. Создайте новый."
              : "Ничего не найдено"
          }
          onSelect={handleSelect}
          onEdit={handleRename}
          onDelete={handleDeleteRequest}
        />
      </aside>

      <ConfirmDialog
        isOpen={pendingChat !== null}
        title="Удалить чат?"
        message={
          pendingChat
            ? `Чат «${pendingChat.title}» и все сообщения будут удалены без возможности восстановления.`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
