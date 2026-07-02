import { getTranslations } from "next-intl/server";
import AppShell from "@/components/app/AppShell";
import { requireRole } from "@/lib/data/user";
import { getUnreadCount } from "@/lib/data/unread";

export default async function TherapistLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireRole("therapist");
  const t = await getTranslations("shell");
  const unread = await getUnreadCount(profile.id);

  return (
    <AppShell
      profile={profile}
      home="/therapist"
      wide
      tabsLabel={t("navLabel")}
      tabs={[
        {
          href: "/therapist",
          label: t("tabs.families"),
          icon: "👪",
          also: ["/therapist/families"],
          badge: unread,
        },
        { href: "/therapist/library", label: t("tabs.library"), icon: "📚" },
        { href: "/therapist/invites", label: t("tabs.invites"), icon: "✉️" },
        { href: "/therapist/referrals", label: t("tabs.referrals"), icon: "🤝" },
      ]}
    >
      {children}
    </AppShell>
  );
}
