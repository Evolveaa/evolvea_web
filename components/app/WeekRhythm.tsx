import Link from "next/link";
import { useTranslations } from "next-intl";
import { DOMAIN_META } from "@/lib/exercises/types";
import type { PlanItemWithExercise } from "@/lib/data/parent";

const DOW_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/**
 * Recommended weekly rhythm — one row per day (Mon–Sun), each showing that
 * day's suggested exercises as domain-coloured chips. Today is highlighted and
 * links to the adaptive "Dnes" queue. No interactivity → server component.
 */
export default function WeekRhythm({
  days,
  todayIndex,
}: {
  days: PlanItemWithExercise[][];
  todayIndex: number;
}) {
  const t = useTranslations("parent");
  const tc = useTranslations("common");

  return (
    <div className="rhythm">
      {days.map((items, i) => {
        const isToday = i === todayIndex;
        return (
          <div key={i} className="rhythm-day" data-today={isToday ? "" : undefined}>
            <span className="rhythm-dow">{tc(`days.${DOW_KEYS[i]}`)}</span>
            <span className="rhythm-items">
              {items.length === 0 ? (
                <span className="rhythm-empty">{t("planFree")}</span>
              ) : (
                items.map((item) => {
                  const meta = DOMAIN_META[item.exercises.domain];
                  return (
                    <span
                      key={item.id}
                      className={`rhythm-chip hue-${meta.hue}`}
                      role="img"
                      aria-label={item.exercises.title}
                      title={item.exercises.title}
                    >
                      {meta.emoji}
                    </span>
                  );
                })
              )}
            </span>
            {isToday && (
              <Link href="/app" className="chip" style={{ flex: "none" }}>
                {t("planTodayPill")} →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
