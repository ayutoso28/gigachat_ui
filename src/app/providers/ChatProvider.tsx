import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { Dispatch, ReactNode } from "react";
import type { Chat, ChatAction, ChatState } from "../../types";
import { MOCK_CHATS } from "../../data/mockData";
import {
  loadPersistedState,
  savePersistedState,
} from "../../utils/storage";

const DEFAULT_CHAT_TITLE = "Новый чат";

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  loadingByChat: {},
  errorByChat: {},
};

function init(): ChatState {
  const persisted = loadPersistedState();
  if (persisted && persisted.chats.length > 0) {
    return {
      ...initialState,
      chats: persisted.chats,
      activeChatId:
        persisted.activeChatId &&
        persisted.chats.some((c) => c.id === persisted.activeChatId)
          ? persisted.activeChatId
          : persisted.chats[0]?.id ?? null,
    };
  }
  return {
    ...initialState,
    chats: MOCK_CHATS,
    activeChatId: MOCK_CHATS[0]?.id ?? null,
  };
}

function touchChat(chat: Chat, timestamp: string): Chat {
  return { ...chat, lastMessageAt: timestamp };
}

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "CREATE_CHAT":
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        activeChatId: action.payload.id,
      };
    case "SELECT_CHAT":
      return { ...state, activeChatId: action.payload };
    case "RENAME_CHAT":
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.payload.id
            ? { ...c, title: action.payload.title || DEFAULT_CHAT_TITLE }
            : c,
        ),
      };
    case "DELETE_CHAT": {
      const remaining = state.chats.filter((c) => c.id !== action.payload);
      const { [action.payload]: _dropLoading, ...loadingByChat } =
        state.loadingByChat;
      const { [action.payload]: _dropError, ...errorByChat } =
        state.errorByChat;
      void _dropLoading;
      void _dropError;
      return {
        ...state,
        chats: remaining,
        activeChatId:
          state.activeChatId === action.payload
            ? remaining[0]?.id ?? null
            : state.activeChatId,
        loadingByChat,
        errorByChat,
      };
    }
    case "APPEND_MESSAGE": {
      const { chatId, message } = action.payload;
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...touchChat(c, message.timestamp),
                messages: [...c.messages, message],
              }
            : c,
        ),
      };
    }
    case "UPDATE_MESSAGE": {
      const { chatId, messageId, content } = action.payload;
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m,
                ),
              }
            : c,
        ),
      };
    }
    case "REMOVE_MESSAGE": {
      const { chatId, messageId } = action.payload;
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
            : c,
        ),
      };
    }
    case "SET_LOADING":
      return {
        ...state,
        loadingByChat: {
          ...state.loadingByChat,
          [action.payload.chatId]: action.payload.isLoading,
        },
      };
    case "SET_ERROR":
      return {
        ...state,
        errorByChat: {
          ...state.errorByChat,
          [action.payload.chatId]: action.payload.error,
        },
      };
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    savePersistedState({
      chats: state.chats,
      activeChatId: state.activeChatId,
    });
  }, [state.chats, state.activeChatId]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within <ChatProvider>");
  }
  return ctx;
}

export { DEFAULT_CHAT_TITLE };
