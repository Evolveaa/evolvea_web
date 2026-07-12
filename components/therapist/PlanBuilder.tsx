"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { publishPlanAction, type PlanItemInput } from "@/lib/therapist/actions";
import { DomainTile } from "@/components/icons";
import CategoryFilter from "@/components/exercises/CategoryFilter";
import TemplatesMenu from "@/components/therapist/TemplatesMenu";
import type { PlanTemplateRow, TemplateItem } from "@/lib/data/clinical";
import type { ExerciseDomain } from "@/lib/exercises/types";
import { focusOf, inAgeBand, type FocusKey, type AgeBandKey } from "@/lib/exercises/categories";

/** Trimmed exercise row — the builder never needs the content payload. */
export interface LibraryItem {
  id: string;
  title: string;
  domain: ExerciseDomain;
  difficulty: number;
  duration_minutes: number;
  age_min: number;
  age_max: number;
  summary: string;
  is_builtin: boolean;
}

interface DraftItem extends PlanItemInput {
  key: number;
}

export default function PlanBuilder({
  childId,
  childName,
  library,
  initialTitle,
  initialNote,
  initialItems,
  defaultAgeBand = "all",
  templates = [],
}: {
  childId: string;
  childName: string;
  library: LibraryItem[];
  initialTitle: string;
  initialNote: string;
  initialItems: PlanItemInput[];
  defaultAgeBand?: AgeBandKey | "all";
  templates?: (PlanTemplateRow & { parsedItems: TemplateItem[] })[];
}) {
  const t = useTranslations("therapist.builder");
  const tc = useTranslations("common");
  const tt = useTranslations("therapist");

  const [title, setTitle] = useState(initialTitle);
  const [note, setNote] = useState(initialNote);
  const [items, setItems] = useState<DraftItem[]>(
    initialItems.map((item, i) => ({ ...item, key: i })),
  );
  const [focus, setFocus] = useState<FocusKey | "all">("all");
  const [ageBand, setAgeBand] = useState<AgeBandKey | "all">(defaultAgeBand);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(library.map((e) => [e.id, e])), [library]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return library.filter(
      (e) =>
        (focus === "all" || focusOf(e.domain) === focus) &&
        (ageBand === "all" || inAgeBand(ageBand, e.age_min, e.age_max)) &&
        (q === "" || e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)),
    );
  }, [library, focus, ageBand, search]);

  function add(id: string) {
    setItems((prev) =>
      prev.some((i) => i.exerciseId === id)
        ? prev
        : [
            ...prev,
            { exerciseId: id, timesPerWeek: 2, supportLevel: 3, key: Date.now() + prev.length },
          ],
    );
  }

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function patch(index: number, changes: Partial<PlanItemInput>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  }

  function publish() {
    setError(false);
    startTransition(async () => {
      const result = await publishPlanAction(
        childId,
        title,
        note,
        items.map(({ exerciseId, timesPerWeek, supportLevel }) => ({
          exerciseId,
          timesPerWeek,
          supportLevel,
        })),
      );
      if (result?.error) setError(true);
    });
  }

  const weeklyTotal = items.reduce((n, i) => n + i.timesPerWeek, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem", alignItems: "start" }}>
      {/* ------- library pane ------- */}
      <div>
        <h2 className="section-label">{t("libraryPane")}</h2>
        <div style={{ marginBottom: "0.5rem" }}>
          <CategoryFilter focus={focus} setFocus={setFocus} ageBand={ageBand} setAgeBand={setAgeBand} />
        </div>
        <input
          className="input"
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "0.7rem" }}
        />
        <ul className="row-list" style={{ maxHeight: 520, overflowY: "auto" }}>
          {filtered.map((e) => {
            const added = items.some((i) => i.exerciseId === e.id);
            return (
              <li key={e.id} className="row-item" style={{ padding: "0.7rem 0.9rem" }}>
                <DomainTile domain={e.domain} size={36} />
                <span className="row-body">
                  <span className="row-title" style={{ fontSize: "0.9rem" }}>
                    {e.title}
                    {!e.is_builtin && <span className="chip" style={{ marginLeft: 6, fontSize: "0.64rem" }}>{t("custom")}</span>}
                  </span>
                  <span className="row-sub">
                    {"★".repeat(e.difficulty)} · {tc("ageRange", { min: e.age_min, max: e.age_max })} ·{" "}
                    {tc("minutes", { count: e.duration_minutes })}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={added}
                  onClick={() => add(e.id)}
                >
                  {added ? "✓" : "＋"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ------- plan pane ------- */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
          <h2 className="section-label">{t("planPane", { name: childName })}</h2>
          <TemplatesMenu
            templates={templates}
            currentItems={items.map(({ exerciseId, timesPerWeek, supportLevel }) => ({
              exerciseId,
              timesPerWeek,
              supportLevel,
            }))}
            onApply={(tplItems) =>
              setItems(
                tplItems
                  // drop items whose exercise is no longer visible (deleted custom)
                  .filter((it) => byId.has(it.exerciseId))
                  .map((it, i) => ({ ...it, key: Date.now() + i })),
              )
            }
          />
        </div>
        <div className="card">
          <div className="field">
            <label className="label" htmlFor="plan-title">{t("titleLabel")}</label>
            <input
              className="input"
              id="plan-title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="plan-note">{t("noteLabel")}</label>
            <textarea
              className="textarea"
              id="plan-note"
              rows={2}
              maxLength={2000}
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                // auto-grow: the therapist's message must never clip mid-sentence
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight + 2}px`;
              }}
            />
          </div>

          {items.length === 0 ? (
            <p className="card-sub" style={{ padding: "0.6rem 0" }}>{t("emptyPlan")}</p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {items.map((item, i) => {
                const ex = byId.get(item.exerciseId);
                if (!ex) return null;
                return (
                  <li key={item.key} style={{ border: "1px solid var(--ink-line)", borderRadius: 12, padding: "0.6rem 0.7rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <DomainTile domain={ex.domain} size={24} />
                      <b style={{ flex: 1, fontSize: "0.88rem" }}>{ex.title}</b>
                      <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label={t("moveUp")} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label={t("moveDown")} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                      <button type="button" className="icon-btn" style={{ width: 32, height: 32, color: "var(--danger-ink)" }} aria-label={t("remove")} onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>✕</button>
                    </div>
                    <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.55rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span className="seg-field">
                        <span className="seg-label">{t("perWeek")}</span>
                        <span className="seg" role="group" aria-label={t("perWeek")}>
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <button
                              key={n}
                              type="button"
                              aria-pressed={item.timesPerWeek === n}
                              onClick={() => patch(i, { timesPerWeek: n })}
                            >
                              {n}×
                            </button>
                          ))}
                        </span>
                      </span>
                      <span className="seg-field">
                        <span className="seg-label">{t("support")}</span>
                        <span className="seg" role="group" aria-label={t("support")}>
                          {[3, 2, 1].map((n) => (
                            <button
                              key={n}
                              type="button"
                              aria-pressed={item.supportLevel === n}
                              onClick={() => patch(i, { supportLevel: n })}
                            >
                              {tt(`supportShort.${n}`)}
                            </button>
                          ))}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="form-hint" style={{ margin: "0.8rem 0" }}>
            {t("weeklyLoad", { count: weeklyTotal })}
          </p>

          {error && <p className="form-error" role="alert">{t("publishError")}</p>}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={pending || items.length === 0 || title.trim() === ""}
            onClick={publish}
          >
            {pending ? t("publishing") : t("publish")}
          </button>
          <p className="form-hint" style={{ textAlign: "center", marginTop: "0.5rem" }}>
            {t("publishHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
