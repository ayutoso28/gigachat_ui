import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { AuthState, Settings } from "../../types";
import { AppLayout } from "../../components/layout/AppLayout";
import { useChat } from "../providers/ChatProvider";

interface ChatRouteProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
}

export default function ChatRoute(props: ChatRouteProps) {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useChat();

  const exists = !!id && state.chats.some((c) => c.id === id);

  useEffect(() => {
    if (exists && id && state.activeChatId !== id) {
      dispatch({ type: "SELECT_CHAT", payload: id });
    }
  }, [id, exists, state.activeChatId, dispatch]);

  if (!exists) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout {...props} />;
}
