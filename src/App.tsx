import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthForm } from "./components/auth/AuthForm";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ChatProvider } from "./app/providers/ChatProvider";
import { AppRoutes } from "./app/router/routes";
import { DEFAULT_SETTINGS } from "./data/mockData";
import type { AuthState, Settings, Theme } from "./types";

const SettingsPanel = lazy(() =>
  import("./components/settings/SettingsPanel").then((m) => ({
    default: m.SettingsPanel,
  })),
);

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const handleOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleResetSettings = useCallback(() => DEFAULT_SETTINGS, []);
  const handleThemeChange = useCallback(
    (theme: Theme) => setSettings((prev) => ({ ...prev, theme })),
    [],
  );

  if (!auth) {
    return <AuthForm onSubmit={setAuth} />;
  }

  return (
    <ErrorBoundary>
      <ChatProvider>
        <BrowserRouter>
          <AppRoutes
            auth={auth}
            settings={settings}
            onOpenSettings={handleOpenSettings}
          />
        </BrowserRouter>
        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsPanel
              isOpen={isSettingsOpen}
              settings={settings}
              onClose={handleCloseSettings}
              onSave={setSettings}
              onReset={handleResetSettings}
              onThemeChange={handleThemeChange}
            />
          </Suspense>
        )}
      </ChatProvider>
    </ErrorBoundary>
  );
}
