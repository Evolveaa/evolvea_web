import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DomainGlyph,
  DomainTile,
  IconCheck,
  IconClock,
  IconPlay,
  IconStar,
} from "@/components/icons";
import type { TodayEntry } from "@/lib/data/parent";

/**
 * The day as a little journey: done stops turn green, the current stop
 * pulses with a big "start" pill, later stops wait in softer colours.
 * Every stop is directly tappable — no detours.
 */
export default function TodayPath({
  done,
  queue,
}: {
  done: TodayEntry[];
  queue: TodayEntry[];
}) {
  const t = useTranslations();

  // Weekly targets met and nothing queued today — celebrate instead of
  // rendering an empty section, and keep a door open for bonus practice.
  if (done.length === 0 && queue.length === 0) {
    return (
      <div className="day-done">
        <span className="day-done-star" aria-hidden="true">
          <IconStar size={30} />
        </span>
        <b>{t("parent.weekDoneTitle")}</b>
        <p>{t("parent.weekDoneLead")}</p>
        <Link href="/app/plan" className="btn btn-outline btn-sm" style={{ marginTop: "0.6rem" }}>
          {t("parent.weekDoneCta")}
        </Link>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <>
        <div className="path" role="list">
          {done.map((entry, i) => (
            <PathRow key={entry.item.id} entry={entry} state="done" last={i === done.length - 1} />
          ))}
        </div>
        <div className="day-done" style={{ marginTop: done.length > 0 ? "1rem" : 0 }}>
          <span className="day-done-star" aria-hidden="true">
            <IconStar size={30} />
          </span>
          <b>{t("parent.allDoneTitle")}</b>
          <p>{t("parent.allDoneLead")}</p>
        </div>
      </>
    );
  }

  const rows: { entry: TodayEntry; state: "done" | "next" | "later" }[] = [
    ...done.map((entry) => ({ entry, state: "done" as const })),
    ...queue.map((entry, i) => ({ entry, state: i === 0 ? ("next" as const) : ("later" as const) })),
  ];

  return (
    <div className="path" role="list">
      {rows.map((row, i) => (
        <PathRow
          key={row.entry.item.id}
          entry={row.entry}
          state={row.state}
          last={i === rows.length - 1}
        />
      ))}
    </div>
  );
}

function PathRow({
  entry,
  state,
  last,
}: {
  entry: TodayEntry;
  state: "done" | "next" | "later";
  last: boolean;
}) {
  const t = useTranslations();
  const ex = entry.item.exercises;

  return (
    <Link
      href={`/app/exercise/${entry.item.id}`}
      className="path-row"
      data-state={state}
      role="listitem"
      aria-label={`${ex.title} — ${
        state === "done" ? t("parent.pathDone") : state === "next" ? t("parent.pathStart") : t("parent.pathLater")
      }`}
    >
      <span className="path-node" aria-hidden="true">
        {state === "done" ? (
          <span className="path-dot">
            <IconCheck size={26} />
          </span>
        ) : (
          <DomainTile domain={ex.domain} size={52} className="path-dot" />
        )}
      </span>
      <span className="path-card">
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="path-title">{ex.title}</span>
          <span className="path-meta">
            {t(`domains.${ex.domain}`)} · {t("common.minutes", { count: ex.duration_minutes })}
          </span>
        </span>
        {state === "done" && (
          <span className="path-cta path-cta-done">
            <IconCheck size={13} /> {t("parent.pathDone")}
          </span>
        )}
        {state === "next" && (
          <span className="path-cta path-cta-start">
            <IconPlay size={13} /> {t("parent.pathStart")}
          </span>
        )}
        {state === "later" && (
          <span className="path-cta path-cta-later">
            <IconClock size={13} /> {t("parent.pathLater")}
          </span>
        )}
      </span>
    </Link>
  );
}

/** tiny coloured dot for rhythm rows */
export function DomainDot({ domain }: { domain: Parameters<typeof DomainGlyph>[0]["domain"] }) {
  return <DomainTile domain={domain} size={22} className="rhythm-dot" />;
}
