import styles from './GenZLogo.module.css';

interface GenZLogoProps {
  fontSize?: number; // px, defaults to 52
  className?: string;
}

const LETTERS = [
  { char: 'G', bounceDelay: 0, hueDelay: 0 },
  { char: 'e', bounceDelay: 0.1, hueDelay: 0.3 },
  { char: 'n', bounceDelay: 0.2, hueDelay: 0.6 },
  { char: '-', bounceDelay: 0.3, hueDelay: 0.9 },
  { char: 'Z', bounceDelay: 0.4, hueDelay: 1.2 },
];

export default function GenZLogo({ fontSize = 52, className = '' }: GenZLogoProps) {
  return (
    <span
      className={`${styles.wrapper} ${className}`}
      style={{ fontSize: `${fontSize}px` }}
      aria-label="Gen-Z"
    >
      {LETTERS.map(({ char, bounceDelay, hueDelay }, i) => (
        <span
          key={i}
          className={styles.letter}
          style={{
            animationDelay: `${bounceDelay}s, ${hueDelay}s`,
          }}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
    </span>
  );
}
