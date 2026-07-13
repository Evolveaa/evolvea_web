import { getTranslations } from "next-intl/server";
import { DOMAIN_METHOD, METHODOLOGY_SOURCES } from "@/lib/exercises/methodology";
import type { ExerciseDomain } from "@/lib/exercises/types";

/** Public methodology page — the sources every exercise is grounded in. */
export default async function MetodikaPage() {
  const t = await getTranslations("metodika");
  const td = await getTranslations("domains");
  const domains = Object.keys(DOMAIN_METHOD) as ExerciseDomain[];

  return (
    <>
      <h1 className="page-h">📚 {t("title")}</h1>
      <p className="page-sub">{t("lead")}</p>

      <h2 className="section-label" style={{ marginTop: "1.6rem" }}>
        {t("domainsTitle")}
      </h2>
      <div className="metho-grid">
        {domains.map((d) => (
          <div key={d} className="metho-card">
            <span className="metho-domain">{td(d)}</span>
            <p className="metho-work">{DOMAIN_METHOD[d].work}</p>
            <p className="metho-authors">{DOMAIN_METHOD[d].authors}</p>
          </div>
        ))}
      </div>

      <h2 className="section-label" style={{ marginTop: "2rem" }}>
        {t("sourcesTitle")}
      </h2>
      <ol className="src-list">
        {METHODOLOGY_SOURCES.map((s, i) => (
          <li key={i} className="src-item">
            <p className="src-work">
              <b>{s.authors}</b> — {s.work}
            </p>
            <p className="src-note">{s.note}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
