import Link from "next/link";
import { useTranslations } from "next-intl";
import { DomainTile, IconCheck, IconChevronDown, IconPlay } from "@/components/icons";
import type { DomainGroup } from "@/lib/data/parent";

/**
 * Plan grouped by therapy area — compact, overview-first. Each area is a
 * single collapsed card (tile · name · count · progress · done/target). Tap
 * to reveal its exercises as light rows; each row launches the exercise.
 * Collapsed by default so the whole plan stays scannable on one screen.
 */
export default function PlanDomainGroups({ groups }: { groups: DomainGroup[] }) {
  const t = useTranslations();

  return (
    <div className="area-list">
      {groups.map((group) => {
        const pct = group.target > 0 ? Math.round((100 * group.done) / group.target) : 0;
        const complete = group.done >= group.target;
        return (
          <details key={group.domain} className="area-card" data-complete={complete ? "" : undefined}>
            <summary className="area-head">
              <DomainTile domain={group.domain} size={44} />
              <span className="area-body">
                <span className="area-title">{t(`domains.${group.domain}`)}</span>
                <span className="area-sub">
                  {t("parent.domainMeta", { count: group.entries.length })}
                </span>
                <span className={`area-bar bar-${group.domain}`} aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="area-end">
                <span className="area-count" data-full={complete ? "" : undefined}>
                  {complete ? <IconCheck size={13} /> : null}
                  {group.done}/{group.target}
                </span>
                <span className="area-chev" aria-hidden="true">
                  <IconChevronDown size={18} />
                </span>
              </span>
            </summary>
            <div className="area-exercises">
              {group.entries.map((entry) => {
                const ex = entry.item.exercises;
                const full = entry.doneThisWeek >= entry.target;
                const wpct = entry.target > 0 ? Math.min(100, (100 * entry.doneThisWeek) / entry.target) : 0;
                return (
                  <Link
                    key={entry.item.id}
                    href={`/app/exercise/${entry.item.id}`}
                    className="ex-row"
                    data-done={full ? "" : undefined}
                  >
                    <span className="ex-play" aria-hidden="true">
                      <IconPlay size={12} />
                    </span>
                    <span className="ex-body">
                      <span className="ex-title">{ex.title}</span>
                      <span className="ex-sub">
                        {"★".repeat(ex.difficulty)} · {t("common.minutes", { count: ex.duration_minutes })}
                      </span>
                    </span>
                    <span
                      className="ex-prog"
                      data-full={full ? "" : undefined}
                      aria-label={t("parent.weeklyProgress", { done: entry.doneThisWeek, target: entry.target })}
                    >
                      <small>
                        {Math.min(entry.doneThisWeek, entry.target)}/{entry.target}
                      </small>
                      <span className="ex-bar" aria-hidden="true">
                        <i style={{ width: `${wpct}%` }} />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
