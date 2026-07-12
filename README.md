# Evolvea

**Digitálny spoločník k logopedickej a kognitívnej terapii detí (5 – 10 r.).**
B2B2C platforma: logopéd odporúča, rodič vedie krátke denné cvičenia doma,
dieťa rastie — a všetko sa vracia logopédovi. Netechnický popis fungovania je
v [AKO-TO-FUNGUJE.md](./AKO-TO-FUNGUJE.md).

Metodický základ: jazykovo-kognitívne spracovanie (fonematické uvedomovanie
podľa Eľkonina–Mikulajovej, pracovná pamäť, pozornosť podľa Achutinovej–Pylajevovej,
naratívne schopnosti podľa Ďjačenko–Stanislavovej, slovná zásoba, artikulácia),
Vygotského zóna najbližšieho vývinu (odstupňovaná opora 3→1) a metakognícia
podľa Mikulajovej — pozri `zamer_projektu.md`.

## Stack

- **Next.js 16** (App Router, `proxy.ts`) + **React 19** + **TypeScript strict**
- **Supabase** — Postgres + Auth + RLS (EU región); klient `@supabase/ssr`,
  v prehliadači len publishable key, žiadne tajné kľúče
- **next-intl** — SK-first, plné EN/DE preklady (cvičebný obsah je zámerne
  slovenský — trénuje sa slovenský jazyk)
- Ručne písaný CSS design systém (`app/globals.css` landing, `styles/app.css` aplikácia),
  WCAG 2.1 AA: kontrasty, focus ringy, 44px+ ciele, reduced motion
- **Playwright** — e2e smoke preklik oboch rolí

## Spustenie

```bash
npm install
cp .env.example .env.local   # doplňte URL + publishable key projektu
npm run dev                  # http://localhost:3000
```

Demo účty (heslo pre všetky: `EvolveaDemo2026`):

| Rola | E-mail |
|---|---|
| Logopéd | `stuodstrelovaci+logoped@gmail.com` |
| Rodič — test, všetky cvičenia + aktívne predplatné | `stuodstrelovaci+test@gmail.com` |
| Rodič — aktívne predplatné, 3 týždne dát | `stuodstrelovaci+rodic1@gmail.com` |
| Rodič — čerstvý trial | `stuodstrelovaci+rodic2@gmail.com` |

Všetky demo účty sú vopred potvrdené (prihlásenie funguje okamžite, bez e-mailu).

## Architektúra

```
app/
  (auth)/         /login, /register — e-mail + heslo, potvrdenie e-mailom
  (parent)/app    Dnes (denná dávka + séria) · Plán · Pokrok · Správy ·
                  Profil dieťaťa · /app/checkout (mock platobná brána)
  (player)/       full-screen prehrávač cvičení (/app/exercise/[planItemId],
                  /therapist/preview/[exerciseId])
  (therapist)/    Rodiny (triáž „potrebujú pozornosť“) · detail dieťaťa
                  (výsledky, reflexie, správy, ciele terapie, klinické
                  poznámky) · tlačiteľná správa o pokroku · plán builder
                  (+ šablóny plánov) · knižnica + builder vlastných cvičení
                  + duplikovanie · pozvánky · provízie
components/       auth/ app/ player/ therapist/ + landing komponenty
lib/
  supabase/       browser/server klienti (SSR cookies)
  exercises/      typový model obsahu + runtime validácia
  data/           dotazy + čisté odvodené funkcie (odporúčania, séria, štatistiky)
  auth|parent|therapist/actions.ts   server actions (mutácie len na serveri)
content/exercises/  zdrojové JSON knižnice (73 cvičení, 7 domén) + SPEC.md
supabase/
  migrations/     schéma + RLS (aplikované cez Supabase MCP)
  seed/           generovaný SQL seed knižnice
scripts/          validate-exercises · build-seed-sql · check-messages · e2e-smoke
proxy.ts          session refresh + gating /app a /therapist (Next 16 proxy)
```

### Dátovo riadené cvičenia

`exercises.content` (jsonb) je diskriminovaná únia 13 typov úloh
(`lib/exercises/types.ts`): `choice`, `sound_boxes` (Eľkoninove žetóny),
`memory_sequence`, `pairs`, `number_track` (Škola pozornosti),
`story_sequence`, `speech_items` (hodnotí rodič; voliteľné AI „opíš obrázok“),
`guided_steps` (metakognitívny oblúk pocit → plán → pokus → reflexia →
ukotvenie), `minimal_pairs` (minimálne páry, Barlow & Gierut),
`sound_hunt` (sluchové bombardovanie + detekcia hlásky, Hodson),
`sentence_builder` (stavba a expanzia viet), `sorting` (sémantické triedenie)
a `scene_directions` (porozumenie pokynom, Token Test). Prehrávač renderuje
čisto z dát; nové cvičenia nevyžadujú kód.

Scaffolding: každá položka plánu má `support_level` 3 → 1 (plná opora →
samostatnosť) — mení správanie prehrávača (sprievodca pre rodiča, dostupnosť
pomôcok) podľa Vygotského princípu interiorizácie.

Metakognitívny cyklus (Mikulajová): každé cvičenie beží v obale
plán → monitorovanie → hodnotenie — dieťa si pred úlohou vyberie stratégiu
(zostáva viditeľná počas hry), po úlohe sa samo ohodnotí a povie si kotviacu
vetu; logopéd vidí stratégiu, sebahodnotenie aj kalibráciu voči skutočnému
výkonu (`sessions.detail.metacognition`).

### Bezpečnosť a GDPR

- Multi-tenant **RLS na každej tabuľke**: rodič vidí len svoje deti, logopéd
  len svoje rodiny; prepojenie výhradne cez security-definer RPC
  `redeem_invite`. Triggery chránia nemenné polia (rola, väzby rodiny,
  read-receipty, prechody predplatného).
- Dátová minimalizácia: o dieťati len krstné meno, rok narodenia, avatar;
  žiadne nahrávky reči; právo na výmaz jedným tlačidlom (kaskáda).
- Negatívne RLS testy (eskalácia roly, cross-tenant čítanie/zápis) prešli;
  Supabase advisors čisté okrem zámerných helperov pre RLS.
- Odporúčanie pre produkciu (nastavenie v Supabase dashboarde): zapnúť
  leaked-password protection (HaveIBeenPwned) a vlastné SMTP.

### Predplatné (mock)

Uplatnenie pozvánky otvára 14-dňový trial (`subscriptions`). `/app/checkout`
je **priznaná testovacia brána** — nič sa neúčtuje; aktivácia prepne stav,
DB trigger stráži povolené prechody. Provízie logopéda (30 %, 2,97 €/rodina/mes.)
sa počítajú z aktívnych predplatných.

## Skripty

```bash
npm run build / lint
node scripts/validate-exercises.mjs   # kontrakt knižnice + slovenská fonematika
node scripts/build-seed-sql.mjs       # content/exercises → supabase/seed/exercises.sql
node scripts/check-messages.mjs       # parita kľúčov a ICU premenných SK/EN/DE
BASE_URL=http://localhost:3000 node scripts/e2e-smoke.mjs   # 15-krokový preklik
```

## Landing

Pôvodná lokalizovaná landing page (SK/EN/DE) zostáva na `/` vrátane
interaktívnej ukážky „Zaseknutá skladačka“ — tá istá aktivita je dnes plnou
súčasťou knižnice (`gu-zaseknuta-skladacka-2`).

## Zachytenie reči + AI vyhodnotenie (opíš obrázok)

Pri cvičeniach typu **„opíš obrázok"** (`speech_items`, kde má položka pole
`expect`) dokáže appka **nahrať, ako dieťa rozpráva**, prepísať reč na text a
nechať jazykový model posúdiť, či dieťa spomenulo prvky, ktoré by primerane
vyvíjajúce sa dieťa v danom veku pomenovalo (postavy, dej, okolnosti).

### Ako to tečie

```
dieťa nahovorí  ──►  upload do privátneho úložiska (speech bucket)
                     └─ createSpeechAttemptAction() vloží riadok speech_attempts (status=uploaded)
rodič dokončí   ──►  completeSessionAction() prepojí attempty so session_id
                     a zavolá Edge Function `assess-speech`
Edge Function   ──►  1) stiahne audio (service role)
(na pozadí)          2) STT: prepis reči na text (predvolene OpenAI gpt-4o-transcribe)
                     3) LLM: ľahký model (default OpenAI gpt-4o-mini, ten istý
                        kľúč ako STT) sémanticky posúdi, ktoré `expect`
                        koncepty dieťa spomenulo
                     4) zapíše transcript + assessment do speech_attempts
                        a prepočíta skóre + detail.speech v session
rodič/logopéd   ──►  SessionDetail ukáže prepis + zelené/coral tokeny
                     (spomenuté / chýbajúce) a jednu vetu spätnej väzby
```

Spracovanie beží **asynchrónne** (`EdgeRuntime.waitUntil`) — dokončenie
cvičenia nikdy nečaká na STT/LLM. Kým prebieha, história ukazuje stav
„Vyhodnocuje sa…".

### Konfigurácia (tvoje API kľúče)

Kľúče sú **tajomstvá Edge Function**, nikdy nie sú v prehliadači ani v `.env.local`.
Celý reťazec (prepis aj sémantické posúdenie) beží na **jednom OpenAI kľúči** —
posúdenie je malá úloha, stačí naň ľahký model:

```bash
supabase secrets set EVOLVEA_STT_API_KEY=sk-...        # OpenAI kľúč: STT aj posudzovanie
# voliteľné (defaulty):
supabase secrets set EVOLVEA_LLM_PROVIDER=openai       # openai | anthropic
supabase secrets set EVOLVEA_LLM_MODEL=gpt-4o-mini     # pri anthropic: claude-haiku-4-5
supabase secrets set EVOLVEA_LLM_API_KEY=sk-...        # vlastný kľúč na posudzovanie (inak sa použije STT kľúč)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...      # len ak chcete posudzovať Claudom
supabase secrets set EVOLVEA_STT_PROVIDER=openai       # openai | deepgram
supabase secrets set EVOLVEA_STT_MODEL=gpt-4o-transcribe
```

Nasadenie migrácie a funkcie:

```bash
supabase db push                        # aplikuje supabase/migrations/*
supabase functions deploy assess-speech # nasadí Edge Function
```

### Súkromie a GDPR (deti = citlivé údaje)

- **Explicitný súhlas per dieťa — vynútený aj v dátovej vrstve.** Nahrávanie sa
  zapne až po zaškrtnutí súhlasu v *Profil dieťaťa → Hlasové nahrávky*
  (`children.speech_consent_at`). Bez súhlasu sa nahrávacie UI nezobrazí, a
  navyše **RLS** (insert policy `speech_attempts_insert` + storage upload policy)
  odmietne akýkoľvek zápis pre dieťa bez živého súhlasu — nie len UI.
- **Privátne úložisko.** Audio je v **neverejnom** buckete `speech`; RLS ho viaže
  na rodinu cez `is_parent_of` / `is_therapist_of`. Prehliadač drží iba
  publishable key — privilegované spracovanie beží v Edge Function so service role.
- **Automatické mazanie (retencia).** Audio má `audio_delete_after` (default 30 dní).
  Funkcia `purge_expired_speech_audio()` (denný pg_cron job) zmaže staré nahrávky,
  no **prepis a vyhodnotenie ostávajú**. Zmazanie dieťaťa hard-maže aj audio
  (trigger `speech_attempts_delete_audio`). Súhlas možno kedykoľvek odvolať.
- **Minimalizácia.** Ukladá sa len to, čo je potrebné; klient nikdy neprepíše
  výsledky (trigger `protect_speech_attempt_update` povolí len prepojenie session).

## Testy, monitoring & bezpečnosť

**Unit testy** (čistá logika — bez DB) cez Node test runner + `tsx`:

```bash
npm test        # tests/*.test.ts
```

Pokrývajú validáciu obsahu cvičení (`parseExerciseContent` vrátane nového
režimu „opíš obrázok" s `expect`) a dátové agregácie, ktorým rodič verí —
`computeStreak`, `domainStats` (vrátane trendu a delty pre sparkline grafy),
`trickyByExercise`, `groupSessionsByDay`. `node scripts/e2e-smoke.mjs` a
`scripts/visual-audit.mjs` pokrývajú preklik a vizuálnu reguláciu.

**Chybové stavy.** `app/error.tsx` (v skupinách segmentov), `app/not-found.tsx`
a `app/global-error.tsx` renderujú milý stav so `StateView`. `error.tsx` má
`console.error(error)` ako **napojovací bod pre reporting** — sem stačí pridať
Sentry (`Sentry.captureException(error)`) a `instrumentation.ts` s DSN v env.

**Bezpečnosť / RLS.** Všetky privilegované operácie idú cez Postgres RLS
(security-definer helpery `is_parent_of` / `is_therapist_of`); appka drží iba
publishable key. Audio spracúva Edge Function so service role. Po `supabase db push`
odporúčame `supabase` advisors (alebo MCP `get_advisors`) na kontrolu RLS a
únikov, keďže pribudla tabuľka `speech_attempts` + storage bucket.
