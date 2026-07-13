import type { ExerciseDomain } from "./types";

/**
 * Methodological grounding for the exercise library.
 *
 * Every exercise follows the project's pedagogical literature (see
 * `zamer_projektu.md`). This maps each clinical domain to the verified method
 * it is built on, and lists the full source canon shown on the in-app
 * "Metodika a zdroje" page. Authors and work titles are proper citations and
 * are kept verbatim across locales.
 */

export interface DomainMethod {
  /** The named method / programme. */
  work: string;
  /** Author(s) of the method. */
  authors: string;
}

export const DOMAIN_METHOD: Record<ExerciseDomain, DomainMethod> = {
  phonemic_awareness: { work: "V krajine slov a hlások — tréning fonematického uvedomovania", authors: "Eľkonin – Mikulajová" },
  narrative: { work: "Tajná reč rozprávok — rozvoj naratívnych schopností", authors: "Ďjačenko – Stanislavová" },
  attention: { work: "Škola pozornosti — číselný rad ako externá opora", authors: "Achutinová – Pylajeva" },
  working_memory: { work: "Pracovná pamäť — kognitívne stratégie a interiorizácia", authors: "Mikulajová; Vygotskij (2009)" },
  vocabulary: { work: "Rozvoj slovnej zásoby a porozumenia reči", authors: "Mikulajová; Hanenov prístup" },
  articulation: { work: "Výslovnosť — minimálne páry a sluchové cykly", authors: "Barlow & Gierut; Hodson" },
  guided: { work: "Metakognitívne vedené aktivity rodič–dieťa", authors: "Mikulajová; Borkowski (1992)" },
};

export interface MethodologySource {
  authors: string;
  work: string;
  note: string;
}

/** The full, verified source canon — rendered on the Metodika a zdroje page. */
export const METHODOLOGY_SOURCES: MethodologySource[] = [
  { authors: "Eľkonin – Mikulajová", work: "V krajine slov a hlások", note: "Tréning fonematického uvedomovania cez farebné žetóny a schémy; zvuk pred písmenami. Najlepšie vedecky overená metóda prevencie porúch čítania." },
  { authors: "Ďjačenko – Stanislavová", work: "Tajná reč rozprávok", note: "Rozvoj naratívnych schopností — štruktúra príbehu, logické usporiadanie deja, rozprávanie pomocou symbolov a modelov." },
  { authors: "Achutinová – Pylajeva", work: "Škola pozornosti", note: "Korekcia pozornosti; číselný rad ako externá opora pri plánovaní a kontrole vlastného správania." },
  { authors: "L. S. Vygotskij", work: "Zóna najbližšieho vývinu (cit. podľa Mikulajová, 2009)", note: "Scaffolding a interiorizácia — od spoločnej činnosti s dospelým k samostatnému mysleniu dieťaťa." },
  { authors: "Mikulajová", work: "Metakognícia a tri princípy intervencie", note: "Od spoločnej činnosti k samostatnosti; od konkrétneho k abstraktnému; motivácia je súčasť učenia. „Myslenie o vlastnom myslení.“" },
  { authors: "Borkowski (1992)", work: "Profil dobrého používateľa stratégií", note: "Úspešný žiak pozná viacero stratégií, vie kedy ich použiť a chybu vníma ako prirodzenú súčasť učenia." },
  { authors: "Barlow & Gierut", work: "Minimálne páry", note: "Nácvik výslovnosti cez dvojice slov líšiace sa v jedinej hláske." },
  { authors: "Hodson", work: "Cykly / sluchová stimulácia (auditory bombardment)", note: "Opakované pokojné vystavenie cieľovej hláske; počúvanie bez tlaku na produkciu." },
  { authors: "Token Test (tradícia)", work: "Receptívne inštrukcie", note: "Porozumenie priestorovým a viacnásobným pokynom (predložky, poradie)." },
  { authors: "Hanen — „It Takes Two to Talk“ (OWL)", work: "Interakcia rodič–dieťa", note: "Observe – Wait – Listen; rozširovanie výpovede dieťaťa v bežných situáciách." },
  { authors: "Whitehurst a kol.", work: "Dialogické čítanie (PEER / CROWD)", note: "Spoločné čítanie, kde dieťa rozpráva a dospelý nadväzuje otázkami." },
  { authors: "Reese & Fivush", work: "Elaboratívne spomínanie", note: "Spoločné rozprávanie o zážitkoch rozvíja pamäť a naratív." },
  { authors: "PISA 2006", work: "Čitateľská gramotnosť SR", note: "Motivácia problému — viac než 25 % pätnásťročných je funkčne negramotných." },
];
