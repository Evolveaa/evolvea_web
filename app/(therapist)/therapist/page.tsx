import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { getSessionProfile } from "@/lib/data/user";
import { getFamilies } from "@/lib/data/therapist";
import { accessState, COMMISSION_PER_FAMILY_EUR } from "@/lib/billing";

const STATE_HUE: Record<string, string> = {
  active: "hue-green",
  trial: "hue-sky",
  expired: "hue-amber",
  canceled: "hue-rose",
  none: "hue-navy",
};

export default async function TherapistDashboard() {
  const t = await getTranslations("therapist");
  const format = await getFormatter();
  const session = await getSessionProfile();
  if (!session) return null;

  const families = await getFamilies(session.profile.id);
  const activeWeek = families.filter((f) => f.sessionsWeek > 0).length;
  const unreadTotal = families.reduce((n, f) => n + f.unread, 0);
  const paying = families.filter((f) => accessState(f.subscription) === "active").length;
  const commission = (paying * COMMISSION_PER_FAMILY_EUR).toFixed(2).replace(".", ",");

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
          <span>{t("statUnread")}</span>
        </div>
        <div className="stat">
          <b>{commission} €</b>
          <span>{t("statCommission")}</span>
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
        <ul className="row-list">
          {families.map((f) => {
            const state = accessState(f.subscription);
            return (
              <li key={f.child.id}>
                <Link href={`/therapist/families/${f.child.id}`} className="row-item">
                  <span className="row-ico" aria-hidden="true">
                    {f.child.avatar}
                  </span>
                  <span className="row-body">
                    <span className="row-title">
                      {f.child.first_name}
                      {f.child.birth_year ? ` · ${new Date().getFullYear() - f.child.birth_year} r.` : ""}
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
                        : t("noActivityYet")}
                    </span>
                  </span>
                  <span className="row-end">
                    <span className={`chip chip-hue ${STATE_HUE[state]}`}>
                      {t(`subState.${state}`)}
                    </span>
                    <div style={{ marginTop: 4 }}>
                      {t("weekSessions", { count: f.sessionsWeek })}
                    </div>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
