import { useTranslations } from "next-intl";
import { DomainTile } from "@/components/icons";
import type { PlanItemWithExercise } from "@/lib/data/parent";

const DOW_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/**
 * Recommended weekly rhythm — one row per day (Mon–Sun), each showing that
 * day's suggested mix as small domain tiles. Today is highlighted; the real
 * tappable queue lives on the home path. No interactivity → server component.
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
                items.map((item) => (
                  <span key={item.id} title={item.exercises.title}>
                    <DomainTile domain={item.exercises.domain} size={24} className="rhythm-dot" />
                  </span>
                ))
              )}
            </span>
            {isToday && <span className="rhythm-today-tag">{t("planTodayPill")}</span>}
          </div>
        );
      })}
    </div>
  );
}
