import { getTranslations } from "next-intl/server";
import ChildSettingsForm from "@/components/app/ChildSettingsForm";
import ChildSwitcher from "@/components/app/ChildSwitcher";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import { getActiveChild } from "@/lib/data/parent";
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
  const { data: therapist } = child.therapist_id
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", child.therapist_id)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <h1 className="page-h">{t("childSettings")}</h1>
      <p className="page-sub">{t("childSettingsLead")}</p>

      <ChildSwitcher kids={children} activeId={child.id} />

      {therapist?.full_name && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <span className="section-label" style={{ margin: 0 }}>
            {t("yourTherapist")}
          </span>
          <p style={{ marginTop: "0.35rem", fontWeight: 600 }}>🩺 {therapist.full_name}</p>
        </div>
      )}

      <ChildSettingsForm child={child} />

      <h2 className="section-label">{t("addAnotherChild")}</h2>
      <RedeemInviteForm />
    </>
  );
}
