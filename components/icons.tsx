import type { ExerciseDomain } from "@/lib/exercises/types";

/**
 * Hand-drawn SVG icon system — one consistent 24×24 grid, 2px rounded
 * strokes, so the app never leans on emoji for chrome. Emoji stay where
 * they are content (exercise items, child avatars).
 */

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function Svg({
  children,
  size = 20,
  strokeWidth = 2,
  className,
  filled = false,
}: IconProps & { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/* ---------------- navigation + system ---------------- */

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11.2 12 4l8 7.2" />
    <path d="M6.5 9.8V20h11V9.8" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
    <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
    <circle cx="9" cy="15" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 20v-5M12 20V9.5M18.5 20V4.5" />
    <path d="M3 20h18" opacity="0.35" />
  </Svg>
);

export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12.5a4 4 0 0 1-4 4H10l-5.5 4v-13a4 4 0 0 1 4-4H17a4 4 0 0 1 4 4z" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" opacity="0.35" />
    <circle cx="9" cy="7" r="2.2" />
    <circle cx="15" cy="12" r="2.2" />
    <circle cx="8" cy="17" r="2.2" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <circle cx="16.5" cy="9.5" r="2.6" />
    <path d="M16.5 14.6c2.5 0 4.5 1.7 4.5 4.4" />
  </Svg>
);

export const IconLibrary = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.2C10.3 4.8 7.9 4.3 4 4.3v14.5c3.9 0 6.3.5 8 1.9 1.7-1.4 4.1-1.9 8-1.9V4.3c-3.9 0-6.3.5-8 1.9z" />
    <path d="M12 6.2v14.5" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="14" rx="2.5" />
    <path d="m4 8 8 5.5L20 8" />
  </Svg>
);

export const IconHandshake = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17.5 4 14.5a8 8 0 0 1 8-8 8 8 0 0 1 8 8l-3 3" />
    <path d="M12 12.5 9.5 15a1.8 1.8 0 0 0 2.5 2.5l.8-.8" />
    <path d="m12.8 16.7 1 1a1.8 1.8 0 0 0 2.6-2.6l-2.9-2.6" />
  </Svg>
);

export const IconFlame = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M12 2.5c.5 3.6 3.2 5.4 4.7 7.8 1.4 2.3 1.5 5.3-.3 7.6A6.9 6.9 0 0 1 5 13.7c0-2 1-3.7 2.3-5.2.3 1.4 1 2.3 2 2.7-.5-2.7.6-6.5 2.7-8.7z" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p} strokeWidth={p.strokeWidth ?? 2.6}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconPlay = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M8.5 5.8c0-1 1.1-1.6 2-1.1l9 5.7c.8.5.8 1.7 0 2.2l-9 5.7c-.9.6-2-.1-2-1.1z" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2.5" />
  </Svg>
);

export const IconStar = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M12 2.8l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M12 2.5c.5 3.7 1.3 4.5 5 5-3.7.5-4.5 1.3-5 5-.5-3.7-1.3-4.5-5-5 3.7-.5 4.5-1.3 5-5z" />
    <path d="M19 13.5c.3 1.8.7 2.2 2.5 2.5-1.8.3-2.2.7-2.5 2.5-.3-1.8-.7-2.2-2.5-2.5 1.8-.3 2.2-.7 2.5-2.5z" />
  </Svg>
);

/* ---------------- domain glyphs ---------------- */

const DOMAIN_GLYPHS: Record<ExerciseDomain, React.ReactNode> = {
  // sound equalizer wave
  phonemic_awareness: (
    <>
      <path d="M4 10.5v3M8 7.5v9M12 4.5v15M16 7.5v9M20 10.5v3" />
    </>
  ),
  // two pexeso cards
  working_memory: (
    <>
      <rect x="3.5" y="8" width="9.5" height="12.5" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H16" />
      <circle cx="8.2" cy="14.2" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  // target
  attention: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  // open book
  narrative: (
    <>
      <path d="M12 6.2C10.3 4.8 7.9 4.3 4 4.3v14.5c3.9 0 6.3.5 8 1.9 1.7-1.4 4.1-1.9 8-1.9V4.3c-3.9 0-6.3.5-8 1.9z" />
      <path d="M12 6.2v14.5" />
    </>
  ),
  // chat bubble with dots
  vocabulary: (
    <>
      <path d="M21 11.5a4 4 0 0 1-4 4H10l-5.5 4v-12a4 4 0 0 1 4-4H17a4 4 0 0 1 4 4z" />
      <circle cx="9" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  // speaker with sound arcs
  articulation: (
    <>
      <path d="M3.5 10v4a1 1 0 0 0 1 1h2.2l4.8 3.8V5.2L6.7 9H4.5a1 1 0 0 0-1 1z" />
      <path d="M15 9.5a3.6 3.6 0 0 1 0 5M18 7a7.2 7.2 0 0 1 0 10" />
    </>
  ),
  // heart (parent–child bond)
  guided: (
    <>
      <path d="M12 20.3C7.2 16.2 3.6 13 3.6 9.3 3.6 6.8 5.6 5 8 5c1.6 0 3 .8 4 2.2C13 5.8 14.4 5 16 5c2.4 0 4.4 1.8 4.4 4.3 0 3.7-3.6 6.9-8.4 11z" />
    </>
  ),
};

export function DomainGlyph({
  domain,
  size = 20,
  strokeWidth = 2,
  className,
}: IconProps & { domain: ExerciseDomain }) {
  return (
    <Svg size={size} strokeWidth={strokeWidth} className={className}>
      {DOMAIN_GLYPHS[domain]}
    </Svg>
  );
}

/** Rounded gradient tile with a white domain glyph — the app's domain marker. */
export function DomainTile({
  domain,
  size = 44,
  className,
}: {
  domain: ExerciseDomain;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`domain-tile tile-${domain} ${className ?? ""}`}
      style={{ width: size, height: size, borderRadius: Math.max(10, size * 0.3) }}
      aria-hidden="true"
    >
      <DomainGlyph domain={domain} size={Math.round(size * 0.55)} strokeWidth={2.1} />
    </span>
  );
}

/* ---------------- circular progress ring ---------------- */

/**
 * Circular progress ring. Warm, glowing arc on a soft brand-tinted track — so
 * even a fresh 0 % week reads as "ready to begin", never a dead grey gauge.
 * `tone` recolours the arc for contextual meters (e.g. success rate).
 */
export function ProgressRing({
  value,
  max,
  size = 92,
  stroke = 9,
  label,
  sub,
  tone = "brand",
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
  tone?: "brand" | "good" | "mid" | "low";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const grad = `ringGrad-${tone}`;
  const stops: Record<string, [string, string, string]> = {
    brand: ["#9fd0f2", "#5b9fd6", "#3f7fc4"],
    good: ["#7fd6a3", "#43b57e", "#2e9d63"],
    mid: ["#f6cf78", "#eea94a", "#e08c2f"],
    low: ["#f2a98f", "#e8795a", "#d95f3c"],
  };
  const [s0, s1, s2] = stops[tone];
  return (
    <span className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={grad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={s0} />
            <stop offset="55%" stopColor={s1} />
            <stop offset="100%" stopColor={s2} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${grad})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          /* keep a hair of arc even at 0 so the cap shows as a friendly seed */
          strokeDashoffset={c * (1 - Math.max(pct, pct === 0 && max > 0 ? 0.012 : 0))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-arc"
        />
      </svg>
      <span className="ring-center">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  );
}

/**
 * Tiny trend line for a scored series (percentages, oldest→newest). Domain-hued
 * via currentColor, with a soft area wash and a bright cap on the latest point.
 * Honest scale: a ≥24-pt window so small wobble doesn't masquerade as a cliff.
 */
export function Sparkline({
  values,
  domain,
  width = 116,
  height = 36,
}: {
  values: number[];
  domain: ExerciseDomain;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = (min + max) / 2;
  const lo = Math.min(min, mid - 12);
  const hi = Math.max(max, mid + 12);
  const span = hi - lo || 1;
  const n = values.length;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (n - 1);
  const y = (v: number) => pad + (1 - (v - lo) / span) * (height - 2 * pad);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `M ${x(0).toFixed(1)},${height - pad} L ${pts.join(" L ")} L ${x(
    n - 1,
  ).toFixed(1)},${height - pad} Z`;
  const lastX = x(n - 1);
  const lastY = y(values[n - 1]);
  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ color: `var(--domain-${domain}-2)` }}
    >
      <path d={area} className="spark-area" />
      <path d={line} className="spark-line" />
      <circle cx={lastX} cy={lastY} r={3.4} className="spark-halo" />
      <circle cx={lastX} cy={lastY} r={2.2} className="spark-dot" />
    </svg>
  );
}

/** Signed trend chip: ▲ up (green), ▼ down (soft red), flat = "stable". */
export function TrendPill({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const dir = delta > 1 ? "up" : delta < -1 ? "down" : "flat";
  return (
    <span className="trend-pill" data-dir={dir}>
      <svg width={11} height={11} viewBox="0 0 12 12" aria-hidden="true">
        {dir === "up" && <path d="M6 2.5 10 8H2z" fill="currentColor" />}
        {dir === "down" && <path d="M6 9.5 2 4h8z" fill="currentColor" />}
        {dir === "flat" && <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      </svg>
      {dir === "flat" ? "" : Math.abs(delta)}
    </span>
  );
}
