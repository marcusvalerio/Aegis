import clsx from "clsx";

/**
 * Placeholder equipment illustrations, standing in for the real product
 * photography referenced in the brief. They live behind the same prop
 * (`typeKey`) that a real <img src={forklift.imageUrl}> would use, so
 * swapping in real photos later means changing this component only.
 */
export function ForkliftGraphic({
  typeKey,
  className,
}: {
  typeKey: string;
  className?: string;
}) {
  const common = "w-full h-full";
  switch (typeKey) {
    case "CONTRABALANCADA":
      return (
        <svg viewBox="0 0 200 140" className={clsx(common, className)} fill="none">
          <rect x="10" y="95" width="200" height="4" fill="#1F1F1B" opacity="0.15" />
          <rect x="70" y="55" width="60" height="45" fill="#1F1F1B" />
          <rect x="78" y="30" width="44" height="28" fill="#1F1F1B" />
          <rect x="130" y="20" width="6" height="80" fill="#1F1F1B" />
          <rect x="150" y="20" width="6" height="80" fill="#1F1F1B" />
          <rect x="136" y="85" width="50" height="6" fill="#FFFB26" />
          <rect x="136" y="70" width="50" height="6" fill="#FFFB26" />
          <circle cx="90" cy="105" r="14" fill="#1F1F1B" />
          <circle cx="90" cy="105" r="5" fill="#E9E6D4" />
          <circle cx="150" cy="105" r="10" fill="#1F1F1B" />
          <circle cx="150" cy="105" r="4" fill="#E9E6D4" />
          <rect x="40" y="65" width="30" height="12" fill="#FF5837" />
        </svg>
      );
    case "RETRATIL":
      return (
        <svg viewBox="0 0 200 140" className={clsx(common, className)} fill="none">
          <rect x="10" y="95" width="180" height="4" fill="#1F1F1B" opacity="0.15" />
          <rect x="60" y="50" width="50" height="50" fill="#1F1F1B" />
          <rect x="70" y="25" width="30" height="30" fill="#1F1F1B" />
          <rect x="115" y="10" width="5" height="95" fill="#1F1F1B" />
          <rect x="130" y="10" width="5" height="95" fill="#1F1F1B" />
          <rect x="140" y="50" width="45" height="6" fill="#8BFF81" />
          <circle cx="80" cy="105" r="12" fill="#1F1F1B" />
          <circle cx="80" cy="105" r="4" fill="#E9E6D4" />
          <circle cx="130" cy="105" r="9" fill="#1F1F1B" />
        </svg>
      );
    case "PALETEIRA_ELETRICA":
      return (
        <svg viewBox="0 0 200 140" className={clsx(common, className)} fill="none">
          <rect x="20" y="100" width="150" height="4" fill="#1F1F1B" opacity="0.15" />
          <rect x="30" y="60" width="45" height="40" fill="#1F1F1B" />
          <rect x="75" y="88" width="90" height="8" fill="#8BFF81" />
          <rect x="150" y="45" width="25" height="45" fill="#1F1F1B" />
          <circle cx="45" cy="105" r="8" fill="#1F1F1B" />
          <circle cx="160" cy="105" r="8" fill="#1F1F1B" />
          <circle cx="90" cy="105" r="6" fill="#1F1F1B" />
          <circle cx="150" cy="105" r="6" fill="#1F1F1B" />
        </svg>
      );
    case "PALETEIRA_MANUAL":
    default:
      return (
        <svg viewBox="0 0 200 140" className={clsx(common, className)} fill="none">
          <rect x="20" y="100" width="130" height="4" fill="#1F1F1B" opacity="0.15" />
          <rect x="70" y="90" width="80" height="8" fill="#1F1F1B" />
          <rect x="30" y="40" width="8" height="60" fill="#1F1F1B" />
          <rect x="20" y="35" width="26" height="8" fill="#1F1F1B" />
          <circle cx="80" cy="105" r="6" fill="#1F1F1B" />
          <circle cx="140" cy="105" r="6" fill="#1F1F1B" />
        </svg>
      );
  }
}
