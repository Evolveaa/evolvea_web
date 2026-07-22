import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "@/styles/landing.css";
import Orb from "@/components/landing/Orb";
import LandingFx from "@/components/landing/LandingFx";
import LiveDemoCard from "@/components/landing/LiveDemoCard";
import Dots168 from "@/components/landing/Dots168";

const instrument = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-instrument",
});

const MAIL =
  "mailto:evolvea.eu@gmail.com?subject=Evolvea%20%E2%80%94%20pr%C3%ADstup%20pre%20logop%C3%A9da";

const DESCRIPTION =
  "Evolvea je digitálny spoločník k logopedickej a kognitívnej terapii detí od 5 do 10 rokov. Priradíte plán z panela, rodič vedie večerné cvičenie a odpovede sa vám vrátia ešte pred ďalším sedením.";

export const metadata: Metadata = {
  title: "Evolvea pre logopédov — digitálny spoločník k terapii",
  description: DESCRIPTION,
  alternates: { canonical: "https://www.evolvea.sk/" },
  openGraph: {
    type: "website",
    siteName: "Evolvea",
    title: "Evolvea pre logopédov",
    description:
      "Vaša terapia. Každý večer. V každej obývačke. Digitálny spoločník k logopedickej a kognitívnej terapii detí od 5 do 10 rokov.",
    locale: "sk_SK",
    url: "https://www.evolvea.sk/",
  },
  twitter: { card: "summary" },
};

// The landing surface is light (#FAFAF8) regardless of the app theme, so the
// mobile browser chrome should match it — override the app's dark themeColor.
export const viewport: Viewport = {
  themeColor: "#FAFAF8",
};

/** Landing „Evolvea pre logopédov" — faithful port of the web_evolvea design. */
export default function Home() {
  return (
    <div className={`lp ${instrument.variable}`}>
      <header
        data-wrap
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          paddingTop: "22px",
          paddingBottom: "22px",
          borderBottom: "1px solid #E6E3DA",
        }}
      >
        <a
          href="#top"
          aria-label="Evolvea pre logopédov"
          style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
        >
          <span style={{ fontSize: "19px", fontWeight: 500, letterSpacing: "-0.02em" }}>
            Evolvea
          </span>
          <span
            data-mh
            style={{
              fontSize: "11.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6E6B60",
            }}
          >
            pre logopédov
          </span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 36px)" }}>
          <a data-mh href="#funguje" style={{ fontSize: "14.5px", color: "#57544B" }}>
            Ako to funguje
          </a>
          <a data-mh href="#panel" style={{ fontSize: "14.5px", color: "#57544B" }}>
            Panel
          </a>
          <a data-mh href="#prax" style={{ fontSize: "14.5px", color: "#57544B" }}>
            Pre vašu prax
          </a>
          <a
            href="/login"
            style={{ fontSize: "14.5px", fontWeight: 500, color: "#2A2823", whiteSpace: "nowrap" }}
          >
            Prihlásiť sa
          </a>
          <a
            className="lift"
            href="#kontakt"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #D8D4C9",
              borderRadius: "999px",
              padding: "9px 18px",
              whiteSpace: "nowrap",
            }}
          >
            Požiadať o prístup
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section
          id="top"
          data-wrap
          style={{ paddingTop: "clamp(80px, 11vw, 150px)", position: "relative" }}
        >
          <Orb />
          <p
            data-r="0"
            style={{
              position: "relative",
              zIndex: 1,
              margin: "0 0 30px",
              fontSize: "12.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#6E6B60",
            }}
          >
            Digitálny spoločník k terapii — pre logopédov a malé kliniky
          </p>
          <h1
            style={{
              position: "relative",
              zIndex: 1,
              margin: 0,
              fontSize: "clamp(2.6rem, 8vw, 6.9rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              fontWeight: 500,
            }}
          >
            {["Vaša terapia.", "Každý večer.", "V každej obývačke."].map((line) => (
              <span
                key={line}
                style={{
                  display: "block",
                  overflow: "hidden",
                  paddingBlock: "0.07em",
                  marginBlock: "-0.07em",
                }}
              >
                <span data-line style={{ display: "block" }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <div
            data-grid2
            style={{ position: "relative", zIndex: 1, marginTop: "clamp(44px, 6vw, 76px)" }}
          >
            <div data-mh data-r="2">
              <LiveDemoCard />
            </div>
            <div>
              <p
                data-r="1"
                style={{
                  margin: 0,
                  fontSize: "clamp(1.06rem, 1.5vw, 1.28rem)",
                  lineHeight: 1.55,
                  color: "#57544B",
                  maxWidth: "60ch",
                  textWrap: "pretty",
                }}
              >
                Evolvea je digitálny spoločník k logopedickej a kognitívnej terapii detí od 5 do 10
                rokov. V paneli priradíte personalizovaný plán, rodič večer vedie desaťminútové
                sprevádzané cvičenie — a odpovede sa vám vrátia skôr, než rodina opäť príde do
                ambulancie.
              </p>
              <div
                data-r="2"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "36px",
                }}
              >
                <a
                  className="lift"
                  href={MAIL}
                  style={{
                    background: "var(--acc, #23407A)",
                    color: "#FAFAF8",
                    fontWeight: 500,
                    fontSize: "15.5px",
                    padding: "14px 26px",
                    borderRadius: "999px",
                  }}
                >
                  Požiadať o skorý prístup
                </a>
                <a
                  className="lift"
                  href="#funguje"
                  style={{
                    fontSize: "15.5px",
                    fontWeight: 500,
                    border: "1px solid #D8D4C9",
                    borderRadius: "999px",
                    padding: "13px 24px",
                  }}
                >
                  Ako to funguje ↓
                </a>
              </div>
              <p data-r="3" style={{ margin: "22px 0 0", fontSize: "13.5px", color: "#6E6B60" }}>
                Pilotná prevádzka · prístup na pozvánku
              </p>
            </div>
          </div>
        </section>

        {/* 168 hodín */}
        <section data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <div data-grid2>
            <div data-r="0">
              <div
                style={{
                  fontSize: "clamp(6rem, 17vw, 13.5rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  fontWeight: 500,
                  color: "var(--acc, #23407A)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span data-count="168">168</span>
              </div>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: "13px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "#6E6B60",
                }}
              >
                hodín má týždeň dieťaťa
              </p>
              <Dots168 />
            </div>
            <div style={{ paddingTop: "clamp(0px, 1vw, 14px)" }}>
              <h2
                data-r="1"
                style={{
                  margin: 0,
                  fontSize: "clamp(1.9rem, 3.8vw, 3.1rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  fontWeight: 500,
                  textWrap: "balance",
                  maxWidth: "24ch",
                }}
              >
                U vás strávi jednu. Evolvea naučí zvyšok pracovať pre vašu terapiu.
              </h2>
              <p
                data-r="2"
                style={{
                  margin: "26px 0 0",
                  fontSize: "1.05rem",
                  lineHeight: 1.66,
                  color: "#57544B",
                  maxWidth: "58ch",
                  textWrap: "pretty",
                }}
              >
                Najdôležitejšia časť pokroku sa deje medzi sedeniami — pri kuchynskom stole, desať
                minút pred spaním. Evolvea tieto minúty premení na pokračovanie vašej práce:
                sprevádzané rodičom, zaznamenané a pripravené na vaše vyhodnotenie.
              </p>
            </div>
          </div>
        </section>

        {/* Ako to funguje */}
        <section id="funguje" data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <p
            data-r="0"
            style={{
              margin: 0,
              fontSize: "12.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#6E6B60",
            }}
          >
            Ako to funguje
          </p>
          <h2
            data-r="1"
            style={{
              margin: "18px 0 0",
              fontSize: "clamp(2rem, 4.2vw, 3.3rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              fontWeight: 500,
              maxWidth: "20ch",
              textWrap: "balance",
            }}
          >
            Tri kroky. Žiadna réžia navyše.
          </h2>
          <div style={{ marginTop: "clamp(44px, 6vw, 76px)" }}>
            {[
              {
                n: "01",
                h: "Priradíte plán",
                p: "Vyberiete cieľ — reč, pamäť, sústredenie či sebadôveru — a Evolvea zostaví týždeň denných cvičení šitých na konkrétne dieťa. Z vášho panela, za dve minúty.",
                last: false,
              },
              {
                n: "02",
                h: "Rodič vedie, dieťa myslí",
                p: "Každý večer čaká rodinu jedno sprevádzané cvičenie na 10 – 15 minút. Rodič kladie otázky, počúva a zapisuje odpovede. Nikdy nejde o čas dieťaťa osamote pri obrazovke.",
                last: false,
              },
              {
                n: "03",
                h: "Pokrok sa vráti k vám",
                p: "Dokončené sedenie aj s poznámkami rodiča pristane vo vašom paneli. Vyhodnotíte ho na diaľku a zajtrajšie cvičenie sa prispôsobí vašim pokynom.",
                last: true,
              },
            ].map((s) => (
              <div
                key={s.n}
                data-steps
                data-r="0"
                style={{
                  borderTop: "1px solid #E6E3DA",
                  borderBottom: s.last ? "1px solid #E6E3DA" : undefined,
                  paddingTop: "clamp(28px, 4vw, 44px)",
                  paddingBottom: "clamp(28px, 4vw, 44px)",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    letterSpacing: "0.1em",
                    color: "#6E6B60",
                    fontWeight: 500,
                    paddingTop: "7px",
                  }}
                >
                  {s.n}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.45rem, 2.4vw, 1.95rem)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    fontWeight: 500,
                  }}
                >
                  {s.h}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.02rem",
                    lineHeight: 1.66,
                    color: "#57544B",
                    maxWidth: "56ch",
                    textWrap: "pretty",
                  }}
                >
                  {s.p}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Panel logopéda */}
        <section id="panel" data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <div data-grid2>
            <div>
              <p
                data-r="0"
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "#6E6B60",
                }}
              >
                Panel logopéda
              </p>
              <h2
                data-r="1"
                style={{
                  margin: "18px 0 0",
                  fontSize: "clamp(2rem, 4.2vw, 3.3rem)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                  fontWeight: 500,
                  textWrap: "balance",
                }}
              >
                Celá starostlivosť na jednej obrazovke.
              </h2>
              <p
                data-r="2"
                style={{
                  margin: "26px 0 0",
                  fontSize: "1.05rem",
                  lineHeight: 1.66,
                  color: "#57544B",
                  maxWidth: "52ch",
                  textWrap: "pretty",
                }}
              >
                Sedenia prichádzajú zoradené podľa priority — s odpoveďami dieťaťa aj poznámkami
                rodiča. Jedno vyhodnotenie zaberie približne dve minúty a rovno ním nastavíte, čo
                bude rodina cvičiť zajtra.
              </p>
            </div>
            <div data-bleed>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E6E3DA",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  data-r="0"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "12px",
                    padding: "16px 22px",
                    borderBottom: "1px solid #E6E3DA",
                  }}
                >
                  <span style={{ fontSize: "13.5px", fontWeight: 500, letterSpacing: "-0.01em" }}>
                    Evolvea · Panel
                  </span>
                  <span style={{ fontSize: "12.5px", color: "#6E6B60" }}>
                    štvrtok 16. júla · 20:14
                  </span>
                </div>
                <div role="table" aria-label="Sedenia zoradené podľa priority">
                  <div data-trow data-r="1" role="row" style={{ padding: "12px 22px 10px" }}>
                    {["Dieťa", "Program", "Posledné sedenie", "Stav"].map((c) => (
                      <span
                        key={c}
                        role="columnheader"
                        {...(c === "Program" || c === "Posledné sedenie"
                          ? { "data-mh": "" }
                          : {})}
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#767368",
                          fontWeight: 500,
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {[
                    {
                      name: "Leo",
                      age: "· 7 r.",
                      prog: "Metakognícia · Zaseknutá skladačka",
                      when: "dnes 19:42",
                      status: "Čaká na posúdenie",
                      done: false,
                    },
                    {
                      name: "Ema",
                      age: "· 6 r.",
                      prog: "Sluchové rozlišovanie",
                      when: "dnes 18:05",
                      status: "Čaká na posúdenie",
                      done: false,
                    },
                    {
                      name: "Adam",
                      age: "· 8 r.",
                      prog: "Fonematické uvedomovanie",
                      when: "dnes 17:31",
                      status: "Čaká na posúdenie",
                      done: false,
                    },
                    {
                      name: "Tomáš",
                      age: "· 9 r.",
                      prog: "Pracovná pamäť",
                      when: "včera 19:12",
                      status: "Vyhodnotené",
                      done: true,
                    },
                    {
                      name: "Nina",
                      age: "· 5 r.",
                      prog: "Slovná zásoba · vyjadrovanie",
                      when: "utorok 18:47",
                      status: "Vyhodnotené",
                      done: true,
                    },
                  ].map((row, i) => (
                    <div
                      key={row.name}
                      data-trow
                      data-r={i + 1}
                      role="row"
                      style={{ padding: "15px 22px", borderTop: "1px solid #F0EEE7" }}
                    >
                      <div role="cell">
                        <span style={{ fontWeight: 500, fontSize: "15px" }}>{row.name}</span>{" "}
                        <span style={{ color: "#6E6B60", fontSize: "13.5px" }}>{row.age}</span>
                      </div>
                      <div role="cell" data-mh style={{ fontSize: "14px", color: "#57544B" }}>
                        {row.prog}
                      </div>
                      <div
                        role="cell"
                        data-mh
                        style={{
                          fontSize: "13.5px",
                          color: "#6E6B60",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {row.when}
                      </div>
                      <div
                        role="cell"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13.5px",
                          color: row.done ? "#6E6B60" : undefined,
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: row.done ? "#C9C5B8" : "#191813",
                            flex: "none",
                          }}
                        />
                        {row.status}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  data-r="6"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "14px 22px",
                    borderTop: "1px solid #E6E3DA",
                    fontSize: "12.5px",
                    color: "#6E6B60",
                  }}
                >
                  <span>3 nové sedenia čakajú na posúdenie</span>
                  <span data-mh>všetkých 5 rodín aktívnych tento týždeň</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prečo to funguje */}
        <section data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <div data-grid2>
            <div>
              <p
                data-r="0"
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "#6E6B60",
                }}
              >
                Prečo to funguje
              </p>
              <h2
                data-r="1"
                style={{
                  margin: "18px 0 0",
                  fontSize: "clamp(2rem, 4.2vw, 3.3rem)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                  fontWeight: 500,
                  textWrap: "balance",
                }}
              >
                Spoločník k terapii. Nie jej náhrada.
              </h2>
              <p
                data-r="2"
                style={{
                  margin: "26px 0 0",
                  fontSize: "1.05rem",
                  lineHeight: 1.66,
                  color: "#57544B",
                  maxWidth: "48ch",
                  textWrap: "pretty",
                }}
              >
                Metóda stojí na metakognícii: dieťa sa učí vnímať a usmerňovať vlastné uvažovanie.
                Rodič je sprievodca, nie inštruktor — a vy zostávate odborná autorita, ktorá celý
                proces vedie a vyhodnocuje.
              </p>
            </div>
            <div>
              {[
                {
                  n: "01",
                  h: "Myslenie nahlas",
                  p: "Deti, ktoré svoje uvažovanie vyjadria slovami, sa ho učia vnímať — a usmerňovať. Práve toto uvedomenie je zručnosť, ktorá sa buduje.",
                  last: false,
                },
                {
                  n: "02",
                  h: "Úsilie namiesto odpovedí",
                  p: "Rodič nikdy nerieši ani neopravuje. Spýta sa a čaká. Zaseknutie prestáva byť zlyhaním a stáva sa súčasťou práce.",
                  last: false,
                },
                {
                  n: "03",
                  h: "Deň po dni",
                  p: "Stálosť otázok je dôležitejšia než úloha pred dieťaťom. Pravidelné domáce cvičenie vedené rodičom môže byť rovnako účinné ako sedenia v ambulancii.",
                  last: true,
                },
              ].map((it, i) => (
                <div
                  key={it.n}
                  data-r={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr",
                    gap: "18px",
                    borderTop: "1px solid #E6E3DA",
                    borderBottom: it.last ? "1px solid #E6E3DA" : undefined,
                    paddingTop: "26px",
                    paddingBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      letterSpacing: "0.1em",
                      color: "#6E6B60",
                      fontWeight: 500,
                      paddingTop: "4px",
                    }}
                  >
                    {it.n}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.25rem",
                        letterSpacing: "-0.015em",
                        fontWeight: 500,
                      }}
                    >
                      {it.h}
                    </h3>
                    <p
                      style={{
                        margin: "10px 0 0",
                        fontSize: "1rem",
                        lineHeight: 1.62,
                        color: "#57544B",
                        maxWidth: "52ch",
                        textWrap: "pretty",
                      }}
                    >
                      {it.p}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <div
            data-stats
            style={{ borderTop: "1px solid #E6E3DA", paddingTop: "clamp(36px, 5vw, 56px)" }}
          >
            {[
              { pre: null, count: "10", suf: null, p: "minút večer — cvičenie vedie rodič, nie obrazovka" },
              { pre: null, count: "24", suf: null, p: "hodín na vyhodnotenie — rodina nečaká do ďalšieho sedenia" },
              { pre: null, count: "2", suf: null, p: "minúty vám zaberie posúdenie jedného sedenia" },
              { pre: "5–", count: "10", suf: null, p: "rokov — vek detí, pre ktoré je program stavaný" },
            ].map((s, i) => (
              <div key={i} data-r={i}>
                <div
                  style={{
                    fontSize: "clamp(2.9rem, 5vw, 4.4rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.pre}
                  <span data-count={s.count}>{s.count}</span>
                  {s.suf}
                </div>
                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#6E6B60",
                    maxWidth: "24ch",
                    textWrap: "pretty",
                  }}
                >
                  {s.p}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pre vašu prax */}
        <section id="prax" data-wrap style={{ paddingTop: "clamp(120px, 16vw, 200px)" }}>
          <p
            data-r="0"
            style={{
              margin: 0,
              fontSize: "12.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#6E6B60",
            }}
          >
            Pre vašu prax
          </p>
          <h2
            data-r="1"
            style={{
              margin: "18px 0 0",
              fontSize: "clamp(2rem, 4.2vw, 3.3rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              fontWeight: 500,
              maxWidth: "24ch",
              textWrap: "balance",
            }}
          >
            Postavené pre nezávislých logopédov a malé kliniky.
          </h2>
          <div style={{ marginTop: "clamp(44px, 6vw, 76px)" }}>
            {[
              {
                h: "Starostlivosť medzi návštevami",
                p: "Vaše odporúčania žijú v rodine každý večer. Deti prichádzajú na sedenie pripravené — a rodičia konečne presne vedia, čo majú medzi návštevami robiť.",
                last: false,
              },
              {
                h: "Pravidelný príjem",
                p: "Za každú aktívnu rodinu, ktorú do Evolvey pozvete, získavate podiel z predplatného. Každý mesiac, kým rodina cvičí.",
                last: false,
              },
              {
                h: "Vaša metodika, váš rytmus",
                p: "Evolvea sa prispôsobuje vášmu plánu, nie naopak. Ciele a frekvenciu určujete vy — platforma sa stará o vedenie rodiča a zber odpovedí.",
                last: true,
              },
            ].map((it) => (
              <div
                key={it.h}
                data-grid2
                data-r="0"
                style={{
                  borderTop: "1px solid #E6E3DA",
                  borderBottom: it.last ? "1px solid #E6E3DA" : undefined,
                  paddingTop: "clamp(26px, 4vw, 40px)",
                  paddingBottom: "clamp(26px, 4vw, 40px)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "clamp(1.4rem, 2.3vw, 1.85rem)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    fontWeight: 500,
                  }}
                >
                  {it.h}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.02rem",
                    lineHeight: 1.66,
                    color: "#57544B",
                    maxWidth: "58ch",
                    textWrap: "pretty",
                  }}
                >
                  {it.p}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Kontakt (dark) + footer */}
      <section
        id="kontakt"
        aria-labelledby="kontakt-nadpis"
        style={{ background: "#191813", color: "#F5F3EC", marginTop: "clamp(130px, 17vw, 210px)" }}
      >
        <div
          data-wrap
          style={{ paddingTop: "clamp(90px, 12vw, 150px)", paddingBottom: "clamp(56px, 8vw, 90px)" }}
        >
          <p
            data-r="0"
            style={{
              margin: 0,
              fontSize: "12.5px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#A8A499",
            }}
          >
            Pilotná prevádzka
          </p>
          <h2
            id="kontakt-nadpis"
            data-r="1"
            style={{
              margin: "20px 0 0",
              fontSize: "clamp(2.5rem, 6.5vw, 5.4rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              fontWeight: 500,
              maxWidth: "16ch",
              // .lp h2 má ink farbu — na tmavej sekcii by bol nadpis neviditeľný
              color: "#F5F3EC",
            }}
          >
            Prijímame prvých logopédov.
          </h2>
          <p
            data-r="2"
            style={{
              margin: "30px 0 0",
              fontSize: "1.05rem",
              lineHeight: 1.66,
              color: "#A8A499",
              maxWidth: "52ch",
              textWrap: "pretty",
            }}
          >
            Napíšte nám pár slov o svojej praxi. Do 48 hodín vám pripravíme panel a pozvánky pre
            vaše prvé rodiny.
          </p>
          <div
            data-r="3"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "20px",
              marginTop: "44px",
            }}
          >
            <a
              className="lift"
              href={MAIL}
              style={{
                background: "var(--acc, #23407A)",
                color: "#FAFAF8",
                fontWeight: 500,
                fontSize: "15.5px",
                padding: "14px 26px",
                borderRadius: "999px",
              }}
            >
              Požiadať o pozvánku
            </a>
            <a
              href="https://www.evolvea.sk/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="alebo si preklikajte živú ukážku — otvorí sa v novom okne"
              style={{
                color: "#F5F3EC",
                fontSize: "15px",
                borderBottom: "1px solid rgba(245,243,236,0.35)",
                paddingBottom: "2px",
              }}
            >
              alebo si preklikajte živú ukážku ↗
            </a>
          </div>
          <p data-r="4" style={{ margin: "20px 0 0", fontSize: "13.5px", color: "#8C8A7E" }}>
            <a href="mailto:evolvea.eu@gmail.com" style={{ color: "inherit" }}>
              evolvea.eu@gmail.com
            </a>
          </p>
        </div>
      </section>

      <footer style={{ background: "#191813", color: "#F5F3EC" }}>
        <div
          data-wrap
          style={{
            borderTop: "1px solid rgba(245,243,236,0.14)",
            paddingTop: "26px",
            paddingBottom: "42px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 36px",
            justifyContent: "space-between",
            fontSize: "13.5px",
            color: "#8C8A7E",
          }}
        >
          <span>
            <span style={{ color: "#F5F3EC", fontWeight: 500 }}>Evolvea</span> · digitálny
            spoločník k terapii
          </span>
          <span>Vytvorené s láskou pre naše deti.</span>
          <span>© 2026</span>
        </div>
      </footer>

      <LandingFx />
    </div>
  );
}
