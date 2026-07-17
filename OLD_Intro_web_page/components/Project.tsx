import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

/** The three role icons, kept in code and paired with translated copy by index. */
const ICONS: ReactNode[] = [
  <svg
    key="logopedists"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>,
  <svg
    key="parents"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  <svg
    key="children"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>,
];

/** Section 3 · About the project (light). */
export default async function Project() {
  const t = await getTranslations("project");
  const cards = t.raw("cards") as { title: string; body: string }[];

  return (
    <section className="project" id="project">
      <div className="container">
        <span className="eyebrow info-eyebrow">
          <span className="dot" /> {t("eyebrow")}
        </span>
        <h2 className="sec-title">{t("title")}</h2>
        <p className="project-lead">{t("lead1")}</p>
        <p className="project-lead">{t.rich("lead2", { b: (c) => <b>{c}</b> })}</p>

        <div className="who-grid">
          {cards.map((card, i) => (
            <div className="who-card" key={i}>
              <h3>
                <span className="who-ico" aria-hidden="true">
                  {ICONS[i]}
                </span>{" "}
                {card.title}
              </h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
