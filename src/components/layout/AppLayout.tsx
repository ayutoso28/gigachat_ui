import { useEffect, useState } from "react";
import type { Chat } from "../../types";
import { Sidebar } from "../sidebar/Sidebar";
import { ChatWindow } from "../chat/ChatWindow";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  chats: Chat[];
  activeChatId: string | null;
  isAssistantTyping?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onEditChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  onSend: (text: string) => void;
  onStop?: () => void;
}

const MOBILE_BREAKPOINT = 768;

export function AppLayout({
  chats,
  activeChatId,
  isAssistantTyping,
  searchQuery,
  onSearchChange,
  onNewChat,
  onSelectChat,
  onEditChat,
  onDeleteChat,
  onOpenSettings,
  onSend,
  onStop,
}: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const handleSelect = (id: string) => {
    onSelectChat(id);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      {isMobile && isSidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onNewChat={handleNewChat}
        onSelectChat={handleSelect}
        onEditChat={onEditChat}
        onDeleteChat={onDeleteChat}
        isMobileOpen={isMobile ? isSidebarOpen : undefined}
        onCloseMobile={isMobile ? () => setIsSidebarOpen(false) : undefined}
      />

      <ChatWindow
        chat={activeChat}
        isAssistantTyping={isAssistantTyping}
        onOpenSettings={onOpenSettings}
        onOpenSidebar={isMobile ? () => setIsSidebarOpen(true) : undefined}
        onSend={onSend}
        onStop={onStop}
      />
    </div>
  );
}
