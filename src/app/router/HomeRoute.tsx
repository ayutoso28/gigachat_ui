import { Navigate } from "react-router-dom";
import type { AuthState, Settings } from "../../types";
import { AppLayout } from "../../components/layout/AppLayout";
import { useChat } from "../providers/ChatProvider";

interface HomeRouteProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
}

export default function HomeRoute(props: HomeRouteProps) {
  const { state } = useChat();

  if (state.chats.length > 0) {
    const targetId = state.activeChatId ?? state.chats[0].id;
    return <Navigate to={`/chat/${targetId}`} replace />;
  }

  return <AppLayout {...props} />;
}
