"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconChart,
  IconChat,
  IconHandshake,
  IconHome,
  IconLibrary,
  IconMail,
  IconUsers,
} from "@/components/icons";

const TAB_ICONS = {
  home: IconHome,
  plan: IconCalendar,
  progress: IconChart,
  messages: IconChat,
  families: IconUsers,
  library: IconLibrary,
  invites: IconMail,
  referrals: IconHandshake,
} as const;

export interface TabItem {
  href: string;
  label: string;
  icon: keyof typeof TAB_ICONS;
  /** Extra path prefixes that keep this tab highlighted. */
  also?: string[];
  badge?: number;
}

/** Bottom tab bar on mobile, top tab row on ≥720px. */
export default function AppTabs({ tabs, label }: { tabs: TabItem[]; label: string }) {
  const pathname = usePathname();

  function isActive(tab: TabItem) {
    if (pathname === tab.href) return true;
    const prefixes = [...(tab.also ?? [])];
    // nested pages under a non-root tab keep it active
    if (tab.href.split("/").filter(Boolean).length > 1) prefixes.push(tab.href);
    return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }

  return (
    <nav className="app-tabs" aria-label={label}>
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.icon];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="app-tab"
            aria-current={isActive(tab) ? "page" : undefined}
          >
            <span className="tab-ico" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="tab-dot" aria-label={`${tab.badge}`} />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
