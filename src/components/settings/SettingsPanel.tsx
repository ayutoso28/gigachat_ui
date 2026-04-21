import { useEffect, useState } from "react";
import type { GigaChatModel, Settings, Theme } from "../../types";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { Toggle } from "../ui/Toggle";
import { CloseIcon, MoonIcon, SunIcon } from "../ui/icons";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  onReset: () => Settings;
  onThemeChange: (theme: Theme) => void;
}

const MODEL_OPTIONS: GigaChatModel[] = [
  "GigaChat",
  "GigaChat-Plus",
  "GigaChat-Pro",
  "GigaChat-Max",
];

export function SettingsPanel({
  isOpen,
  settings,
  onClose,
  onSave,
  onReset,
  onThemeChange,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<Settings>(settings);

  useEffect(() => {
    if (isOpen) setDraft(settings);
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const defaults = onReset();
    setDraft(defaults);
    onThemeChange(defaults.theme);
  };

  const handleThemeToggle = (isDark: boolean) => {
    const nextTheme: Theme = isDark ? "dark" : "light";
    update("theme", nextTheme);
    onThemeChange(nextTheme);
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-label="Настройки"
        aria-hidden={!isOpen}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Настройки</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть настройки"
          >
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <label className={styles.fieldLabel} htmlFor="model-select">
              Модель
            </label>
            <select
              id="model-select"
              className={styles.select}
              value={draft.model}
              onChange={(e) =>
                update("model", e.target.value as GigaChatModel)
              }
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </section>

          <section className={styles.section}>
            <Slider
              label="Temperature"
              value={draft.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => update("temperature", v)}
              formatValue={(v) => v.toFixed(1)}
            />
          </section>

          <section className={styles.section}>
            <Slider
              label="Top-P"
              value={draft.topP}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => update("topP", v)}
              formatValue={(v) => v.toFixed(2)}
            />
          </section>

          <section className={styles.section}>
            <label className={styles.fieldLabel} htmlFor="max-tokens">
              Max Tokens
            </label>
            <input
              id="max-tokens"
              type="number"
              className={styles.input}
              min={1}
              max={32000}
              step={1}
              value={draft.maxTokens}
              onChange={(e) =>
                update("maxTokens", Math.max(1, Number(e.target.value) || 0))
              }
            />
          </section>

          <section className={styles.section}>
            <label className={styles.fieldLabel} htmlFor="system-prompt">
              System Prompt
            </label>
            <textarea
              id="system-prompt"
              className={styles.textarea}
              rows={4}
              value={draft.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
              placeholder="Например: Ты — полезный ассистент..."
            />
          </section>

          <section className={styles.section}>
            <div className={styles.themeRow}>
              <div className={styles.themeLabel}>
                {draft.theme === "dark" ? <MoonIcon /> : <SunIcon />}
                <span>
                  {draft.theme === "dark" ? "Тёмная тема" : "Светлая тема"}
                </span>
              </div>
              <Toggle
                id="theme-toggle"
                checked={draft.theme === "dark"}
                onChange={handleThemeToggle}
              />
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <Button variant="ghost" onClick={handleReset}>
            Сбросить
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Сохранить
          </Button>
        </footer>
      </aside>
    </>
  );
}
