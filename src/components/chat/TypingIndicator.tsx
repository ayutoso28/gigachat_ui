import styles from "./TypingIndicator.module.css";

interface TypingIndicatorProps {
  isVisible?: boolean;
}

export function TypingIndicator({ isVisible = true }: TypingIndicatorProps) {
  if (!isVisible) return null;
  return (
    <div className={styles.wrapper} aria-live="polite" aria-label="Ассистент печатает">
      <div className={styles.avatar} aria-hidden="true">
        <span className={styles.avatarGlyph}>G</span>
      </div>
      <div className={styles.bubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
