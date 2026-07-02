import Link from "next/link";
import { useTranslations } from "next-intl";
import { DomainTile, IconCheck } from "@/components/icons";
import type { ExerciseRow } from "@/lib/exercises/types";

/**
 * One assigned exercise in a list (plan groups). The right side shows this
 * week's coverage as a filling mini-bar (`2/3`), green when complete.
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
  const hasWeekly = typeof done === "number" && typeof target === "number" && target > 0;
  const full = hasWeekly && done! >= target!;

  return (
    <Link href={href} className="row-item">
      <DomainTile domain={exercise.domain} size={44} />
      <span className="row-body">
        <span className="row-title">{exercise.title}</span>
        <span className="row-sub">
          {t(`domains.${exercise.domain}`)} · {"★".repeat(exercise.difficulty)} ·{" "}
          {t("common.minutes", { count: exercise.duration_minutes })}
        </span>
      </span>
      {doneToday ? (
        <span className="score-pill" data-tone="good">
          <IconCheck size={12} /> {t("parent.doneToday")}
        </span>
      ) : null}
      {hasWeekly && (
        <span
          className="wk-pill"
          data-full={full ? "" : undefined}
          aria-label={t("parent.weeklyProgress", { done: done!, target: target! })}
        >
          <small>
            {Math.min(done!, target!)}/{target}
          </small>
          <span className="wk-bar" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (100 * done!) / target!)}%` }} />
          </span>
        </span>
      )}
    </Link>
  );
}
