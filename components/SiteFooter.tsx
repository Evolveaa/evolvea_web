import { getTranslations } from "next-intl/server";

/** Site footer (dark). */
export default async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <a href="#top" className="brand">
          <span className="brand-dot brand-dot-light" aria-hidden="true" />
          <span className="brand-name">Evolvea</span>
        </a>
        <small>{t("text")}</small>
      </div>
    </footer>
  );
}
