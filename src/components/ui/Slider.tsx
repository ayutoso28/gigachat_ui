import styles from "./Slider.module.css";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  formatValue,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <label className={styles.label}>{label}</label>
        <span className={styles.value}>{displayValue}</span>
      </div>
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--percent" as string]: `${percent}%` }}
      />
    </div>
  );
}
