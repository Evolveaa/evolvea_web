"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

const TAB_KEYS = [
  "intro",
  "feel",
  "plan",
  "engage",
  "reflect",
  "anchor",
  "sent",
] as const;
const PANEL_COUNT = TAB_KEYS.length;

const bold = (chunks: ReactNode) => <b>{chunks}</b>;

/**
 * The Evolvea live-demo phone — a self-contained state machine mirroring the
 * original prototype:
 *   0 Intro · 1 Feel · 2 Plan · 3 Engage · 4 Reflect · 5 Anchor · 6 Sent
 *
 * Tabs jump directly; Begin / Back / Next / Replay walk the flow. The Feel
 * chips toggle and count, one affirmation can be selected on Anchor, and every
 * text field clears on Replay. Selections are keyed by index so they survive a
 * language switch.
 */
export default function Phone() {
  const t = useTranslations("phone");

  const [current, setCurrent] = useState(0);
  const [signals, setSignals] = useState<ReadonlySet<number>>(new Set());
  const [selectedSay, setSelectedSay] = useState<number | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const go = useCallback((i: number) => {
    setCurrent(Math.max(0, Math.min(PANEL_COUNT - 1, i)));
  }, []);
  const next = useCallback(() => setCurrent((c) => Math.min(PANEL_COUNT - 1, c + 1)), []);
  const back = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);

  const replay = useCallback(() => {
    setSignals(new Set());
    setSelectedSay(null);
    setFields({});
    setCurrent(0);
  }, []);

  const toggleSignal = useCallback((i: number) => {
    setSignals((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });
  }, []);

  const pickSay = useCallback((i: number) => {
    setSelectedSay((prev) => (prev === i ? null : i));
  }, []);

  const setField = useCallback((id: string, value: string) => {
    setFields((prev) => ({ ...prev, [id]: value }));
  }, []);

  const signalLabels = t.raw("feel.signals") as string[];
  const sayLabels = t.raw("anchor.says") as string[];
  const planFields = t.raw("plan.fields") as string[];
  const reflectFields = t.raw("reflect.fields") as string[];
  const engageJobs = t.raw("engage.jobs") as string[];
  const answerPlaceholder = t("answerPlaceholder");

  const panelClass = (i: number) =>
    i === current ? "ph-panel is-active" : "ph-panel";
  const tabClass = (i: number) => {
    if (i === current) return "ph-tab is-active";
    if (i < current) return "ph-tab is-done";
    return "ph-tab";
  };

  return (
    <div className="phone" role="group" aria-label={t("demoAria")}>
      <div className="phone-screen">
        {/* Status bar */}
        <div className="ph-status">
          <span className="ph-time">9:41</span>
          <span className="ph-icons" aria-hidden="true">
            <svg viewBox="0 0 18 12" width="17" height="11">
              <rect x="0" y="6" width="3" height="6" rx="1" fill="currentColor" />
              <rect x="4.5" y="4" width="3" height="8" rx="1" fill="currentColor" />
              <rect x="9" y="2" width="3" height="10" rx="1" fill="currentColor" />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill="currentColor" opacity=".4" />
            </svg>
            <svg viewBox="0 0 24 12" width="24" height="11">
              <rect x="0.5" y="0.5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5" />
              <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
              <rect x="21.5" y="4" width="2" height="4" rx="1" fill="currentColor" />
            </svg>
          </span>
        </div>

        {/* App bar */}
        <div className="ph-appbar">
          <span className="ph-brand">
            <span className="ph-brand-dot" /> Evolvea <small>{t("brandSub")}</small>
          </span>
          <span className="ph-kid">{t("kid")}</span>
        </div>

        {/* Tabs */}
        <div className="ph-tabs" role="tablist">
          {TAB_KEYS.map((key, i) => (
            <button
              key={key}
              className={tabClass(i)}
              role="tab"
              aria-selected={i === current}
              onClick={() => go(i)}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        {/* Body / panels */}
        <div className="ph-body">
          {/* 0 · INTRO */}
          <section className={panelClass(0)} data-panel={0}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("intro.kicker")}</span>
              <h3 className="ph-h">{t("intro.h")}</h3>
              <span className="ph-sub">{t("intro.sub")}</span>
              <p className="ph-text">{t("intro.text")}</p>
              <div className="ph-note">
                <span className="ph-note-label">{t("intro.noteLabel")}</span>
                <p>{t.rich("intro.noteBody", { b: bold })}</p>
              </div>
            </div>
            <div className="ph-foot">
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.begin")} →
              </button>
            </div>
          </section>

          {/* 1 · FEEL */}
          <section className={panelClass(1)} data-panel={1}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("feel.kicker")}</span>
              <h3 className="ph-h">{t("feel.h")}</h3>
              <p className="ph-text">{t("feel.text")}</p>
              <div className="ph-signals">
                {signalLabels.map((label, i) => (
                  <button
                    key={i}
                    className={signals.has(i) ? "ph-signal on" : "ph-signal"}
                    onClick={() => toggleSignal(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="ph-captured">
                {t.rich("feel.captured", { count: signals.size, b: bold })}
              </p>
              <div className="ph-note">
                <span className="ph-note-label">{t("feel.noteLabel")}</span>
                <p>{t("feel.noteBody")}</p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                {t("nav.back")}
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.makePlan")} →
              </button>
            </div>
          </section>

          {/* 2 · PLAN */}
          <section className={panelClass(2)} data-panel={2}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("plan.kicker")}</span>
              <h3 className="ph-h">{t("plan.h")}</h3>
              {planFields.map((label, i) => (
                <PhoneField
                  key={i}
                  label={label}
                  placeholder={answerPlaceholder}
                  value={fields[`plan-${i}`] ?? ""}
                  onChange={(v) => setField(`plan-${i}`, v)}
                />
              ))}
              <div className="ph-note">
                <span className="ph-note-label">{t("plan.noteLabel")}</span>
                <p>{t.rich("plan.noteBody", { b: bold })}</p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                {t("nav.back")}
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.startSolving")} →
              </button>
            </div>
          </section>

          {/* 3 · ENGAGE */}
          <section className={panelClass(3)} data-panel={3}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("engage.kicker")}</span>
              <h3 className="ph-h">{t("engage.h")}</h3>
              <p className="ph-text">{t("engage.text")}</p>
              <ul className="ph-jobs">
                {engageJobs.map((job, i) => (
                  <li key={i}>
                    <span className="ph-jno">→</span>
                    <p>{job}</p>
                  </li>
                ))}
              </ul>
              <div className="ph-field">
                <label className="ph-field-label">
                  {t("engage.fieldLabel")}{" "}
                  <span className="ph-opt">{t("engage.fieldOptional")}</span>
                </label>
                <textarea
                  className="ph-input"
                  rows={2}
                  placeholder={t("engage.fieldPlaceholder")}
                  value={fields["engage-0"] ?? ""}
                  onChange={(e) => setField("engage-0", e.target.value)}
                />
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                {t("nav.back")}
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.lookBack")} →
              </button>
            </div>
          </section>

          {/* 4 · REFLECT */}
          <section className={panelClass(4)} data-panel={4}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("reflect.kicker")}</span>
              <h3 className="ph-h">{t("reflect.h")}</h3>
              {reflectFields.map((label, i) => (
                <PhoneField
                  key={i}
                  label={label}
                  placeholder={answerPlaceholder}
                  value={fields[`reflect-${i}`] ?? ""}
                  onChange={(v) => setField(`reflect-${i}`, v)}
                />
              ))}
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                {t("nav.back")}
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.anchorIt")} →
              </button>
            </div>
          </section>

          {/* 5 · ANCHOR */}
          <section className={panelClass(5)} data-panel={5}>
            <div className="ph-scroll">
              <span className="ph-kicker">{t("anchor.kicker")}</span>
              <h3 className="ph-h">{t("anchor.h")}</h3>
              <p className="ph-text">{t("anchor.text")}</p>
              {sayLabels.map((label, i) => (
                <button
                  key={i}
                  className={selectedSay === i ? "ph-say sel" : "ph-say"}
                  onClick={() => pickSay(i)}
                >
                  {label}
                </button>
              ))}
              <div className="ph-note">
                <span className="ph-note-label">{t("anchor.noteLabel")}</span>
                <p>{t.rich("anchor.noteBody", { b: bold })}</p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                {t("nav.back")}
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                {t("nav.finishSend")} →
              </button>
            </div>
          </section>

          {/* 6 · SENT */}
          <section className={panelClass(6)} data-panel={6}>
            <div className="ph-scroll ph-sent">
              <div className="ph-check" aria-hidden="true">
                ✓
              </div>
              <span className="ph-kicker">{t("sent.kicker")}</span>
              <h3 className="ph-h">{t("sent.h")}</h3>
              <p className="ph-text">{t("sent.text")}</p>
              <div className="ph-note ph-note-full">
                <span className="ph-note-label">{t("sent.noteLabel")}</span>
                <p>{t.rich("sent.noteBody", { b: bold })}</p>
              </div>
            </div>
            <div className="ph-foot">
              <button className="ph-btn ph-btn-primary" onClick={replay}>
                {t("nav.replay")} ↻
              </button>
            </div>
          </section>
        </div>
        {/* /ph-body */}
      </div>
      {/* /phone-screen */}
    </div>
  );
}

/** A single open-question text field inside the phone. */
function PhoneField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ph-field">
      <label className="ph-field-label">{label}</label>
      <textarea
        className="ph-input"
        rows={2}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
