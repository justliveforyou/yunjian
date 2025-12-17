export function YunJianLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="104" height="104" rx="22" fill="#22C55E" />
      <path
        d="M36 50C36 44.477 40.477 40 46 40C47.126 40 48.21 40.168 49.228 40.48C51.486 35.584 56.382 32 62 32C69.18 32 75.078 37.328 75.876 44.26C76.246 44.178 76.618 44.134 77 44.134C81.418 44.134 85 47.716 85 52.134C85 56.552 81.418 60.134 77 60.134H46C40.477 60.134 36 55.657 36 50.134V50Z"
        fill="white"
        opacity="0.9"
      />
      <rect x="38" y="56" width="44" height="38" rx="3" fill="white" opacity="0.95" />
      <line x1="46" y1="68" x2="74" y2="68" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="46" y1="78" x2="68" y2="78" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <line x1="46" y1="88" x2="62" y2="88" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}
