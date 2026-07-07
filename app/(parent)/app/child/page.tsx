import { getTranslations } from "next-intl/server";
import ChildSettingsForm from "@/components/app/ChildSettingsForm";
import ChildSwitcher from "@/components/app/ChildSwitcher";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import SubscriptionManage from "@/components/app/SubscriptionManage";
import { accessState, trialDaysLeft } from "@/lib/billing";
import { getActiveChild, getSubscription } from "@/lib/data/parent";
import { setSpeechConsentAction } from "@/lib/parent/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ChildSettingsPage() {
  const t = await getTranslations("parent");
  const { child, children } = await getActiveChild();

  if (!child) {
    return (
      <>
        <h1 className="page-h">{t("childSettings")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: therapist }, sub, { data: consentRow }] = await Promise.all([
    child.therapist_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", child.therapist_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getSubscription(child.id),
    supabase.from("children").select("speech_consent_at").eq("id", child.id).maybeSingle(),
  ]);
  const subState = accessState(sub);
  const speechConsent = !!consentRow?.speech_consent_at;

  const therapistInitial = therapist?.full_name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <>
      <h1 className="page-h">{t("childSettings")}</h1>
      <p className="page-sub">{t("childSettingsLead")}</p>

      <ChildSwitcher kids={children} activeId={child.id} />

      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <div className="col-stack">
          <ChildSettingsForm child={child} />
        </div>

        <div className="col-stack">
          {therapist?.full_name && (
            <div className="info-card">
              <div className="info-head" style={{ marginBottom: 0 }}>
                <span className="info-avatar" aria-hidden="true">
                  {therapistInitial}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className="info-role">{t("yourTherapist")}</span>
                  <span className="info-name">{therapist.full_name}</span>
                </span>
              </div>
            </div>
          )}

          <SubscriptionManage
            childId={child.id}
            state={subState}
            daysLeft={sub && subState === "trial" ? trialDaysLeft(sub) : 0}
          />

          <div className="info-card">
            <div className="row-between" style={{ margin: "0 0 0.5rem", alignItems: "center" }}>
              <span className="section-label" style={{ margin: 0 }}>
                {t("speechConsentTitle")}
              </span>
              {speechConsent && (
                <span className="chip chip-hue hue-green" style={{ fontSize: "0.68rem" }}>
                  ✓ {t("speechConsentActive")}
                </span>
              )}
            </div>
            <p className="info-role" style={{ lineHeight: 1.55, marginBottom: "0.8rem" }}>
              {t("speechConsentLead")}
            </p>
            <form action={setSpeechConsentAction}>
              <input type="hidden" name="child_id" value={child.id} />
              <label
                style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked={speechConsent}
                  style={{ width: 18, height: 18, marginTop: 2, accentColor: "var(--accent-ink)" }}
                />
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  {t("speechConsentField")}
                </span>
              </label>
              <button
                type="submit"
                className="btn btn-outline btn-sm"
                style={{ marginTop: "0.85rem" }}
              >
                {t("speechConsentSave")}
              </button>
            </form>
          </div>

          <div>
            <h2 className="section-label" style={{ marginTop: 0 }}>
              {t("addAnotherChild")}
            </h2>
            <RedeemInviteForm />
          </div>
        </div>
      </div>
    </>
  );
}
