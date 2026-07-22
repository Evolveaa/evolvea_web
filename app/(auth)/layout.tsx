import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import AuthOrb from "@/components/auth/AuthOrb";
import { IconCheck } from "@/components/icons";
import "@/styles/app.css";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations("auth");
  const tf = await getTranslations("footer");
  const points = [t("heroPoint1"), t("heroPoint2"), t("heroPoint3")];

  return (
    <div className="auth-shell">
      {/* Left brand panel — desktop only; a warm, reassuring first impression. */}
      <aside className="auth-brand" aria-hidden="true">
        <AuthOrb />
        <div className="auth-brand-head">
          <Link href="/" className="brand" aria-label="Evolvea" tabIndex={-1}>
            <span className="brand-dot" />
            Evolvea
          </Link>
        </div>
        <div className="auth-brand-body">
          <h2 className="auth-brand-title">{t("heroHeadline")}</h2>
          <ul className="auth-brand-points">
            {points.map((p) => (
              <li key={p}>
                <span className="auth-brand-tick">
                  <IconCheck size={15} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-brand-quote">{tf("quote")}</p>
      </aside>

      {/* Right panel — the form, with a compact header (brand + language). */}
      <main className="auth-panel">
        <header className="auth-panel-top">
          <Link href="/" className="brand auth-panel-brand" aria-label="Evolvea">
            <span className="brand-dot" aria-hidden="true" />
            Evolvea
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        <div className="auth-panel-main">{children}</div>
      </main>
    </div>
  );
}
