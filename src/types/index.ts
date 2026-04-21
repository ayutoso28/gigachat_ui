export type { Message, Role } from "./message";
import type { Message } from "./message";

export interface Chat {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: Message[];
}

export type GigaChatModel =
  | "GigaChat"
  | "GigaChat-Plus"
  | "GigaChat-Pro"
  | "GigaChat-Max";

export type Scope =
  | "GIGACHAT_API_PERS"
  | "GIGACHAT_API_B2B"
  | "GIGACHAT_API_CORP";

export type Theme = "light" | "dark";

export interface Settings {
  model: GigaChatModel;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  theme: Theme;
}

export interface AuthState {
  credentials: string;
  scope: Scope;
}

export interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  loadingByChat: Record<string, boolean>;
  errorByChat: Record<string, string | null>;
}

export type ChatAction =
  | { type: "CREATE_CHAT"; payload: Chat }
  | { type: "SELECT_CHAT"; payload: string | null }
  | { type: "RENAME_CHAT"; payload: { id: string; title: string } }
  | { type: "DELETE_CHAT"; payload: string }
  | { type: "APPEND_MESSAGE"; payload: { chatId: string; message: Message } }
  | {
      type: "UPDATE_MESSAGE";
      payload: { chatId: string; messageId: string; content: string };
    }
  | { type: "REMOVE_MESSAGE"; payload: { chatId: string; messageId: string } }
  | { type: "SET_LOADING"; payload: { chatId: string; isLoading: boolean } }
  | {
      type: "SET_ERROR";
      payload: { chatId: string; error: string | null };
    };
