import { getTranslations } from "next-intl/server";

/** Section 1 · Hero (light) — the core promise. */
export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="hero" id="hero">
      <div className="container hero-inner">
        <span className="eyebrow">
          <span className="dot" /> {t("eyebrow")}
        </span>
        <h1 className="hero-title">{t("title")}</h1>
        <p className="hero-lead">{t("lead")}</p>
        <div className="hero-actions">
          <a href="#demo" className="btn btn-dark">
            {t("ctaDemo")}
          </a>
          <a href="#project" className="btn btn-text">
            {t("ctaProject")}
          </a>
        </div>
        <p className="hero-note">{t("note")}</p>
      </div>
    </section>
  );
}
