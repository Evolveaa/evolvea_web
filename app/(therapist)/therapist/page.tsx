import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { getSessionProfile } from "@/lib/data/user";
import { getFamilies, type FamilyOverview } from "@/lib/data/therapist";
import { accessState } from "@/lib/billing";

const STATE_HUE: Record<string, string> = {
  active: "hue-green",
  trial: "hue-sky",
  expired: "hue-amber",
  canceled: "hue-rose",
  none: "hue-navy",
};

/** A family lands in triage when the data says the therapist should act. */
function needsAttention(f: FamilyOverview): boolean {
  return (
    f.unread > 0 ||
    f.engagement === "silent" ||
    f.engagement === "slowed" ||
    (f.weeklyTarget > 0 && f.sessionsWeek < Math.ceil(f.weeklyTarget / 2) && f.engagement !== "fresh")
  );
}

export default async function TherapistDashboard() {
  const t = await getTranslations("therapist");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const session = await getSessionProfile();
  if (!session) return null;

  const families = await getFamilies(session.profile.id);
  const activeWeek = families.filter((f) => f.sessionsWeek > 0).length;
  const unreadTotal = families.reduce((n, f) => n + f.unread, 0);

  // families with no session in the 30-day window sort as most-quiet, not least
  const quietDays = (f: FamilyOverview) =>
    f.daysSinceLast ?? (f.engagement === "fresh" ? -1 : 9999);
  const attention = families
    .filter(needsAttention)
    .sort((a, b) => quietDays(b) - quietDays(a) || b.unread - a.unread);
  const calm = families.filter((f) => !needsAttention(f));

  const renderRow = (f: FamilyOverview, triage: boolean) => {
    const state = accessState(f.subscription);
    const behindPlan =
      f.weeklyTarget > 0 && f.sessionsWeek < Math.ceil(f.weeklyTarget / 2) && f.engagement !== "fresh";
    return (
      <li key={f.child.id}>
        <Link href={`/therapist/families/${f.child.id}`} className="row-item" data-triage={triage ? f.engagement : undefined}>
          <span className="row-ico" aria-hidden="true">
            {f.child.avatar}
          </span>
          <span className="row-body">
            <span className="row-title">
              {f.child.first_name}
              {f.child.birth_year
                ? ` · ${tc("ageYears", { age: new Date().getFullYear() - f.child.birth_year })}`
                : ""}
              {f.unread > 0 && (
                <span className="badge-count" style={{ marginLeft: "0.5rem" }}>
                  {f.unread}
                </span>
              )}
            </span>
            <span className="row-sub">
              {f.parentName} ·{" "}
              {f.lastSessionAt
                ? t("lastActivity", {
                    date: format.relativeTime(new Date(f.lastSessionAt)),
                  })
                : f.engagement === "fresh"
                  ? t("noActivityYet")
                  : t("noRecentActivity")}
            </span>
            {triage && (
              <span className="row-flags">
                {f.engagement === "silent" && (
                  <span className="flag flag-alert">
                    {f.daysSinceLast === null
                      ? t("flags.quiet30")
                      : t("flags.silentDays", { days: f.daysSinceLast })}
                  </span>
                )}
                {f.engagement === "slowed" && (
                  <span className="flag flag-warn">{t("flags.slowed")}</span>
                )}
                {behindPlan && f.engagement !== "silent" && (
                  <span className="flag flag-warn">{t("flags.behindPlan")}</span>
                )}
                {f.unread > 0 && <span className="flag flag-info">{t("flags.unread")}</span>}
              </span>
            )}
          </span>
          <span className="row-end">
            <span className={`chip chip-hue ${STATE_HUE[state]}`}>
              {t(`subState.${state}`)}
            </span>
            <div style={{ marginTop: 4 }}>
              {f.weeklyTarget > 0
                ? t("weekAdherence", { done: f.sessionsWeek, target: f.weeklyTarget })
                : t("weekSessions", { count: f.sessionsWeek })}
            </div>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-h">{t("dashTitle")}</h1>
          <p className="page-sub">{t("dashLead", { name: session.profile.full_name })}</p>
        </div>
        <Link href="/therapist/invites" className="btn btn-primary btn-sm">
          ＋ {t("newInvite")}
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: "1.4rem" }}>
        <div className="stat">
          <b>{families.length}</b>
          <span>{t("statFamilies")}</span>
        </div>
        <div className="stat">
          <b>{activeWeek}</b>
          <span>{t("statActiveWeek")}</span>
        </div>
        <div className="stat">
          <b>{unreadTotal}</b>
          <span>{t("statUnread", { count: unreadTotal })}</span>
        </div>
        <div className="stat" data-tone={attention.length > 0 ? "warn" : "ok"}>
          <b>{attention.length}</b>
          <span>{t("statAttention")}</span>
        </div>
      </div>

      {families.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">👪</span>
          <b>{t("noFamiliesTitle")}</b>
          <p>{t("noFamiliesLead")}</p>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/therapist/invites" className="btn btn-primary btn-sm">
              {t("newInvite")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {attention.length > 0 && (
            <>
              <p className="section-label section-label-warn">
                {t("attentionTitle", { count: attention.length })}
              </p>
              <ul className="row-list row-grid" style={{ marginBottom: "1.4rem" }}>
                {attention.map((f) => renderRow(f, true))}
              </ul>
            </>
          )}
          {calm.length > 0 && (
            <>
              {attention.length > 0 && (
                <p className="section-label">{t("calmTitle")}</p>
              )}
              <ul className="row-list row-grid">{calm.map((f) => renderRow(f, false))}</ul>
            </>
          )}
        </>
      )}
    </>
  );
}
