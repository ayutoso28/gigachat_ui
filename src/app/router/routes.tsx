import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { AuthState, Settings } from "../../types";

const HomeRoute = lazy(() => import("./HomeRoute"));
const ChatRoute = lazy(() => import("./ChatRoute"));

interface RouteProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
}

function RouteFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--color-text-secondary)",
        fontSize: 14,
      }}
      aria-busy="true"
    >
      Загрузка…
    </div>
  );
}

export function AppRoutes(props: RouteProps) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomeRoute {...props} />} />
        <Route path="/chat/:id" element={<ChatRoute {...props} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
