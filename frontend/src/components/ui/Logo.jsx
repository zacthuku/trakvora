const ORANGE = "#fe6a34";
const TEAL = "#4fdbcc";
const NAVY = "#041627";

export function LogoIcon({ size = 52, variant = "light" }) {
  const onDark = variant === "dark";
  const h = size * (74 / 62);

  const stroke        = onDark ? "white"                  : NAVY;
  const bodyFill      = onDark ? "rgba(255,255,255,0.10)" : "white";
  const chassisFill   = onDark ? "rgba(255,255,255,0.70)" : NAVY;
  const wheelOuter    = onDark ? "rgba(255,255,255,0.85)" : NAVY;
  const wheelInner    = onDark ? NAVY                     : "white";
  const windshield    = onDark ? "rgba(255,255,255,0.20)" : "#b2eee8";

  return (
    <svg width={size} height={h} viewBox="0 0 62 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Speed lines — always orange */}
      <line x1="1"  y1="16"   x2="11" y2="16"   stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1"  y1="21.5" x2="13" y2="21.5" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1"  y1="27"   x2="15" y2="27"   stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />

      {/* Location pin */}
      <path
        d="M31 67 C31 67 15 50 15 37 A16 16 0 0 1 47 37 C47 50 31 67 31 67 Z"
        fill={bodyFill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Orange centre dot — always orange */}
      <circle cx="31" cy="37" r="6.5" fill={ORANGE} />
      {/* Teal shadow — always teal */}
      <ellipse cx="31" cy="69.5" rx="7.5" ry="3" fill={TEAL} />

      {/* Truck cargo box */}
      <rect x="10" y="12" width="23" height="20" rx="1.5" fill={bodyFill} stroke={stroke} strokeWidth="2" />

      {/* Truck cab body */}
      <path d="M33 12 L33 32 L49 32 L49 21 L43 12 Z"
        fill={bodyFill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      {/* Teal cab roof strip — always teal */}
      <path d="M33 12 L43 12 L48 18 L33 18 Z"
        fill={TEAL} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Windshield */}
      <path d="M35 19 L43 19 L47 25 L35 25 Z" fill={windshield} opacity="0.9" />

      {/* Chassis rail */}
      <rect x="11" y="31" width="37" height="2.5" rx="1" fill={chassisFill} />

      {/* Rear wheel */}
      <circle cx="20" cy="36" r="5.5" fill={wheelOuter} />
      <circle cx="20" cy="36" r="2.5" fill={wheelInner} />
      {/* Front wheel */}
      <circle cx="39" cy="36" r="5.5" fill={wheelOuter} />
      <circle cx="39" cy="36" r="2.5" fill={wheelInner} />
    </svg>
  );
}

export function LogoFull({ iconSize = 44, variant = "light", className = "" }) {
  const trakColor = variant === "dark" ? "white" : NAVY;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={iconSize} variant={variant} />
      <span
        className="font-heading font-black tracking-tight leading-none select-none"
        style={{ fontSize: iconSize * 0.6 }}
      >
        <span style={{ color: trakColor }}>TRAK</span>
        <span style={{ color: ORANGE }}>VORA</span>
      </span>
    </div>
  );
}

export function LogoWordmark({ size = "2xl", variant = "light" }) {
  const sizeMap = { lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" };
  const trakColor = variant === "dark" ? "white" : NAVY;
  return (
    <span className={`font-heading font-black tracking-tight ${sizeMap[size] ?? "text-2xl"}`}>
      <span style={{ color: trakColor }}>TRAK</span>
      <span style={{ color: ORANGE }}>VORA</span>
    </span>
  );
}
