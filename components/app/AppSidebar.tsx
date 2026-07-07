"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/app/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { TAB_ICONS, tabIsActive, type TabItem } from "@/components/app/AppTabs";

function SideLinkBody({
  Icon,
  label,
  badge,
}: {
  Icon: (typeof TAB_ICONS)[keyof typeof TAB_ICONS];
  label: string;
  badge?: number;
}) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span className="side-ico" aria-hidden="true">
        {pending ? <span className="spinner" /> : <Icon size={20} />}
      </span>
      <span className="side-label">{label}</span>
      {badge ? <span className="side-badge">{badge}</span> : null}
    </>
  );
}

/** Desktop-only left navigation rail. The mobile equivalent stays <AppTabs>. */
export default function AppSidebar({
  home,
  tabs,
  label,
  userName,
}: {
  home: string;
  tabs: TabItem[];
  label: string;
  userName: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="app-sidebar" aria-label={label}>
      <Link href={home} className="side-brand" aria-label="Evolvea">
        <span className="brand-dot" aria-hidden="true" />
        Evolvea
      </Link>

      <nav className="side-nav">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="side-link"
            aria-current={tabIsActive(tab, pathname) ? "page" : undefined}
          >
            <SideLinkBody Icon={TAB_ICONS[tab.icon]} label={tab.label} badge={tab.badge} />
          </Link>
        ))}
      </nav>

      <div className="side-foot">
        <div className="side-user">
          <span className="side-avatar" aria-hidden="true">
            {userName.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="side-user-name">{userName}</span>
        </div>
        <div className="side-foot-row">
          <LanguageSwitcher />
          <ThemeToggle />
          <SignOutButton />
        </div>
        <p className="side-quote">Vytvorené s láskou pre naše deti.</p>
      </div>
    </aside>
  );
}
