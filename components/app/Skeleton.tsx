import { getTranslations } from "next-intl/server";

/**
 * Loading skeletons shown instantly on navigation (via route loading.tsx).
 * They render client-side the moment a link is clicked — zero data fetching,
 * zero DB reads — while the destination server component streams in.
 *
 * Shapes mirror the real layout so the swap to content feels seamless.
 */

function Line({ w = "100%", h = 14, mt }: { w?: string | number; h?: number; mt?: number }) {
  return <span className="sk sk-line" style={{ width: w, height: h, marginTop: mt }} aria-hidden="true" />;
}

function Rows({ n = 3 }: { n?: number }) {
  return (
    <div className="sk-rows" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="sk-row">
          <span className="sk sk-tile" />
          <span className="sk-row-body">
            <Line w="55%" />
            <Line w="38%" h={10} mt={8} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Live-region wrapper so screen readers announce the load. */
async function Frame({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      {children}
    </div>
  );
}

/** Parent screens (home / plan / progress / messages). */
export async function ParentSkeleton() {
  return (
    <Frame>
      <Line w="55%" h={26} />
      <Line w="35%" h={12} mt={10} />
      <div className="sk sk-hero" aria-hidden="true" />
      <Line w="28%" h={11} mt={4} />
      <div style={{ marginTop: "0.9rem" }}>
        <Rows n={3} />
      </div>
    </Frame>
  );
}

/** Therapist screens (dashboard / family detail / library). */
export async function TherapistSkeleton() {
  return (
    <Frame>
      <Line w="40%" h={26} />
      <Line w="60%" h={12} mt={10} />
      <div className="sk-stat-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="sk sk-stat" />
        ))}
      </div>
      <Rows n={4} />
    </Frame>
  );
}

/** Full-screen exercise player. */
export async function PlayerSkeleton() {
  const t = await getTranslations("common");
  return (
    <div className="player-wrap" role="status" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      <div className="player-top">
        <span className="sk" style={{ width: 44, height: 44, borderRadius: "50%" }} aria-hidden="true" />
      </div>
      <div className="sk-player" aria-hidden="true">
        <span className="sk sk-player-tile" />
        <span className="sk sk-line" style={{ width: "60%", height: 22 }} />
        <span className="sk sk-line" style={{ width: "40%", height: 12 }} />
        <span className="sk sk-player-card" />
        <span className="sk sk-player-btn" />
      </div>
    </div>
  );
}
