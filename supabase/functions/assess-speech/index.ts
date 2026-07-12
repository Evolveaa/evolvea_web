// deno-lint-ignore-file no-explicit-any
// ============================================================
// Evolvea — assess-speech Edge Function
//
// Async pipeline for one recorded speech attempt:
//   audio (private storage) → STT → Claude judges transcript vs. expected
//   concepts → write transcript + assessment → recompute the session score.
//
// Runs with the SERVICE ROLE (never exposed to the browser). Secrets come
// from Edge Function env vars — set them with:
//   supabase secrets set ANTHROPIC_API_KEY=... EVOLVEA_STT_API_KEY=...
//
// Invoked from the Next.js server action once the parent finishes the
// exercise: supabase.functions.invoke("assess-speech", { body: { attempt_id } })
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.70";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- config (all overridable via `supabase secrets set`) ----
const LLM_MODEL = Deno.env.get("EVOLVEA_LLM_MODEL") ?? "claude-opus-4-8";
const STT_PROVIDER = (Deno.env.get("EVOLVEA_STT_PROVIDER") ?? "openai").toLowerCase();
const STT_MODEL = Deno.env.get("EVOLVEA_STT_MODEL") ?? "gpt-4o-transcribe";
const STT_KEY = Deno.env.get("EVOLVEA_STT_API_KEY") ?? "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

/** Speech-to-text. Default: OpenAI transcription; swap provider via env. */
async function transcribe(audio: Blob, lang: string): Promise<string> {
  if (STT_PROVIDER === "openai") {
    const form = new FormData();
    form.append("file", audio, "speech.webm");
    form.append("model", STT_MODEL);
    form.append("language", lang);
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${STT_KEY}` },
      body: form,
    });
    if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return String(json.text ?? "").trim();
  }
  if (STT_PROVIDER === "deepgram") {
    const res = await fetch(
      `https://api.deepgram.com/v1/listen?model=${encodeURIComponent(STT_MODEL)}&language=${lang}&smart_format=true`,
      {
        method: "POST",
        headers: { Authorization: `Token ${STT_KEY}`, "Content-Type": audio.type || "audio/webm" },
        body: await audio.arrayBuffer(),
      },
    );
    if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return String(json?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "").trim();
  }
  throw new Error(`unknown STT provider: ${STT_PROVIDER}`);
}

const ASSESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    mentioned: { type: "array", items: { type: "string" }, description: "expected concepts the child clearly named or described" },
    missed: { type: "array", items: { type: "string" }, description: "expected concepts the child did not mention" },
    extra: { type: "array", items: { type: "string" }, description: "other relevant things the child described that were not in the list" },
    feedback: { type: "string", description: "one warm, concrete sentence for the parent/therapist, in the child's language" },
  },
  required: ["mentioned", "missed", "extra", "feedback"],
} as const;

const LANG_NAME: Record<string, string> = { sk: "Slovak", en: "English", de: "German" };

/** Claude decides — semantically — which expected concepts the child mentioned. */
async function assess(
  transcript: string,
  expected: string[],
  prompt: string,
  lang: string,
): Promise<{ mentioned: string[]; missed: string[]; extra: string[]; feedback: string }> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const language = LANG_NAME[lang] ?? "Slovak";
  const system =
    "You are a supportive speech & language therapist reviewing a young child's spoken picture description. " +
    "Judge MEANING, not exact words: a child saying \"psík\" counts for the concept \"pes\"; a described action counts for that action. " +
    "Be generous and developmentally appropriate — accept child-like or diminutive forms and partial phrasing. " +
    `The transcript is auto-generated speech-to-text and may contain small errors. Write the feedback sentence in ${language}.`;
  const user =
    `The child was asked: "${prompt}".\n` +
    `Concepts a typically-developing child should mention:\n${expected.map((e) => `- ${e}`).join("\n")}\n\n` +
    `The child said (transcript):\n"""${transcript}"""\n\n` +
    "Return which expected concepts were mentioned vs. missed, any extra relevant things described, and one warm sentence of feedback.";

  const resp: any = await anthropic.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: { type: "json_schema", schema: ASSESS_SCHEMA } },
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = (resp.content ?? []).find((b: any) => b.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text);
  return {
    mentioned: Array.isArray(parsed.mentioned) ? parsed.mentioned.map(String) : [],
    missed: Array.isArray(parsed.missed) ? parsed.missed.map(String) : [],
    extra: Array.isArray(parsed.extra) ? parsed.extra.map(String) : [],
    feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
  };
}

/** Fold speech results into the session. Delegated to a row-locking SQL
 *  function so concurrent per-attempt invocations can't lose each other's
 *  updates (see recompute_session_speech in the migration). */
async function updateSession(admin: any, sessionId: string) {
  await admin.rpc("recompute_session_speech", { p_session_id: sessionId });
}

/** The heavy work — runs in the background so the HTTP caller returns fast. */
async function process(admin: any, attemptId: string) {
  const { data: attempt } = await admin
    .from("speech_attempts").select("*").eq("id", attemptId).single();
  if (!attempt || attempt.status !== "uploaded") return;

  try {
    // 1. transcribe
    await admin.from("speech_attempts").update({ status: "transcribing", stt_model: `${STT_PROVIDER}:${STT_MODEL}`, llm_model: LLM_MODEL }).eq("id", attemptId);
    const { data: file, error: dlErr } = await admin.storage.from("speech").download(attempt.audio_path);
    if (dlErr || !file) throw new Error(`download failed: ${dlErr?.message ?? "no file"}`);
    const transcript = await transcribe(file, attempt.lang ?? "sk");

    // 2. assess
    await admin.from("speech_attempts").update({ status: "assessing", transcript }).eq("id", attemptId);
    const expected: string[] = Array.isArray(attempt.expected) ? attempt.expected : [];
    const assessment = await assess(transcript, expected, attempt.prompt ?? "", attempt.lang ?? "sk");

    // 3. store
    await admin.from("speech_attempts").update({
      status: "done", transcript, assessment, processed_at: new Date().toISOString(),
    }).eq("id", attemptId);
  } catch (e) {
    await admin.from("speech_attempts").update({
      status: "failed", error: String(e).slice(0, 1000), processed_at: new Date().toISOString(),
    }).eq("id", attemptId);
  }
  if (attempt.session_id) await updateSession(admin, attempt.session_id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let attemptId: string;
  try {
    ({ attempt_id: attemptId } = await req.json());
    if (!attemptId) throw new Error("attempt_id required");
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: CORS });
  }

  // Authorize: the caller must be able to SEE this attempt under RLS
  // (parent or therapist of the child) — not just hold any valid JWT.
  const caller = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: visible } = await caller
    .from("speech_attempts").select("id").eq("id", attemptId).maybeSingle();
  if (!visible) {
    return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: CORS });
  }

  // Respond immediately; STT + LLM run in the background (seconds).
  const job = process(admin, attemptId);
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(job);
  else await job; // local dev fallback
  return new Response(JSON.stringify({ ok: true, queued: true }), { headers: CORS });
});
