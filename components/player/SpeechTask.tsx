"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import { createClient } from "@/lib/supabase/browser";
import { createSpeechAttemptAction } from "@/lib/parent/actions";
import type { SpeechItemsContent } from "@/lib/exercises/types";
import { useFeedbackLines, type TaskProps } from "./shared";

type Score = "great" | "almost" | "practice";
type RecState = "idle" | "recording" | "uploading" | "done" | "error";

const MAX_SECONDS = 45;

/**
 * Speech practice.
 *   • Describe-the-picture items (with `expect`) + parental consent →
 *     the child's voice is recorded, transcribed, and an LLM checks which
 *     expected concepts were mentioned. Recording only ever happens with
 *     explicit consent and in live mode.
 *   • Otherwise → the child says it aloud and the parent taps a score
 *     (the original, no-recording flow — kept as a graceful fallback).
 */
export default function SpeechTask({
  content,
  onProgress,
  onFinish,
  childId,
  exerciseId,
  speechConsent,
  recordingLive,
}: TaskProps<SpeechItemsContent>) {
  const t = useTranslations("player");
  const locale = useLocale();
  const { supported, speak } = useTts();
  const { praise, encourage } = useFeedbackLines();

  const recorderSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  // Record mode only when every item is a describe item and consent is given.
  const recordMode =
    !!recordingLive &&
    !!speechConsent &&
    !!childId &&
    !!exerciseId &&
    recorderSupported &&
    content.items.every((i) => (i.expect?.length ?? 0) > 0);

  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const results = useRef<Score[]>([]);
  const attemptIds = useRef<string[]>([]);
  const speechDetail = useRef<
    { itemIndex: number; prompt: string; expected: string[]; status: string }[]
  >([]);
  const lock = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // recording state
  const [rec, setRec] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = content.items[index];

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(
    () => () => {
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
      if (tick.current) clearInterval(tick.current);
      // detach the recorder first so a pending onstop can't fire uploadRecording
      // after unmount (which would create an orphaned attempt + storage object)
      if (recorder.current) {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        if (recorder.current.state === "recording") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((tr) => tr.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  /* ---------------- manual scoring (fallback) ---------------- */
  function finishManual(lastScore: Score) {
    onFinish({
      correct: [...results.current, lastScore].filter((r) => r === "great").length,
      total: content.items.length,
      hintsUsed: 0,
      detail: {
        items: [...results.current, lastScore].map((r, i) => ({
          text: content.items[i].text,
          score: r,
        })),
      },
    });
  }

  function score(s: Score) {
    if (lock.current) return;
    lock.current = true;
    // speaking is the hardest task in the app — the child gets a moment of
    // praise before the next card, whatever the parent tapped
    setFeedback({ kind: "good", text: s === "great" ? praise() : encourage() });
    const next = index + 1;
    if (next >= content.items.length) {
      unlockTimer.current = setTimeout(() => finishManual(s), 900);
      return;
    }
    results.current.push(s);
    unlockTimer.current = setTimeout(() => {
      setFeedback(null);
      setIndex(next);
      lock.current = false;
    }, 900);
  }

  /* ---------------- recording ---------------- */
  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      chunks.current = [];
      const mr = new MediaRecorder(s);
      recorder.current = mr;
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      mr.onstop = () => void uploadRecording();
      mr.start();
      setRec("recording");
      setElapsed(0);
      tick.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= MAX_SECONDS) stopRecording();
          return e + 1;
        });
      }, 1000);
    } catch {
      setRec("error");
    }
  }

  function stopRecording() {
    if (tick.current) clearInterval(tick.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((tr) => tr.stop());
  }

  async function uploadRecording() {
    setRec("uploading");
    try {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      const supabase = createClient();
      const path = `${childId}/${crypto.randomUUID()}.webm`;
      const { error } = await supabase.storage
        .from("speech")
        .upload(path, blob, { contentType: "audio/webm", upsert: false });
      if (error) throw error;

      const res = await createSpeechAttemptAction({
        childId: childId!,
        exerciseId: exerciseId!,
        itemIndex: index,
        prompt: item.ask ?? item.text,
        expect: item.expect ?? [],
        minExpected: item.minExpected,
        audioPath: path,
        audioMime: "audio/webm",
        lang: locale,
      });
      if (!res.ok || !res.attemptId) throw new Error("attempt");
      attemptIds.current.push(res.attemptId);
      speechDetail.current.push({
        itemIndex: index,
        prompt: item.ask ?? item.text,
        expected: item.expect ?? [],
        status: "pending",
      });
      setRec("done");
    } catch {
      setRec("error");
    }
  }

  function nextRecorded() {
    const next = index + 1;
    if (next >= content.items.length) {
      onFinish({
        correct: 0,
        total: content.items.length,
        hintsUsed: 0,
        detail: { speech: speechDetail.current },
        speechAttemptIds: attemptIds.current,
      });
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRec("idle");
    setElapsed(0);
    setIndex(next);
  }

  const promptText = item.ask ?? item.text;

  return (
    <>
      <p className="player-intro">
        {recordMode ? t("speech.recordHint") : t("speech.parentHint")}
      </p>

      <div className="sp-card">
        {item.emoji && (
          <span className="sp-emoji" aria-hidden="true">
            {item.emoji}
          </span>
        )}
        {item.ask || recordMode ? (
          <p className="sp-ask">{promptText}</p>
        ) : (
          <p className="sp-text">{item.text}</p>
        )}
        {supported && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.9rem" }}>
            <button
              type="button"
              className="say-btn"
              onClick={() => speak(promptText, item.ask || recordMode ? 0.9 : 0.75)}
            >
              🔊 {t("sayIt")}
            </button>
          </div>
        )}
        {item.ask && !recordMode && (
          <p className="sp-expect">
            {t("speech.expected")}: <b>{item.text}</b>
          </p>
        )}
        {item.tip && <p className="sp-tip">💡 {item.tip}</p>}
      </div>

      {recordMode ? (
        <div className="sp-rec" aria-live="polite">
          {rec === "idle" && (
            <button type="button" className="sp-rec-btn" onClick={startRecording}>
              <span className="sp-rec-mic" aria-hidden="true">🎙️</span>
              {t("speech.startRec")}
            </button>
          )}
          {rec === "recording" && (
            <button type="button" className="sp-rec-btn is-live" onClick={stopRecording}>
              <span className="sp-rec-pulse" aria-hidden="true" />
              {t("speech.stopRec")} · {elapsed}s
            </button>
          )}
          {rec === "uploading" && (
            <p className="sp-rec-status">
              <span className="spinner" /> {t("speech.uploading")}
            </p>
          )}
          {rec === "done" && (
            <div className="sp-rec-done">
              {audioUrl && <audio controls src={audioUrl} className="sp-rec-audio" />}
              <p className="sp-rec-ok">✓ {t("speech.recorded")}</p>
              <div className="sp-rec-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    // discard the superseded take so it is never linked to the
                    // session (orphan row stays with session_id=null, ignored)
                    attemptIds.current.pop();
                    speechDetail.current.pop();
                    if (audioUrl) URL.revokeObjectURL(audioUrl);
                    setAudioUrl(null);
                    setRec("idle");
                  }}
                >
                  {t("speech.again")}
                </button>
                <button type="button" className="btn btn-primary" onClick={nextRecorded}>
                  {index + 1 >= content.items.length ? t("speech.finish") : t("speech.next")}
                </button>
              </div>
            </div>
          )}
          {rec === "error" && (
            <div className="sp-rec-done">
              <p className="sp-rec-err">{t("speech.recError")}</p>
              <div className="sp-rec-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setRec("idle")}>
                  {t("speech.again")}
                </button>
                <button type="button" className="btn btn-primary" onClick={nextRecorded}>
                  {index + 1 >= content.items.length ? t("speech.finish") : t("speech.next")}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="sp-score" role="group" aria-label={t("speech.scoreLabel")}>
          <button type="button" className="sp-score-btn" data-tone="good" onClick={() => score("great")}>
            <i aria-hidden="true">🌟</i>
            {t("speech.great")}
          </button>
          <button type="button" className="sp-score-btn" data-tone="mid" onClick={() => score("almost")}>
            <i aria-hidden="true">🙂</i>
            {t("speech.almost")}
          </button>
          <button type="button" className="sp-score-btn" data-tone="tricky" onClick={() => score("practice")}>
            <i aria-hidden="true">🌱</i>
            {t("speech.practice")}
          </button>
        </div>
      )}

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>
    </>
  );
}
