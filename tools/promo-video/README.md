# Evolvea — promo / demo video

Video „Otázka namiesto odpovede“ — 1920×1080, 60 fps, **80 s**, s vlastnou hudobnou stopou.
Téma je **riešenie problémov a kognitívne schopnosti**, nie výslovnosť. Príbeh nesú postavy
a ich gestá, nie titulky. Všetko sa generuje z kódu, takže sa dá kedykoľvek prepísať replika,
zmeniť číslo alebo prestrihať tempo bez videoeditora.

## Ako to funguje

| súbor | čo robí |
|---|---|
| `scene.html` | celá animácia vrátane systému postáv (`person()` — dve otočné ruky, náklon tela a hlavy, obočie, ústa, žmurkanie) ako **deterministická funkcia času** — `window.__seek(t)` nastaví každý prvok do stavu presne pre sekundu `t`. Žiadne CSS animácie ani `requestAnimationFrame`, takže ľubovoľná snímka sa dá vyrobiť nezávisle a opakovateľne. |
| `render.mjs` | otvorí scénu v headless Chromiu (Playwright), odfotí snímku po snímke a poskladá MP4 cez ffmpeg (H.264, yuv420p). Renderuje **paralelne vo viacerých inštanciách prehliadača** — jedna inštancia snímkovanie serializuje, takže viac stránok v jednom prehliadači nezrýchli nič (merané 2,4 → 2,8 fps), samostatné procesy áno (≈ 12 fps). |
| `engine.mjs` | zvukový nástroj: plstený klavír (neharmonické alikvóty, mäkký nábeh 30 ms, vyššie alikvóty doznievajú rýchlejšie), akordový pad cez pomaly sa hýbuci filter, dychové prechody, hustý dozvuk. |
| `audio.mjs` | partitúra: pohyb harmónie Dm → B♭ → Gm → F → B♭ → F, každý tón iný. Žiadne opakované perkusívne údery. → `out/score.wav` |
| `fonts/` | Instrument Sans (OFL) — rovnaký font ako landing. |

## Použitie

Plné 1080p60 (paralelne cez viac inštancií prehliadača, ~6 minút):

```bash
node tools/promo-video/render.mjs --fps=60 --out=tools/promo-video/out/video.mp4
```

Rýchly náhľad (nízke rozlíšenie, pár sekúnd):

```bash
node tools/promo-video/render.mjs --fps=12 --scale=0.5
```

Kontrolné snímky v konkrétnych sekundách (kontrola kompozície bez čakania na video):

```bash
node tools/promo-video/render.mjs --stills=4.6,13,22,30,35
```

Len úsek (ladenie jednej scény):

```bash
node tools/promo-video/render.mjs --from=18 --to=28 --fps=30
```

Hudba a finálny mix:

```bash
node tools/promo-video/audio.mjs
ffmpeg -y -i tools/promo-video/out/video.mp4 -i tools/promo-video/out/score.wav \
  -c:v copy -c:a aac -b:a 192k -shortest tools/promo-video/out/evolvea-demo.mp4
```

## Scenár (časová os v `scene.html`, objekt `T`)

Jedna línia od začiatku do konca: **„Nedokážem to.“ → „Zvládnem to krok za krokom.“**
Repliky aj kroky cvičenia sú doslovné z `content/exercises/guided.json`.

### A — Problém (0 – 18 s)

| čas | čo je na obrazovke |
|---|---|
| 0 – 6 | jedno dieťa ožiarené displejom v tme, kamera odchádza dozadu a odhalí dvadsaťštyri ďalších |
| 6 – 10 | displeje odletia a zložia sa do grafu **41 % → 71 %** (deti denne online cez mobil, 9–10 vs 11–12 r.) |
| 11 – 18 | os grafu sa stane stupnicou 0–60: **29 zo 60** (priemer OECD 33), „Tretina nezvládne ani základnú úroveň.“ |

### B — Stôl: skutočná interakcia (18 – 50 s)

Os sa stane hranou stola. Odtiaľto do konca hovoria postavy, nie titulky.

| čas | čo sa deje |
|---|---|
| 21 | dieťa odsunie dieliky, zosunie sa: **„Nedokážem to.“** |
| 24 – 27 | **rodič sa nakloní a siahne po dielikoch** — telefón na stole ukáže „Nesiahajte na dieliky.“ a ruka sa stiahne |
| 29 | rodič: **„Čo by si mohol skúsiť ďalej?“** |
| 31 | dieťa premýšľa (bublinka s tromi bodkami) |
| 33 – 35 | dieťa: **„Nájdem tie s rovnou hranou.“** — tá istá veta sa objaví v telefóne rodiča |
| 37 | dieťa **samo priloží dielik**, rodič prikývne |
| 40 – 44 | druhá výmena: „A čo teraz?“ → „Teraz rohy.“ → dva ďalšie dieliky |
| 47 | dieťa sa usmeje: **„Zvládnem to krok za krokom.“** (kotviaca veta na výber z `guided.json`) |

Skladačka má 12 dielikov a **zostane nedokončená** (4 uložené) — metodika hodnotí cestu, nie obrázok.

### C — Predanie logopédke (50 – 66 s)

| čas | čo sa deje |
|---|---|
| 50,6 | karta s odpoveďou sa zdvihne z telefónu a letí po oblúku |
| 52,8 | **kamera prejde jedným pohybom** z kuchyne do ordinácie (svet je 3840 px široký, prechod je posun, nie strih) |
| 56 – 62 | z obrazovky notebooku **vyrastie panel** a pribúdajú v ňom presne tie vety, ktoré zazneli pri stole |
| 63 | logopédka **uberie oporu z 3 na 2** — jej rozhodnutie, nie algoritmu |

### D — Záver (67 – 80 s)

**+8 mesiacov** · „Plánovať, sledovať a hodnotiť vlastné učenie.“ (EEF) → wordmark → evolvea.sk

### Zdroje čísel

| číslo | zdroj |
|---|---|
| 41 % → 71 % | EU Kids Online IV – Slovensko (Izrael a kol., 2020), zber dát 2018 |
| 29 / 60, priemer OECD 33, tretina pod základnou úrovňou | OECD, PISA 2022 Results (Volume III) – Creative Minds, Creative Schools, faktografia pre SR |
| +8 mesiacov | EEF Teaching and Learning Toolkit — Metacognition and self-regulation, vysoká istota dôkazov |

### Ako sa drží plynulosť

1. **Pozadie je spojitá funkcia času** (`BG_STOPS`) — farba sa lerpuje, nikdy neprepne. Svetlo prichádza presne s otázkou namiesto odpovede.
2. **Kamera sa nikdy nezastaví** — pomalý drift a zoom cez celých 80 s.
3. **Jedna čiara, tri úlohy** (`AXIS`) — základňa grafu → stupnica 0–60 → hrana stola.
4. **Svet je širší než plátno** — kuchyňa 0–1920, ordinácia 1920–3840. Prechod medzi nimi je posun kamery.
5. **Karta letí ponad prechod** — nosný objekt je v obraze pred prejazdom aj po ňom.

## Čo upraviť ako prvé

- **Repliky** — pole textov v bloku „STÔL“ (`bKid.txt.textContent`, `bPar.txt.textContent`).
- **Tempo** — objekt `T` na začiatku `scene.html`; posunutím hraníc sa celá scéna prepočíta.
  Ak meníš dĺžku, uprav aj `DUR` a časy v `audio.mjs`.
- **Postavy** — funkcia `person()`; `mood(-1…1)` mení obočie aj ústa, `arm(l,r)` a `lean()` držanie tela.
  Konvencia: ľavá ruka zápornejšie = nižšie, pravá kladnejšie = nižšie.
- **Priebeh svetla** — pole `BG_STOPS`.
- **Farby** — objekt `C`, prevzatý z `styles/landing.css` a `styles/app.css`.

## Čo video zámerne netvrdí

Overené v repozitári, aby video nesľubovalo, čo produkt nerobí:

- **nediagnostikuje** žiadnu poruchu a nemeria IQ ani exekutívne funkcie ako test;
- **nenahrádza logopéda** — rodina sa do aplikácie dostane len cez jeho pozvánku;
- **cvičenie je offline pri stole** — appka vedie rodiča, dieťa neskladá skladačku v tablete
  (preto veta „Skladačka je na stole. Aplikácia vedie rodiča.“);
- **žiadna AI neprispôsobuje obtiažnosť** — plán aj mieru opory 3 → 1 nastavuje logopéd;
- **+8 mesiacov patrí METÓDE, nie aplikácii** — je to číslo EEF o metakognitívnych
  a sebaregulačných prístupoch, preto je pri ňom vždy uvedený zdroj. Aplikácia nemá vlastnú štúdiu.
