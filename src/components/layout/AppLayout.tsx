import { useEffect, useState } from "react";
import type { AuthState, Settings } from "../../types";
import { Sidebar } from "../sidebar/Sidebar";
import { ChatWindow } from "../chat/ChatWindow";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  auth: AuthState;
  settings: Settings;
  onOpenSettings: () => void;
}

const MOBILE_BREAKPOINT = 768;

export function AppLayout({ auth, settings, onOpenSettings }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.layout}>
      {isMobile && isSidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isMobileOpen={isMobile ? isSidebarOpen : undefined}
        onCloseMobile={isMobile ? () => setIsSidebarOpen(false) : undefined}
      />

      <ChatWindow
        auth={auth}
        settings={settings}
        onOpenSettings={onOpenSettings}
        onOpenSidebar={isMobile ? () => setIsSidebarOpen(true) : undefined}
      />
    </div>
  );
}
