export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: ChatMessage[];
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
