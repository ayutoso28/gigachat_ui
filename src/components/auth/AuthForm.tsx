import { useState } from "react";
import type { AuthState, Scope } from "../../types";
import { validateCredentials } from "../../api/auth";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { SparkleIcon } from "../ui/icons";
import styles from "./AuthForm.module.css";

interface AuthFormProps {
  onSubmit: (auth: AuthState) => void;
}

const SCOPE_OPTIONS: { value: Scope; label: string; hint: string }[] = [
  {
    value: "GIGACHAT_API_PERS",
    label: "GIGACHAT_API_PERS",
    hint: "Физические лица",
  },
  {
    value: "GIGACHAT_API_B2B",
    label: "GIGACHAT_API_B2B",
    hint: "Юридические лица",
  },
  {
    value: "GIGACHAT_API_CORP",
    label: "GIGACHAT_API_CORP",
    hint: "Корпоративный доступ",
  },
];

export function AuthForm({ onSubmit }: AuthFormProps) {
  const [credentials, setCredentials] = useState("");
  const [scope, setScope] = useState<Scope>("GIGACHAT_API_PERS");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.trim()) {
      setError("Введите Authorization Key, чтобы продолжить.");
      return;
    }
    const auth: AuthState = { credentials: credentials.trim(), scope };
    setError(null);
    setIsSubmitting(true);
    try {
      await validateCredentials(auth);
      onSubmit(auth);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось проверить ключ.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <SparkleIcon width={22} height={22} />
          </div>
          <h1 className={styles.title}>Вход в GigaChat</h1>
          <p className={styles.subtitle}>
            Введите Authorization Key и выберите область доступа, чтобы начать
            работу.
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-credentials">
            Authorization Key
          </label>
          <input
            id="auth-credentials"
            type="password"
            className={styles.input}
            value={credentials}
            onChange={(e) => {
              setCredentials(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Base64-строка из личного кабинета"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "auth-error" : undefined}
          />
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.label}>Scope</legend>
          <div className={styles.radioGroup}>
            {SCOPE_OPTIONS.map((opt) => {
              const checked = scope === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`${styles.radio} ${checked ? styles.radioChecked : ""}`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setScope(opt.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioDot} aria-hidden="true" />
                  <span className={styles.radioLabel}>
                    <span className={styles.radioTitle}>{opt.label}</span>
                    <span className={styles.radioHint}>{opt.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <div id="auth-error">
            <ErrorMessage message={error} />
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? "Проверяем ключ…" : "Войти"}
        </Button>

        <p className={styles.note}>
          Ключ используется только для получения токена доступа и хранится в
          памяти вкладки.
        </p>
      </form>
    </div>
  );
}
