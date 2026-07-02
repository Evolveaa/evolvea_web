"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toggleExerciseActiveAction } from "@/lib/therapist/actions";
import { DOMAIN_META, DOMAINS, type ExerciseDomain, type ExerciseModality } from "@/lib/exercises/types";

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
  const td = useTranslations("domains");

  const [domain, setDomain] = useState<ExerciseDomain | "all">("all");
  const [difficulty, setDifficulty] = useState(0);
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (domain === "all" || e.domain === domain) &&
        (difficulty === 0 || e.difficulty === difficulty) &&
        (!onlyMine || e.mine) &&
        (q === "" || e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q)),
    );
  }, [exercises, domain, difficulty, search, onlyMine]);

  return (
    <>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
        <button
          type="button"
          className="chip"
          aria-pressed={domain === "all"}
          style={domain === "all" ? { background: "var(--accent-soft)", color: "var(--accent-ink)", borderColor: "transparent" } : undefined}
          onClick={() => setDomain("all")}
        >
          {t("all")}
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            className="chip"
            aria-pressed={domain === d}
            style={domain === d ? { background: "var(--accent-soft)", color: "var(--accent-ink)", borderColor: "transparent" } : undefined}
            onClick={() => setDomain(d)}
          >
            <span aria-hidden="true">{DOMAIN_META[d].emoji}</span> {td(d)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
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
      </div>

      <ul className="row-list">
        {filtered.map((e) => (
          <li key={e.id} className="row-item" style={{ opacity: e.is_active ? 1 : 0.55 }}>
            <span className={`row-ico hue-${DOMAIN_META[e.domain].hue}`} style={{ background: "var(--chip-bg)" }} aria-hidden="true">
              {DOMAIN_META[e.domain].emoji}
            </span>
            <span className="row-body">
              <span className="row-title">
                {e.title}
                {e.mine && <span className="chip" style={{ marginLeft: 6, fontSize: "0.64rem" }}>{t("mine")}</span>}
                {!e.is_active && <span className="chip" style={{ marginLeft: 6, fontSize: "0.64rem" }}>{t("inactive")}</span>}
              </span>
              <span className="row-sub">
                {MODALITY_ICON[e.modality]} {td(e.domain)} · {"★".repeat(e.difficulty)} · {e.age_min}–{e.age_max} r. · {e.duration_minutes} min — {e.summary}
              </span>
            </span>
            <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Link href={`/therapist/preview/${e.id}`} className="btn btn-sm btn-outline">
                {t("preview")}
              </Link>
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
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
