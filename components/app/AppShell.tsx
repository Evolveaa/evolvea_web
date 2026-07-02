import Link from "next/link";
import AppTabs, { type TabItem } from "@/components/app/AppTabs";
import SignOutButton from "@/components/app/SignOutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Profile } from "@/lib/data/user";
import "@/styles/app.css";

export default function AppShell({
  profile,
  home,
  tabs,
  tabsLabel,
  wide = false,
  children,
}: {
  profile: Profile;
  home: string;
  tabs: TabItem[];
  tabsLabel: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href={home} className="brand" aria-label="Evolvea">
            <span className="brand-dot" aria-hidden="true" />
            Evolvea
          </Link>
          <div className="app-header-actions">
            <LanguageSwitcher />
            <span className="app-user">{profile.full_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <AppTabs tabs={tabs} label={tabsLabel} />
      <main className={wide ? "app-main app-main-wide" : "app-main"}>{children}</main>
    </div>
  );
}
