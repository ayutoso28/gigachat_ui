import type { Chat } from "../../types";
import { MenuIcon, SettingsIcon } from "../ui/icons";
import { EmptyState } from "../ui/EmptyState";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

interface ChatWindowProps {
  chat: Chat | null;
  isAssistantTyping?: boolean;
  onOpenSettings: () => void;
  onOpenSidebar?: () => void;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export function ChatWindow({
  chat,
  isAssistantTyping = false,
  onOpenSettings,
  onOpenSidebar,
  onSend,
  onStop,
}: ChatWindowProps) {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.left}>
          {onOpenSidebar && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onOpenSidebar}
              aria-label="Открыть боковую панель"
            >
              <MenuIcon />
            </button>
          )}
          <h1 className={styles.title}>
            {chat ? chat.title : "Новый чат"}
          </h1>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenSettings}
          aria-label="Открыть настройки"
          title="Настройки"
        >
          <SettingsIcon />
        </button>
      </header>

      {chat ? (
        <MessageList
          messages={chat.messages}
          isAssistantTyping={isAssistantTyping}
        />
      ) : (
        <div className={styles.emptyWrap}>
          <EmptyState />
        </div>
      )}

      <div className={styles.inputWrap}>
        <InputArea
          onSend={onSend}
          onStop={onStop}
          isGenerating={isAssistantTyping}
        />
      </div>
    </main>
  );
}
