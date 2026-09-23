import { getTranslations } from "next-intl/server";

/** Section 4 · Why it works (light). */
export default async function Info() {
  const t = await getTranslations("info");
  const cards = t.raw("cards") as { title: string; body: string }[];

  return (
    <section className="info" id="info">
      <div className="container">
        <span className="eyebrow info-eyebrow">
          <span className="dot" /> {t("eyebrow")}
        </span>
        <h2 className="sec-title sec-title-tight">{t("title")}</h2>
        <div className="info-grid">
          {cards.map((card, i) => (
            <div className="info-card" key={i}>
              <span className="info-no">{String(i + 1).padStart(2, "0")}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
