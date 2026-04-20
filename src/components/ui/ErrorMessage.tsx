import { AlertIcon } from "./icons";
import styles from "./ErrorMessage.module.css";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div role="alert" className={`${styles.banner} ${className}`}>
      <AlertIcon className={styles.icon} />
      <span className={styles.text}>{message}</span>
    </div>
  );
}
