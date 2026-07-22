"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const PERIODS = [4, 8, 12] as const;

/**
 * Toolbar above the printable report: period switcher (server-rendered via
 * ?weeks=…) + the print/save-as-PDF button. Hidden entirely in print CSS.
 */
export default function ReportActions({
  childId,
  weeks,
}: {
  childId: string;
  weeks: number;
}) {
  const t = useTranslations("therapist.report");

  return (
    <div className="report-actions">
      <div className="report-actions-periods" role="group" aria-label={t("periodLabel")}>
        {PERIODS.map((w) => (
          <Link
            key={w}
            href={`/therapist/families/${childId}/report?weeks=${w}`}
            className="chip"
            aria-current={w === weeks ? "true" : undefined}
          >
            {t("weeksOption", { weeks: w })}
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => window.print()}
      >
        🖨️ {t("printButton")}
      </button>
    </div>
  );
}
