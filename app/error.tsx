"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import StateView from "@/components/StateView";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    // Hook for error reporting (Sentry etc.) — see README "Monitoring".
    console.error(error);
  }, [error]);

  return (
    <div className="state-screen">
      <StateView
        icon="🌧️"
        tone="warn"
        title={t("errorTitle")}
        lead={t("errorLead")}
        action={
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            {t("retry")}
          </button>
        }
      />
    </div>
  );
}
