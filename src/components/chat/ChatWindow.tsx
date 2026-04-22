import { useNavigate } from "react-router-dom";
import type { AuthState, Chat, Message, Settings } from "../../types";
import {
  buildMessageHistory,
  createChatCompletion,
} from "../../api/gigachat";
import { useChat } from "../../app/providers/ChatProvider";
import { DEFAULT_CHAT_TITLE } from "../../store/chatReducer";
import { MenuIcon, SettingsIcon } from "../ui/icons";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBoundary } from "../ErrorBoundary";
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

const inFlightControllers = new Map<string, AbortController>();

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
  const navigate = useNavigate();
  const activeChat =
    state.chats.find((c) => c.id === state.activeChatId) ?? null;
  const chatId = activeChat?.id ?? null;

  const isLoading = chatId ? !!state.loadingByChat[chatId] : false;
  const error = chatId ? state.errorByChat[chatId] ?? null : null;

  const handleSend = async (text: string) => {
    if (isLoading) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    let targetId: string;
    let prevMessages: Message[];
    let hasDefaultTitle: boolean;

    if (activeChat && chatId) {
      targetId = chatId;
      prevMessages = activeChat.messages;
      hasDefaultTitle = activeChat.title === DEFAULT_CHAT_TITLE;
    } else {
      const now = new Date().toISOString();
      const newChat: Chat = {
        id: uid("chat"),
        title: DEFAULT_CHAT_TITLE,
        lastMessageAt: now,
        messages: [],
      };
      dispatch({ type: "CREATE_CHAT", payload: newChat });
      navigate(`/chat/${newChat.id}`);
      targetId = newChat.id;
      prevMessages = [];
      hasDefaultTitle = true;
    }

    const userMessage: Message = {
      id: uid("m"),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const history = buildMessageHistory(settings.systemPrompt, [
      ...prevMessages,
      userMessage,
    ]);

    dispatch({
      type: "APPEND_MESSAGE",
      payload: { chatId: targetId, message: userMessage },
    });

    if (prevMessages.length === 0 && hasDefaultTitle) {
      dispatch({
        type: "RENAME_CHAT",
        payload: { id: targetId, title: deriveTitle(trimmed) },
      });
    }

    dispatch({
      type: "SET_ERROR",
      payload: { chatId: targetId, error: null },
    });
    dispatch({
      type: "SET_LOADING",
      payload: { chatId: targetId, isLoading: true },
    });

    const assistantId = uid("m");
    let appended = false;

    const controller = new AbortController();
    inFlightControllers.set(targetId, controller);

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
                  chatId: targetId,
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
                  chatId: targetId,
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
            payload: { chatId: targetId, messageId: assistantId },
          });
        }
        const message =
          err instanceof Error ? err.message : "Не удалось получить ответ";
        dispatch({
          type: "SET_ERROR",
          payload: { chatId: targetId, error: message },
        });
      }
    } finally {
      inFlightControllers.delete(targetId);
      dispatch({
        type: "SET_LOADING",
        payload: { chatId: targetId, isLoading: false },
      });
    }
  };

  const handleStop = () => {
    if (!chatId) return;
    inFlightControllers.get(chatId)?.abort();
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
        <ErrorBoundary>
          <MessageList
            messages={activeChat.messages}
            isLoading={isLoading}
          />
        </ErrorBoundary>
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
