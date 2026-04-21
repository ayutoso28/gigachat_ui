import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import type { AuthState, Settings } from "../../types";
import { AppLayout } from "../../components/layout/AppLayout";
import { useChat } from "../providers/ChatProvider";

interface RouteProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
}

function HomeRoute(props: RouteProps) {
  const { state } = useChat();

  if (state.chats.length > 0) {
    const targetId = state.activeChatId ?? state.chats[0].id;
    return <Navigate to={`/chat/${targetId}`} replace />;
  }

  return <AppLayout {...props} />;
}

function ChatRoute(props: RouteProps) {
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

export function AppRoutes(props: RouteProps) {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute {...props} />} />
      <Route path="/chat/:id" element={<ChatRoute {...props} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
