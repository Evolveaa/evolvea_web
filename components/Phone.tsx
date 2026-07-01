"use client";

import { useCallback, useState } from "react";
import {
  ANSWER_PLACEHOLDER,
  ENGAGE_JOBS,
  PANEL_COUNT,
  PLAN_FIELDS,
  REFLECT_FIELDS,
  SAYS,
  SIGNALS,
  TABS,
  type FieldDef,
} from "@/lib/phone-content";

/**
 * The Evolvea live-demo phone — a self-contained state machine mirroring the
 * original prototype:
 *   0 Intro · 1 Feel · 2 Plan · 3 Engage · 4 Reflect · 5 Anchor · 6 Sent
 *
 * Tabs jump directly; Begin / Back / Next / Replay walk the flow. The Feel
 * chips toggle and count, one affirmation can be selected on Anchor, and every
 * text field clears on Replay.
 */
export default function Phone() {
  const [current, setCurrent] = useState(0);
  const [signals, setSignals] = useState<ReadonlySet<string>>(new Set());
  const [selectedSay, setSelectedSay] = useState<string | null>(null);
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

  const toggleSignal = useCallback((name: string) => {
    setSignals((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(name)) nextSet.delete(name);
      else nextSet.add(name);
      return nextSet;
    });
  }, []);

  const pickSay = useCallback((text: string) => {
    setSelectedSay((prev) => (prev === text ? null : text));
  }, []);

  const setField = useCallback((id: string, value: string) => {
    setFields((prev) => ({ ...prev, [id]: value }));
  }, []);

  const panelClass = (i: number) =>
    i === current ? "ph-panel is-active" : "ph-panel";

  const tabClass = (i: number) => {
    if (i === current) return "ph-tab is-active";
    if (i < current) return "ph-tab is-done";
    return "ph-tab";
  };

  return (
    <div className="phone" role="group" aria-label="Evolvea app live demo">
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
            <span className="ph-brand-dot" /> Evolvea{" "}
            <small>Cognitive&nbsp;Training</small>
          </span>
          <span className="ph-kid">Leo · 7</span>
        </div>

        {/* Tabs */}
        <div className="ph-tabs" role="tablist">
          {TABS.map((label, i) => (
            <button
              key={label}
              className={tabClass(i)}
              role="tab"
              aria-selected={i === current}
              onClick={() => go(i)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body / panels */}
        <div className="ph-body">
          {/* 0 · INTRO */}
          <section className={panelClass(0)} data-panel={0}>
            <div className="ph-scroll">
              <span className="ph-kicker">Session · with Leo</span>
              <h3 className="ph-h">The Stuck Puzzle</h3>
              <span className="ph-sub">Parent-guided · 10–15 min · Ages 6–10</span>
              <p className="ph-text">
                Give Leo a small jigsaw (10–20 pieces) — solvable, but not
                obvious. He owns the thinking. You&apos;re a facilitator, not an
                instructor: no solving, no correcting.
              </p>
              <div className="ph-note">
                <span className="ph-note-label">What it builds</span>
                <p>
                  Tolerance for difficulty, <b>adaptive self-talk</b>, and
                  effort-based confidence.
                </p>
              </div>
            </div>
            <div className="ph-foot">
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Begin →
              </button>
            </div>
          </section>

          {/* 1 · FEEL */}
          <section className={panelClass(1)} data-panel={1}>
            <div className="ph-scroll">
              <span className="ph-kicker">Step 1 · Emotional awareness</span>
              <h3 className="ph-h">&quot;How do you feel looking at this?&quot;</h3>
              <p className="ph-text">
                Ask, then listen. Tap what Leo names — no judgement.
              </p>
              <div className="ph-signals">
                {SIGNALS.map((name) => (
                  <button
                    key={name}
                    className={signals.has(name) ? "ph-signal on" : "ph-signal"}
                    onClick={() => toggleSignal(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="ph-captured">
                <b>{signals.size}</b> feelings named
              </p>
              <div className="ph-note">
                <span className="ph-note-label">Why</span>
                <p>
                  Naming the discomfort lowers the threat. Stuck is allowed here.
                </p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Make a plan →
              </button>
            </div>
          </section>

          {/* 2 · PLAN */}
          <section className={panelClass(2)} data-panel={2}>
            <div className="ph-scroll">
              <span className="ph-kicker">Step 2 · Metacognitive planning</span>
              <h3 className="ph-h">Ask, then jot it down.</h3>
              {PLAN_FIELDS.map((f) => (
                <PhoneField
                  key={f.id}
                  field={f}
                  value={fields[f.id] ?? ""}
                  onChange={(v) => setField(f.id, v)}
                />
              ))}
              <div className="ph-note">
                <span className="ph-note-label">Hold back</span>
                <p>
                  Give plenty of wait time. <b>Don&apos;t offer the answers.</b>
                </p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Start solving →
              </button>
            </div>
          </section>

          {/* 3 · ENGAGE */}
          <section className={panelClass(3)} data-panel={3}>
            <div className="ph-scroll">
              <span className="ph-kicker">Step 3 · Task engagement</span>
              <h3 className="ph-h">When he gets stuck.</h3>
              <p className="ph-text">
                Leo works on his own. If frustration rises, prompt — never
                correct:
              </p>
              <ul className="ph-jobs">
                {ENGAGE_JOBS.map((job) => (
                  <li key={job}>
                    <span className="ph-jno">→</span>
                    <p>{job}</p>
                  </li>
                ))}
              </ul>
              <div className="ph-field">
                <label className="ph-field-label">
                  What did Leo try? <span className="ph-opt">(optional)</span>
                </label>
                <textarea
                  className="ph-input"
                  rows={2}
                  placeholder="A quick note for the logopedist…"
                  value={fields["engage-1"] ?? ""}
                  onChange={(e) => setField("engage-1", e.target.value)}
                />
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Look back →
              </button>
            </div>
          </section>

          {/* 4 · REFLECT */}
          <section className={panelClass(4)} data-panel={4}>
            <div className="ph-scroll">
              <span className="ph-kicker">Step 4 · Reflective evaluation</span>
              <h3 className="ph-h">However it went, ask:</h3>
              {REFLECT_FIELDS.map((f) => (
                <PhoneField
                  key={f.id}
                  field={f}
                  value={fields[f.id] ?? ""}
                  onChange={(v) => setField(f.id, v)}
                />
              ))}
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Anchor it →
              </button>
            </div>
          </section>

          {/* 5 · ANCHOR */}
          <section className={panelClass(5)} data-panel={5}>
            <div className="ph-scroll">
              <span className="ph-kicker">Step 5 · Self-efficacy anchoring</span>
              <h3 className="ph-h">One line to carry forward.</h3>
              <p className="ph-text">Leo picks a statement and says it out loud:</p>
              {SAYS.map((text) => (
                <button
                  key={text}
                  className={selectedSay === text ? "ph-say sel" : "ph-say"}
                  onClick={() => pickSay(text)}
                >
                  {text}
                </button>
              ))}
              <div className="ph-note">
                <span className="ph-note-label">Tomorrow</span>
                <p>
                  Repeat with a new task. <b>Consistency of the questions</b>{" "}
                  matters more than the puzzle.
                </p>
              </div>
            </div>
            <div className="ph-foot ph-foot-split">
              <button className="ph-btn ph-btn-ghost" onClick={back}>
                Back
              </button>
              <button className="ph-btn ph-btn-primary" onClick={next}>
                Finish &amp; send →
              </button>
            </div>
          </section>

          {/* 6 · SENT */}
          <section className={panelClass(6)} data-panel={6}>
            <div className="ph-scroll ph-sent">
              <div className="ph-check" aria-hidden="true">
                ✓
              </div>
              <span className="ph-kicker">Session saved</span>
              <h3 className="ph-h">Sent to Leo&apos;s logopedist.</h3>
              <p className="ph-text">
                Tonight&apos;s session and your notes have been shared with
                Leo&apos;s logopedist for evaluation. They&apos;ll review the
                answers and adapt tomorrow&apos;s exercise.
              </p>
              <div className="ph-note ph-note-full">
                <span className="ph-note-label">Status</span>
                <p>
                  Awaiting review · usually within <b>24 hours</b>
                </p>
              </div>
            </div>
            <div className="ph-foot">
              <button className="ph-btn ph-btn-primary" onClick={replay}>
                Replay demo ↻
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
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ph-field">
      <label className="ph-field-label">{field.label}</label>
      <textarea
        className="ph-input"
        rows={2}
        placeholder={ANSWER_PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
