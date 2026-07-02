import { getTranslations } from "next-intl/server";
import AppShell from "@/components/app/AppShell";
import { requireRole } from "@/lib/data/user";
import { getUnreadCount } from "@/lib/data/unread";

export default async function ParentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole("parent");
  const t = await getTranslations("shell");
  const unread = await getUnreadCount(profile.id);

  return (
    <AppShell
      profile={profile}
      home="/app"
      tabsLabel={t("navLabel")}
      tabs={[
        { href: "/app", label: t("tabs.today"), icon: "🏠" },
        { href: "/app/plan", label: t("tabs.plan"), icon: "🗺️" },
        { href: "/app/progress", label: t("tabs.progress"), icon: "📈" },
        { href: "/app/messages", label: t("tabs.messages"), icon: "💬", badge: unread },
      ]}
    >
      {children}
    </AppShell>
  );
}
