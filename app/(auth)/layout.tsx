import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import "@/styles/app.css";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="auth-wrap">
      <header className="auth-top">
        <Link href="/" className="brand" aria-label="Evolvea">
          <span className="brand-dot" aria-hidden="true" />
          Evolvea
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="auth-main">{children}</main>
    </div>
  );
}
