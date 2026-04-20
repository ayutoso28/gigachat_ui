import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  const inputId = id ?? `toggle-${label ?? "t"}`;
  return (
    <label htmlFor={inputId} className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.switch}>
        <input
          id={inputId}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
      </span>
    </label>
  );
}
