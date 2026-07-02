import { getFormatter, getTranslations } from "next-intl/server";
import InviteForm, { CopyButton } from "@/components/therapist/InviteForm";
import { deleteInviteAction } from "@/lib/therapist/actions";
import { getInvites } from "@/lib/data/therapist";

export default async function InvitesPage() {
  const t = await getTranslations("therapist.invites");
  const format = await getFormatter();
  const invites = await getInvites();

  return (
    <>
      <h1 className="page-h">{t("pageTitle")}</h1>
      <p className="page-sub">{t("pageLead")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem", alignItems: "start" }}>
        <InviteForm />

        <div>
          <h2 className="section-label" style={{ marginTop: 0 }}>
            {t("listTitle")}
          </h2>
          {invites.length === 0 ? (
            <p className="card-sub">{t("noInvites")}</p>
          ) : (
            <ul className="row-list">
              {invites.map((inv) => (
                <li key={inv.id} className="row-item">
                  <span className="row-body">
                    <span className="row-title" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.12em" }}>
                      {inv.code}
                    </span>
                    <span className="row-sub">
                      {inv.child_first_name}
                      {inv.child_birth_year ? ` (${inv.child_birth_year})` : ""} ·{" "}
                      {format.dateTime(new Date(inv.created_at), { day: "numeric", month: "short" })}
                      {inv.note ? ` · ${inv.note}` : ""}
                    </span>
                  </span>
                  {inv.redeemed_at ? (
                    <span className="chip chip-hue hue-green">✓ {t("redeemed")}</span>
                  ) : (
                    <span style={{ display: "flex", gap: "0.4rem" }}>
                      <CopyButton text={inv.code} label={t("copy")} copied={t("copied")} />
                      <form action={deleteInviteAction}>
                        <input type="hidden" name="invite_id" value={inv.id} />
                        <button type="submit" className="btn btn-sm btn-danger-ghost">
                          {t("delete")}
                        </button>
                      </form>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
