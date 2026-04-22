import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import type { ChatAction, ChatState } from "../../types";
import { chatReducer, initChatState } from "../../store/chatReducer";
import { savePersistedState } from "../../utils/storage";

interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, undefined, initChatState);

  useEffect(() => {
    savePersistedState({
      chats: state.chats,
      activeChatId: state.activeChatId,
    });
  }, [state.chats, state.activeChatId]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within <ChatProvider>");
  }
  return ctx;
}
