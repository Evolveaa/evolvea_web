import Link from "next/link";
import { getTranslations } from "next-intl/server";
import StateView from "@/components/StateView";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="state-screen">
      <StateView
        icon="🧭"
        tone="brand"
        title={t("notFoundTitle")}
        lead={t("notFoundLead")}
        action={
          <Link href="/" className="btn btn-primary">
            {t("goHome")}
          </Link>
        }
      />
    </div>
  );
}
