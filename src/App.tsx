import { useEffect, useMemo, useState } from "react";
import { AuthForm } from "./components/auth/AuthForm";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { DEFAULT_SETTINGS, MOCK_CHATS } from "./data/mockData";
import type { AuthState, Chat, ChatMessage, Settings } from "./types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    MOCK_CHATS[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssistantTyping] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const handleNewChat = () => {
    const now = new Date().toISOString();
    const newChat: Chat = {
      id: uid("chat"),
      title: "Новый чат",
      lastMessageAt: now,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveChatId((current) =>
        current === id ? next[0]?.id ?? null : current,
      );
      return next;
    });
  };

  const handleEditChat = (id: string) => {
    const current = chats.find((c) => c.id === id);
    if (!current) return;
    const nextTitle = window.prompt("Новое название чата", current.title);
    if (!nextTitle) return;
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: nextTitle } : c)),
    );
  };

  const handleSend = (text: string) => {
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: uid("m"),
      role: "user",
      content: text,
      createdAt: now,
    };

    if (!activeChatId) {
      const newChat: Chat = {
        id: uid("chat"),
        title: text.slice(0, 40),
        lastMessageAt: now,
        messages: [message],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      return;
    }

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages, message],
              lastMessageAt: now,
            }
          : c,
      ),
    );
  };

  const handleSaveSettings = (next: Settings) => {
    setSettings(next);
  };

  const resetSettings = useMemo(() => () => DEFAULT_SETTINGS, []);

  if (!auth) {
    return <AuthForm onSubmit={setAuth} />;
  }

  return (
    <>
      <AppLayout
        chats={chats}
        activeChatId={activeChatId}
        isAssistantTyping={isAssistantTyping}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={handleNewChat}
        onSelectChat={setActiveChatId}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSend={handleSend}
      />
      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onReset={resetSettings}
      />
    </>
  );
}
