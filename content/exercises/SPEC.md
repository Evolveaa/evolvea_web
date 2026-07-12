# Špecifikácia obsahu cvičení (autorský kontrakt)

Každý súbor `content/exercises/<domain>.json` obsahuje pole záznamov cvičení.
Obsah je **po slovensky** (terapeutický obsah je SK by design — cvičí sa slovenský
jazyk). Text je určený rodičom a deťom 5 – 10 rokov: krátke vety, láskavý tón,
žiadna odborná hantírka smerom k rodičovi (odborné pozadie patrí do `summary`).

## Záznam cvičenia

```json
{
  "slug": "pa-prve-hlasky-1",
  "domain": "phonemic_awareness",
  "modality": "interactive",
  "title": "Prvá hláska",
  "summary": "Dieťa určuje prvú hlásku slova — základ fonematického uvedomovania.",
  "parent_guide": "Povedzte slovo nahlas a zreteľne. Ak si dieťa nie je isté, zopakujte slovo a prvú hlásku pretiahnite: mmmmak.",
  "difficulty": 1,
  "age_min": 5,
  "age_max": 8,
  "duration_minutes": 5,
  "content": { "type": "choice", "items": [] }
}
```

- `slug`: unikátny, kebab-case, prefix domény (`pa-`, `wm-`, `at-`, `na-`, `vo-`, `ar-`, `gu-`).
- `domain`: `phonemic_awareness | working_memory | attention | narrative | vocabulary | articulation | guided`.
- `modality`: `interactive` (dieťa ťuká v appke) | `speech` (dieťa hovorí, rodič hodnotí) | `guided` (spoločná aktivita mimo obrazovky).
- `parent_guide`: scenár plnej opory — čo rodič hovorí a robí, keď dieťa vedie
  (Vygotského lešenie, úroveň 3). Píš v 2. osobe množného čísla („Povedzte…“).
- `difficulty`: 1 – 3. Knižnica každej domény musí pokryť všetky tri úrovne.
- `duration_minutes`: realistický odhad 3 – 12.
- `content`: presne podľa `lib/exercises/types.ts` (diskriminovaná únia).

## Typy obsahu a kedy ich použiť

| type | použitie |
|---|---|
| `choice` | výber z možností: prvá/posledná hláska, rýmy, slabiky, kategórie, protiklady, porozumenie, „čo nepatrí“ |
| `sound_boxes` | Eľkoninove žetóny: mode `count` (spočítaj hlásky) alebo `colors` (urč aj druh hlásky) |
| `memory_sequence` | zapamätaj si poradie emoji a zopakuj ho |
| `pairs` | pexeso (motívy = emoji) |
| `number_track` | číselný rad (Škola pozornosti): ťukaj čísla v poradí, s rušičmi |
| `story_sequence` | usporiadaj obrázkové karty príbehu + prerozprávaj |
| `speech_items` | dieťa hovorí, rodič hodnotí ✓/~/✗ (artikulácia, jazykolamy, menovanie, prerozprávanie) |
| `guided_steps` | vedená spoločná aktivita s krokmi, výberom pocitov/stratégií a poľami na reflexiu |
| `minimal_pairs` | minimálne páry (Barlow & Gierut): mode `listen` (rodič povie slovo, dieťa ťukne obrázok) alebo `same_different` (rodič prečíta dvojicu, dieťa súdi rovnaké/iné) |
| `sound_hunt` | lov na hlásku (Hodsonovej cykly): mode `bombardment` (dieťa LEN počúva slová s hláskou) alebo `detect` (ťukni, či hláska v slove je) |
| `sentence_builder` | stavba vety zo zamiešaných slovných kariet + voliteľná expanzia (dlhšia veta nahlas) |
| `sorting` | triedenie kariet do 2 – 3 košíkov (sémantické kategórie, hlásky, dĺžky) |
| `scene_directions` | porozumenie inštrukciám (Token Test / bariérová hra): rodič prečíta pokyn s predložkami, dieťa ukladá žetóny na plán |

Pravidlá kvality:

- `choice`: 3 – 4 možnosti, práve jedna `correct: true`; každá možnosť má `emoji`
  (bežné, všade podporované emoji) + `label`. 6 – 10 položiek na cvičenie.
  Každá položka má `hint` (ako naviesť bez prezradenia).
- `sound_boxes`: 5 – 8 slov na cvičenie; diff 1 = 2 – 3 hlásky (`count`),
  diff 2 = 3 – 4 hlásky (`colors`), diff 3 = 4 – 6 hlások (`colors`).
  Každé slovo má `emoji`.
- `memory_sequence`: diff 1 = sekvencie 2 – 3, diff 2 = 3 – 4, diff 3 = 4 – 6;
  4 – 6 položiek; `distractors` 2 – 4 emoji, ktoré sa NEsmú opakovať so sekvenciou.
- `pairs`: diff 1 = 4 – 6 párov, diff 2 – 3 = 6 – 10 párov.
- `number_track`: 3 – 5 kôl; diff 1 = 1 – 10 bez rušičov, diff 2 = do 15 + rušiče,
  diff 3 = zostupne alebo od iného čísla + rušiče.
- `story_sequence`: 2 – 4 príbehy; diff 1 = 3 karty, diff 2 = 4, diff 3 = 5 – 6.
  `retellPrompt` vždy vyzýva dieťa rozprávať vlastnými slovami.
- `speech_items`: 6 – 12 položiek; `tip` pre rodiča pri každej ťažšej položke.
- `guided_steps`: 4 – 7 krokov; aspoň jeden krok s `choices` (pocity/stratégie)
  a aspoň dva kroky s `fields` (reflexia — odpovede sa ukladajú logopédovi).
  `tip` používaj na zásadu „nikdy neriešte za dieťa“.
- `minimal_pairs`: 5 – 10 párov; pár sa musí líšiť **presne jednou hláskou**
  (koza/kosa, rak/lak, sud/súd — dĺžka je tiež kontrast). `contrast` pomenúva
  kontrast pre rodiča („s–š“). V `listen` striedaj `say` a/b; v `same_different`
  miešaj `same: true/false`. Obe slová páru musia mať emoji a byť deťom známe.
- `sound_hunt`: `bombardment` 8 – 14 slov, VŠETKY s hláskou (čisté počúvanie,
  neskóruje sa); `detect` 6 – 12 slov, vyvážene s hláskou aj bez nej.
  `target` je hláska tak, ako sa píše („š“). Slová vyberaj tak, aby hláska
  bola počuteľná (bez spodobovania).
- `sentence_builder`: 4 – 8 viet; diff 1 = 2 – 3 slová, diff 2 = 3 – 4,
  diff 3 = 4 – 7 (+ `distractors`). Slová v `words` v SPRÁVNOM poradí,
  prehrávač ich zamieša. `expansion` (voliteľná) rozvíja vetu — všetky
  `options` musia byť gramaticky správne na pozícii `insertAt`.
- `sorting`: 2 – 3 kategórie, 6 – 12 kariet, každá kategória aspoň 2 karty.
  Kategórie musia byť disjunktné (žiadna karta nepatrí do dvoch).
- `scene_directions`: plán 2 – 5 × 2 – 5 s pevnými `anchors` (dom, strom…);
  3 – 6 kôl; diff 1 = 1 žetón/kolo, diff 2 = 1 – 2, diff 3 = 2 – 3.
  `instruction` číta rodič nahlas — používaj predložky (nad, pod, vedľa,
  medzi, za) a formuluj jednoznačne voči mriežke. Žetóny nesmú cieliť na
  bunku kotvy.

## Slovenská fonematika (KRITICKÉ pre `sound_boxes` a hláskové úlohy)

Jedna **hláska ≠ jedno písmeno**:

- Digrafy **ch, dz, dž** = JEDNA hláska (kind `consonant`): `chlieb` → ch-l-ie-b (4).
- Dvojhlásky **ia, ie, iu, ô** = JEDNA hláska (kind `diphthong`): `mlieko` → m-l-ie-k-o (5), `kôň` → k-ô-ň (3).
- Dlhé samohlásky **á é í ó ú ý** = kind `long_vowel`.
- Krátke samohlásky **a e i o u y ä** = kind `vowel`.
- Všetko ostatné = kind `consonant` (aj mäkké ď ť ň ľ, aj slabikotvorné r, l).
- Vyhni sa slovám: s **x** (dve hlásky), so spodobovaním, kde sa výslovnosť
  líši od písma (dub, vták, loďka, sladký…), s **ĺ ŕ**, cudzím slovám.
  Používaj priezračné slová: dom, mak, syr, mama, ryba, koza, mlieko, slon…
- Slabiky (di/ti/ni/li čítané mäkko) neriešime — vyberaj slová, kde to nemätie.

## Štýl

- Deti: tykanie, hravé, povzbudzujúce. Rodič: vykanie, pokojné, konkrétne.
- Chyba je súčasť učenia — hinty navádzajú otázkou, nikdy neprezrádzajú.
- Metakognitívny rámec (Mikulajová): plánuj → sleduj sa → zhodnoť.
  Pri `guided_steps` vždy: pomenovanie pocitu → plán → samostatný pokus
  dieťaťa → reflexia → ukotvenie („Zvládnem to krok za krokom.“).

## Overenie

Po napísaní súboru spusti `node scripts/validate-exercises.mjs` a oprav všetky
ERROR aj WARN, kým výstup nie je čistý.
