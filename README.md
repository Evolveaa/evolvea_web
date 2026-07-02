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
| Rodič — test, všetkých 53 cvičení + aktívne predplatné | `stuodstrelovaci+test@gmail.com` |
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
  (therapist)/    Rodiny · detail dieťaťa (výsledky, reflexie, správy) ·
                  plán builder · knižnica + builder vlastných cvičení ·
                  pozvánky · provízie
components/       auth/ app/ player/ therapist/ + landing komponenty
lib/
  supabase/       browser/server klienti (SSR cookies)
  exercises/      typový model obsahu + runtime validácia
  data/           dotazy + čisté odvodené funkcie (odporúčania, séria, štatistiky)
  auth|parent|therapist/actions.ts   server actions (mutácie len na serveri)
content/exercises/  zdrojové JSON knižnice (53 cvičení, 7 domén) + SPEC.md
supabase/
  migrations/     schéma + RLS (aplikované cez Supabase MCP)
  seed/           generovaný SQL seed knižnice
scripts/          validate-exercises · build-seed-sql · check-messages · e2e-smoke
proxy.ts          session refresh + gating /app a /therapist (Next 16 proxy)
```

### Dátovo riadené cvičenia

`exercises.content` (jsonb) je diskriminovaná únia 8 typov úloh
(`lib/exercises/types.ts`): `choice`, `sound_boxes` (Eľkoninove žetóny),
`memory_sequence`, `pairs`, `number_track` (Škola pozornosti),
`story_sequence`, `speech_items` (hodnotí rodič — nič sa nenahráva),
`guided_steps` (metakognitívny oblúk pocit → plán → pokus → reflexia →
ukotvenie). Prehrávač renderuje čisto z dát; nové cvičenia nevyžadujú kód.

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
