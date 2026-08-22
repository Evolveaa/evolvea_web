# Evolvea — promo videá

Všetko sa generuje z kódu: animácia aj hudba. Netreba videoeditor ani licencované
podklady — text, číslo aj tempo sa prepíšu v zdroji a video sa prerenderuje.

## Verzie

| verzia | dĺžka | scéna | hudba | o čom je |
|---|---|---|---|---|
| **promo** *(hlavná)* | 1:22 | `scene.html` | `audio.mjs` | logopédka priradí cvičenie → rodina ho robí doma → logopédka vidí, ako dieťa uvažovalo → týždeň ako 168 bodiek |
| **jednoduchá** | 0:32 | `scene-simple.html` | `audio-simple.mjs` | split screen „dostane odpoveď“ vs. „dostane otázku“ |
| **príbehová** | 1:20 | `scene-story.html` | — | starší zostrih s dlhou výmenou rodič–dieťa; hudbu treba pretimovať (`DUR` + časy v `audio.mjs`) |

## Ako to funguje

| súbor | čo robí |
|---|---|
| `scene*.html` | celá animácia ako **deterministická funkcia času** — `window.__seek(t)` nastaví každý prvok do stavu presne pre sekundu `t`. Žiadne CSS animácie ani `requestAnimationFrame`, takže ľubovoľná snímka sa dá vyrobiť nezávisle a opakovateľne. Obsahuje aj systém postáv `person()` — dve otočné ruky, náklon hlavy, obočie a ústa, vlasy, líca, tieň. |
| `render.mjs` | otvorí scénu v headless Chromiu (Playwright), odfotí snímku po snímke a poskladá MP4 cez ffmpeg. Renderuje **paralelne vo viacerých inštanciách prehliadača** — jedna inštancia snímkovanie serializuje (merané 2,4 → 2,8 fps), samostatné procesy dajú ≈ 12 fps. |
| `engine.mjs` | zvukový nástroj: `pluck` (hracia skrinka), `felt` (plstený klavír s neharmonickými alikvótami), `strings` (sláčiky s vibrátom), `pad`, `swell`, `air`, `sub` + Schroeder dozvuk. |
| `audio*.mjs` | partitúra. Žiadne samply, teda ani licenčné bremeno. |
| `fonts/` | Instrument Sans (OFL) — rovnaký font ako landing. |

## Použitie

Plné 1080p60 s pohybovým rozostrením (~20 minút; toto je master):

```bash
node tools/promo-video/render.mjs --fps=60 --blur=3 --out=tools/promo-video/out/promo-master.mp4
```

`--blur=N` vyrenderuje N medzisnímok na každú výslednú a ffmpeg ich spriemeruje
(`tmix`). Je to presne to, čo robí uzávierka kamery — bez toho pôsobí rýchly pohyb
trhane. Bez rozostrenia (~7 minút):

```bash
node tools/promo-video/render.mjs --fps=60 --out=tools/promo-video/out/promo.mp4
```

Iná verzia:

```bash
node tools/promo-video/render.mjs --scene=scene-simple.html --out=tools/promo-video/out/simple.mp4
```

Kontrolné snímky bez čakania na celé video:

```bash
node tools/promo-video/render.mjs --stills=8,24,40,55,70
```

Rýchly náhľad v nízkom rozlíšení:

```bash
node tools/promo-video/render.mjs --fps=12 --scale=0.5
```

Hudba a finálny mix:

```bash
node tools/promo-video/audio.mjs
ffmpeg -y -i tools/promo-video/out/promo-master.mp4 -i tools/promo-video/out/score.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -af "loudnorm=I=-17:TP=-1.5:LRA=9" \
  -c:a aac -b:a 192k -movflags +faststart tools/promo-video/out/evolvea-promo.mp4
```

## Scenár hlavnej verzie

Logopédka rámuje celé video — začína ním aj končí, takže „spoločník k terapii“ je
štruktúra filmu, nie veta na konci.

| čas | čo sa deje |
|---|---|
| 0 – 14 s | **U logopédky.** Pri svojom stole vyberie cvičenie na tento týždeň a priradí ho rodine. Karta odletí. |
| 17 – 45 s | **Doma.** Cvičenie **„Kto zjedol koláčiky?“** — na stole pribúdajú stopy (prázdny tanier, omrvinky, blatistá labka, odkaz „Prepáč, bol som hladný.“), nad nimi traja podozriví. Telefón podá rodičovi otázku, dieťa vyškrtne ocka aj psa a vysvetlí prečo. |
| 46 – 59 s | **Späť u logopédky.** V paneli vidí, ktorú stopu si dieťa všimlo a ako to zdôvodnilo — a uberie oporu z 3 na 2. |
| 60 – 73 s | **168 hodín.** Týždeň dieťaťa ako mriežka 24 × 7 bodiek. Jedna sa rozsvieti namodro — hodina u logopédky. Potom šesť jantárových, po jednej na každý zvyšný večer. |
| 74 – 82 s | **Záver.** Mriežka sa stiahne do stredu, modrá bodka doletí nad titulok a zostane ako značka. „Evolvea rozvíja to, ako deti myslia.“ · „Spoločník k terapii. Nie jej náhrada.“ |

Cvičenie je prevzaté zo zošita *Evolvea — Parent–Child Interaction Exercises*
(„The Case of the Missing Cookies“, logická hádanka, 8–10 rokov). Zošit ho radí
pod *Evidence-based reasoning* a *Explanation of reasoning process* — preto panel
logopédky neukazuje skóre, ale úvahu dieťaťa.

## Zvuk

Bežná príjemná hudba, nie ambient: **rozložený akord** ako podklad, pod ním mäkké
sláčiky, nad tým jednoduchá melódia. 84 BPM, celý čas v **dur** (F – C – Dm7 – B♭).
Žiadne šumové prechody, žiadne rozladené drony, krátky dozvuk — presne tie tri veci
robili z ranných verzií strašidelný dojem.

Partitúra je zviazaná so scénou. Pri mriežke 168 hodín podklad **úplne stíchne**
a ostanú len držané sláčiky; hodina u logopédky dostane jeden jasný tón a šesť
večerov šesť stúpajúcich, každý presne na svoju bodku. Ticho pred tým je to, čo
tie tóny urobí počuteľnými — meraná dynamika ide −18,6 → −18,2 → −15,4 → −14,9 dB.

## Čo upraviť ako prvé

- **Texty** — priamo v `scene*.html` pri svojej scéne (hľadaj `txt(`, `hLine`, `pcT`).
- **Tempo** — objekt `T` na začiatku scény; posunutím hraníc sa všetko prepočíta.
  Ak meníš dĺžku, uprav aj `DUR` v príslušnom `audio*.mjs`.
- **Postavy** — funkcia `person()`; `mood(-1…1)` mení ústa, `arm(l,r)` a `head()` držanie.
  Konvencia: ľavá ruka zápornejšie = nižšie, pravá kladnejšie = nižšie.
- **Farby** — objekt `C`, vychádza z `styles/landing.css` a `styles/app.css`.

## Čo video zámerne netvrdí

Overené v repozitári, aby nesľubovalo, čo produkt nerobí:

- **nediagnostikuje** žiadnu poruchu a nemeria IQ ani exekutívne funkcie ako test;
- **nenahrádza logopéda** — rodina sa do aplikácie dostane len cez jeho pozvánku;
- **cvičenie sa deje offline pri stole** — appka vedie rodiča, nie dieťa pri obrazovke;
- **žiadna AI neprispôsobuje obtiažnosť** — plán aj mieru opory 3 → 1 nastavuje logopéd;
- **žiadne percento zlepšenia** sa nepripisuje aplikácii — nemá vlastnú štúdiu.

## Vyrenderované súbory

`out/` je v `.gitignore` — MP4 majú 4 – 11 MB a do repozitára nepatria.
Ktorúkoľvek verziu vyrobíš dvoma príkazmi vyššie.
