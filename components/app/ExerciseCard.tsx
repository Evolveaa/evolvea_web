import Link from "next/link";
import { useTranslations } from "next-intl";
import { DOMAIN_META, type ExerciseRow } from "@/lib/exercises/types";

/**
 * One assigned exercise in a list (today queue / plan overview).
 * Weekly progress renders as dots when target > 1.
 */
export default function ExerciseCard({
  exercise,
  href,
  done,
  target,
  doneToday,
}: {
  exercise: ExerciseRow;
  href: string;
  done?: number;
  target?: number;
  doneToday?: boolean;
}) {
  const t = useTranslations();
  const meta = DOMAIN_META[exercise.domain];

  return (
    <Link href={href} className="row-item">
      <span className={`row-ico hue-${meta.hue}`} style={{ background: "var(--chip-bg)" }} aria-hidden="true">
        {meta.emoji}
      </span>
      <span className="row-body">
        <span className="row-title">{exercise.title}</span>
        <span className="row-sub">
          {t(`domains.${exercise.domain}`)} · {"★".repeat(exercise.difficulty)} ·{" "}
          {t("common.minutes", { count: exercise.duration_minutes })}
        </span>
      </span>
      <span className="row-end">
        {typeof done === "number" && typeof target === "number" ? (
          <span aria-label={t("parent.weeklyProgress", { done, target })}>
            {Array.from({ length: target }, (_, i) => (i < done ? "●" : "○")).join(" ")}
          </span>
        ) : null}
        {doneToday ? (
          <span
            className="chip hue-green chip-hue"
            style={{ display: "inline-flex", marginTop: 4 }}
          >
            ✓ {t("parent.doneToday")}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
