# Evolvea — promo videá

Všetko sa generuje z kódu: animácia aj hudba. Netreba videoeditor ani licencované
podklady — text, číslo aj tempo sa prepíšu v zdroji a video sa prerenderuje.

## Verzie

| verzia | dĺžka | scéna | hudba | o čom je |
|---|---|---|---|---|
| **promo** *(hlavná)* | 0:55 | `scene.html` | `audio.mjs` | abstraktná, split screen: papiere vs. záznamy → výsledok vs. úvaha → zhrnutie → 168 bodiek |
| **s postavami** | 1:22 | `scene-people.html` | `audio-people.mjs` | konkrétny príbeh: logopédka priradí cvičenie → rodina ho robí doma → logopédka vidí, ako dieťa uvažovalo |
| **jednoduchá** | 0:32 | `scene-simple.html` | `audio-simple.mjs` | split screen „dostane odpoveď“ vs. „dostane otázku“ |
| **príbehová** | 1:20 | `scene-story.html` | — | starší zostrih s dlhou výmenou rodič–dieťa; hudbu treba pretimovať |

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

Žiadne postavy, žiadny konkrétny príklad. Celý film stojí na jednom geste:
obrazovka sa rozdelí, porovná dve cesty, a zase sa spojí.

| čas | čo sa deje |
|---|---|
| 0 – 3,5 s | **Rozdelenie.** Bodka v strede prázdnej plochy, z nej vystrelí čiara na obe strany. Vľavo *bez Evolvey*, vpravo *s Evolveou*. |
| 3,5 – 14 s | **Papiere vs. záznamy.** Dvanásť tých istých večerov. Vľavo z nich rastie kopa hárkov, vpravo pribúdajú záznamy. Hárky padajú presne na doby. |
| 13 – 18,5 s | **Jeden hárok vypadne** z kopy a spadne mimo obraz: `11 hárkov · jeden chýba` proti `12 záznamov · celý týždeň naraz`. Vpravo sa zoznam zloží tak, že sa dá prečítať naraz. |
| 19,8 – 28 s | **Výsledok vs. úvaha.** Vľavo len ✓ ✗ ✓ — *len či to vyšlo*. Vpravo sa kreslí cesta: *všimlo si → vylúčilo → zdôvodnilo* — *a prečo si to myslí*. Toto je jadro produktu. |
| 28 – 38,5 s | **Zhrnutie.** Panely sa zlejú. Tri kroky a slučka, ktorá sa vracia na začiatok — celé to má zmysel len preto, že sa každý týždeň opakuje. |
| 39 – 48 s | **168 hodín.** Týždeň dieťaťa ako mriežka 24 × 7 bodiek. Jedna namodro (hodina u logopéda), šesť jantárových (večery doma). |
| 49 – 55,5 s | **Záver.** Mriežka sa stiahne do stredu, modrá bodka doletí nad titulok a zostane ako značka. |

Verzia `scene-people.html` rozpráva to isté konkrétne — cez cvičenie
**„Kto zjedol koláčiky?“** zo zošita *Evolvea — Parent–Child Interaction
Exercises* (logická hádanka, 8 – 10 rokov). Zošit ho radí pod *Evidence-based
reasoning* a *Explanation of reasoning process* — preto ani tam panel logopéda
neukazuje skóre, ale úvahu dieťaťa.

## Zvuk

Bežná príjemná hudba, nie ambient: **rozložený akord** ako podklad, pod ním mäkké
sláčiky, nad tým jednoduchá melódia. 84 BPM, celý čas v **dur** (F – C – Dm7 – B♭).
Žiadne šumové prechody, žiadne rozladené drony, krátky dozvuk — presne tie tri veci
robili z ranných verzií strašidelný dojem.

Partitúra je zviazaná so scénou dvoma spôsobmi.

**Časovo.** Dvanásť hárkov padá presne na doby, šesť večerných bodiek dostane
šesť stúpajúcich tónov. Pri mriežke 168 hodín podklad **úplne stíchne** a ostanú
len držané sláčiky; ticho pred tým je to, čo tie tóny urobí počuteľnými. Meraná
dynamika: −18,5 → −18,9 (ticho) → −15,2 (hodina) → −14,2 dB (šesť večerov).

**Priestorovo.** Film je split screen, tak je aj zvuk: čo sa deje v ľavom paneli
znie vľavo, čo v pravom znie vpravo. Meraná šírka stereo obrazu ide −26 dB
(otvorenie, úzke) → −7 dB (porovnanie panelov, najširšie) → −23 dB (po zlúčení).
Panorámovanie je rovnovýkonové, takže mono na telefóne sa zloží bez strát.

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
