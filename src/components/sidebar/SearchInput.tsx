import { SearchIcon } from "../ui/icons";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск по чатам",
}: SearchInputProps) {
  return (
    <div className={styles.wrapper}>
      <SearchIcon className={styles.icon} width={16} height={16} />
      <input
        type="search"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск по чатам"
      />
    </div>
  );
}
