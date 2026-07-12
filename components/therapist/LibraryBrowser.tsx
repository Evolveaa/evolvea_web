"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { duplicateExerciseAction, toggleExerciseActiveAction } from "@/lib/therapist/actions";
import { DomainTile } from "@/components/icons";
import CategoryFilter from "@/components/exercises/CategoryFilter";
import { DOMAINS, type ExerciseDomain, type ExerciseModality } from "@/lib/exercises/types";
import { focusOf, inAgeBand, type FocusKey, type AgeBandKey } from "@/lib/exercises/categories";

export interface LibraryRow {
  id: string;
  title: string;
  domain: ExerciseDomain;
  modality: ExerciseModality;
  difficulty: number;
  duration_minutes: number;
  age_min: number;
  age_max: number;
  summary: string;
  is_builtin: boolean;
  is_active: boolean;
  mine: boolean;
}

const MODALITY_ICON: Record<ExerciseModality, string> = {
  interactive: "👆",
  speech: "🗣️",
  guided: "🤝",
};

export default function LibraryBrowser({ exercises }: { exercises: LibraryRow[] }) {
  const t = useTranslations("therapist.library");
  const tc = useTranslations("common");
  const td = useTranslations("domains");

  const [focus, setFocus] = useState<FocusKey | "all">("all");
  const [ageBand, setAgeBand] = useState<AgeBandKey | "all">("all");
  const [difficulty, setDifficulty] = useState(0);
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (focus === "all" || focusOf(e.domain) === focus) &&
        (ageBand === "all" || inAgeBand(ageBand, e.age_min, e.age_max)) &&
        (difficulty === 0 || e.difficulty === difficulty) &&
        (!onlyMine || e.mine) &&
        (q === "" ||
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          td(e.domain).toLowerCase().includes(q)),
    );
  }, [exercises, focus, ageBand, difficulty, search, onlyMine, td]);

  function clearFilters() {
    setFocus("all");
    setAgeBand("all");
    setDifficulty(0);
    setSearch("");
    setOnlyMine(false);
  }

  return (
    <>
      <CategoryFilter focus={focus} setFocus={setFocus} ageBand={ageBand} setAgeBand={setAgeBand} />

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem", marginTop: "0.9rem" }}>
        <input
          className="input"
          type="search"
          placeholder={t("search")}
          aria-label={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280, minHeight: 42 }}
        />
        <select
          className="select"
          aria-label={t("difficulty")}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          style={{ width: "auto", minHeight: 42 }}
        >
          <option value={0}>{t("anyDifficulty")}</option>
          <option value={1}>★</option>
          <option value={2}>★★</option>
          <option value={3}>★★★</option>
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.86rem", color: "var(--ink-soft)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--accent-ink)" }}
          />
          {t("onlyMine")}
        </label>
        <span className="card-sub" style={{ marginLeft: "auto" }}>
          {t("count", { count: filtered.length })}
        </span>
        <span className="seg" role="group" aria-label={t("viewLabel")}>
          <button
            type="button"
            aria-pressed={view === "grid"}
            aria-label={t("viewGrid")}
            onClick={() => setView("grid")}
          >
            ▦
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label={t("viewList")}
            onClick={() => setView("list")}
          >
            ☰
          </button>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            🔍
          </span>
          <p>{t("noResults")}</p>
          <button type="button" className="btn btn-sm btn-outline" onClick={clearFilters}>
            {t("clearFilters")}
          </button>
        </div>
      ) : (
        DOMAINS.map((domain) => {
          const group = filtered.filter((e) => e.domain === domain);
          if (group.length === 0) return null;
          return (
            <section key={domain} className="lib-group">
              <h2 className="lib-group-head">
                <DomainTile domain={domain} size={26} />
                <span>{td(domain)}</span>
                <span className="lib-group-count">{group.length}</span>
              </h2>
              <ul className={view === "grid" ? "lib-grid" : "lib-grid lib-list"}>
                {group.map((e) => (
                  <li key={e.id} className="lib-card" data-inactive={e.is_active ? undefined : ""}>
                    <div className="lib-card-head">
                      <DomainTile domain={e.domain} size={40} />
                      <span className="lib-card-id">
                        <span className="lib-card-title">
                          {e.title}
                          {e.mine && <span className="chip lib-flag">{t("mine")}</span>}
                          {!e.is_active && <span className="chip lib-flag">{t("inactive")}</span>}
                        </span>
                        <span className="lib-card-meta">
                          {MODALITY_ICON[e.modality]} {"★".repeat(e.difficulty)} ·{" "}
                          {tc("ageRange", { min: e.age_min, max: e.age_max })} ·{" "}
                          {tc("minutes", { count: e.duration_minutes })}
                        </span>
                      </span>
                    </div>
                    <p className="lib-card-summary">{e.summary}</p>
                    <div className="lib-card-actions">
                      <Link href={`/therapist/preview/${e.id}`} className="btn btn-sm btn-outline">
                        {t("preview")}
                      </Link>
                      <form action={duplicateExerciseAction}>
                        <input type="hidden" name="exercise_id" value={e.id} />
                        <button type="submit" className="btn btn-sm btn-outline">
                          {t("duplicate")}
                        </button>
                      </form>
                      {e.mine && (
                        <>
                          <Link href={`/therapist/library/${e.id}`} className="btn btn-sm btn-outline">
                            {t("edit")}
                          </Link>
                          <form action={toggleExerciseActiveAction}>
                            <input type="hidden" name="exercise_id" value={e.id} />
                            <input type="hidden" name="active" value={String(!e.is_active)} />
                            <button type="submit" className="btn btn-sm btn-danger-ghost">
                              {e.is_active ? t("deactivate") : t("activate")}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </>
  );
}
