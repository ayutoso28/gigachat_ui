import { useEffect, useRef } from "react";
import type { AuthState, Message, Settings } from "../../types";
import {
  buildMessageHistory,
  createChatCompletion,
} from "../../api/gigachat";
import {
  DEFAULT_CHAT_TITLE,
  useChat,
} from "../../app/providers/ChatProvider";
import { MenuIcon, SettingsIcon } from "../ui/icons";
import { EmptyState } from "../ui/EmptyState";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

interface ChatWindowProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
  onOpenSidebar?: () => void;
}

const TITLE_MAX_LENGTH = 40;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function deriveTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, TITLE_MAX_LENGTH - 1).trimEnd() + "…";
}

export function ChatWindow({
  auth,
  settings,
  onOpenSettings,
  onOpenSidebar,
}: ChatWindowProps) {
  const { state, dispatch } = useChat();
  const activeChat =
    state.chats.find((c) => c.id === state.activeChatId) ?? null;
  const chatId = activeChat?.id ?? null;

  const isLoading = chatId ? !!state.loadingByChat[chatId] : false;
  const error = chatId ? state.errorByChat[chatId] ?? null : null;

  const controllersRef = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      for (const c of controllers.values()) c.abort();
      controllers.clear();
    };
  }, []);

  const handleSend = async (text: string) => {
    if (!activeChat || !chatId || isLoading) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: uid("m"),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const prevMessages = activeChat.messages;
    const history = buildMessageHistory(settings.systemPrompt, [
      ...prevMessages,
      userMessage,
    ]);

    dispatch({
      type: "APPEND_MESSAGE",
      payload: { chatId, message: userMessage },
    });

    if (
      prevMessages.length === 0 &&
      activeChat.title === DEFAULT_CHAT_TITLE
    ) {
      dispatch({
        type: "RENAME_CHAT",
        payload: { id: chatId, title: deriveTitle(trimmed) },
      });
    }

    dispatch({ type: "SET_ERROR", payload: { chatId, error: null } });
    dispatch({ type: "SET_LOADING", payload: { chatId, isLoading: true } });

    const assistantId = uid("m");
    let appended = false;

    const controller = new AbortController();
    controllersRef.current.set(chatId, controller);

    try {
      await createChatCompletion(
        {
          messages: history,
          model: settings.model,
          temperature: settings.temperature,
          top_p: settings.topP,
          max_tokens: settings.maxTokens,
          stream: true,
        },
        {
          auth,
          signal: controller.signal,
          onChunk: (accumulated) => {
            if (!appended) {
              dispatch({
                type: "APPEND_MESSAGE",
                payload: {
                  chatId,
                  message: {
                    id: assistantId,
                    role: "assistant",
                    content: accumulated,
                    timestamp: new Date().toISOString(),
                  },
                },
              });
              appended = true;
            } else {
              dispatch({
                type: "UPDATE_MESSAGE",
                payload: {
                  chatId,
                  messageId: assistantId,
                  content: accumulated,
                },
              });
            }
          },
        },
      );
    } catch (err: unknown) {
      const isAbort =
        err instanceof DOMException && err.name === "AbortError";
      if (!isAbort) {
        if (appended) {
          dispatch({
            type: "REMOVE_MESSAGE",
            payload: { chatId, messageId: assistantId },
          });
        }
        const message =
          err instanceof Error ? err.message : "Не удалось получить ответ";
        dispatch({ type: "SET_ERROR", payload: { chatId, error: message } });
      }
    } finally {
      controllersRef.current.delete(chatId);
      dispatch({
        type: "SET_LOADING",
        payload: { chatId, isLoading: false },
      });
    }
  };

  const handleStop = () => {
    if (!chatId) return;
    controllersRef.current.get(chatId)?.abort();
  };

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
            {activeChat ? activeChat.title : DEFAULT_CHAT_TITLE}
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

      {activeChat ? (
        <MessageList
          messages={activeChat.messages}
          isLoading={isLoading}
        />
      ) : (
        <div className={styles.emptyWrap}>
          <EmptyState />
        </div>
      )}

      <div className={styles.inputWrap}>
        <InputArea
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </main>
  );
}
