import { useTranslations } from "next-intl";
import ExerciseCard from "@/components/app/ExerciseCard";
import { DOMAIN_META } from "@/lib/exercises/types";
import type { DomainGroup } from "@/lib/data/parent";

/**
 * Plan grouped by therapy domain — collapsible sections with per-area weekly
 * progress. Areas still needing work this week open by default; fully covered
 * areas start collapsed. Native <details> → no client JS.
 */
export default function PlanDomainGroups({ groups }: { groups: DomainGroup[] }) {
  const t = useTranslations("parent");
  const td = useTranslations("domains");

  return (
    <div>
      {groups.map((group) => {
        const meta = DOMAIN_META[group.domain];
        const pct = group.target > 0 ? Math.round((100 * group.done) / group.target) : 0;
        const complete = group.done >= group.target;
        return (
          <details key={group.domain} className="domain-group" open={!complete}>
            <summary>
              <span className={`dg-ico hue-${meta.hue}`} aria-hidden="true">
                {meta.emoji}
              </span>
              <span className="dg-body">
                <span className="dg-title">
                  {td(group.domain)} {complete && <span aria-hidden="true">✓</span>}
                </span>
                <span className="dg-sub">
                  {t("planGroupProgress", { done: group.done, target: group.target })} ·{" "}
                  {t("domainMeta", { count: group.entries.length })}
                </span>
                <span className="pbar" style={{ marginTop: "0.4rem" }} aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </span>
              </span>
              <span className="dg-chev" aria-hidden="true">
                ⌄
              </span>
            </summary>
            <div className="dg-content">
              {group.entries.map((entry) => (
                <ExerciseCard
                  key={entry.item.id}
                  exercise={entry.item.exercises}
                  href={`/app/exercise/${entry.item.id}`}
                  done={entry.doneThisWeek}
                  target={entry.target}
                  doneToday={entry.doneToday}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
