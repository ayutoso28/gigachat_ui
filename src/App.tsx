import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthForm } from "./components/auth/AuthForm";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { ChatProvider } from "./app/providers/ChatProvider";
import { AppRoutes } from "./app/router/routes";
import { DEFAULT_SETTINGS } from "./data/mockData";
import type { AuthState, Settings } from "./types";

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  if (!auth) {
    return <AuthForm onSubmit={setAuth} />;
  }

  return (
    <ChatProvider>
      <BrowserRouter>
        <AppRoutes
          auth={auth}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </BrowserRouter>
      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
        onReset={() => DEFAULT_SETTINGS}
        onThemeChange={(theme) =>
          setSettings((prev) => ({ ...prev, theme }))
        }
      />
    </ChatProvider>
  );
}
