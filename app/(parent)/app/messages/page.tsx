import Link from "next/link";
import { getTranslations } from "next-intl/server";
import MessageThread from "@/components/app/MessageThread";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import { IconCalendar, IconChart, IconClock } from "@/components/icons";
import { getActiveChild } from "@/lib/data/parent";
import { getThread } from "@/lib/data/messages";
import { getSessionProfile } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const t = await getTranslations("parent");
  const session = await getSessionProfile();
  const { child } = await getActiveChild();

  if (!child || !session) {
    return (
      <>
        <h1 className="page-h">{t("messagesTitle")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const supabase = await createClient();
  const [messages, { data: therapist }] = await Promise.all([
    getThread(child.id),
    child.therapist_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", child.therapist_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const hasUnread = messages.some((m) => m.read_at === null && m.sender_id !== session.profile.id);
  const therapistName = therapist?.full_name ?? null;
  const initial = therapistName?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <h1 className="page-h">{t("messagesTitle")}</h1>
      <p className="page-sub">
        {therapistName ? t("messagesLead", { name: therapistName }) : t("messagesLeadNoTherapist")}
      </p>

      <div className="pane">
        <div className="chat-panel">
          {therapistName && (
            <div className="chat-panel-head">
              <span className="info-avatar" aria-hidden="true">
                {initial}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="info-name">{therapistName}</span>
                <span className="info-role">{t("yourTherapist")}</span>
              </span>
              <span className="chip chip-hue hue-green" style={{ fontSize: "0.72rem" }}>
                <IconClock size={13} /> 24 h
              </span>
            </div>
          )}
          <div className="chat-panel-body">
            <MessageThread
              childId={child.id}
              myId={session.profile.id}
              messages={messages}
              hasUnread={hasUnread}
            />
          </div>
        </div>

        <aside className="pane-rail">
          <div className="info-card">
            <ul className="info-list">
              <li className="info-row">
                <IconClock size={16} />
                {t("responseWindow")}
              </li>
            </ul>
            <p className="info-role" style={{ marginTop: "0.7rem", lineHeight: 1.55 }}>
              {t("messagesRailNote")}
            </p>
          </div>
          <div className="info-card">
            <span className="section-label" style={{ margin: "0 0 0.6rem" }}>
              {t("quickLinks")}
            </span>
            <ul className="info-list">
              <li className="info-row">
                <IconCalendar size={16} />
                <Link href="/app/plan" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                  {t("openPlan")}
                </Link>
              </li>
              <li className="info-row">
                <IconChart size={16} />
                <Link href="/app/progress" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                  {t("openProgress")}
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
