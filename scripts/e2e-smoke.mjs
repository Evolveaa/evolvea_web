#!/usr/bin/env node
/**
 * Click-through smoke test against a running dev server.
 * Usage: BASE_URL=http://localhost:3001 SHOTS=/tmp/shots node scripts/e2e-smoke.mjs
 *
 * Covers: landing, auth, full parent world (today, plan, progress, messages,
 * checkout, player intro/play/quit), full therapist world (dashboard, family
 * detail incl. session answers, plan builder, library, exercise form,
 * invites, referrals, preview). Fails loudly on any missing content.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const SHOTS = process.env.SHOTS ?? "./e2e-shots";
mkdirSync(SHOTS, { recursive: true });

const PARENT = { email: "stuodstrelovaci+rodic1@gmail.com", password: "EvolveaDemo2026" };
const THERAPIST = { email: "stuodstrelovaci+logoped@gmail.com", password: "EvolveaDemo2026" };

let failures = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`✗ ${name}: ${e.message.split("\n")[0]}`);
  }
};

const browser = await chromium.launch();

async function login(page, who) {
  await page.goto(`${BASE}/login`);
  await page.fill("#email", who.email);
  await page.fill("#password", who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(app|therapist)/, { timeout: 20000 });
}

/* ---------------- landing ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await step("landing renders with sign-in link", async () => {
    await page.goto(BASE);
    await page.waitForSelector("text=Prihlásiť sa");
    await page.screenshot({ path: `${SHOTS}/00-landing.png` });
  });
  await page.close();
}

/* ---------------- parent (mobile) ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("dialog", (d) => d.accept());

  await step("parent login → today", async () => {
    await login(page, PARENT);
    await page.waitForSelector("text=Dnes cvičí Emka");
    await page.waitForSelector("text=Dnešná dávka");
    await page.screenshot({ path: `${SHOTS}/10-parent-today.png`, fullPage: true });
  });

  await step("parent plan", async () => {
    await page.goto(`${BASE}/app/plan`);
    await page.waitForSelector("text=Hlásky a pozornosť — jarný blok");
    await page.waitForSelector("text=Plán podľa oblastí");
    // areas are collapsed cards; expand one and check its exercises reveal
    await page.locator(".area-card .area-head").first().click();
    await page.waitForSelector(".area-card[open] .ex-row");
    await page.screenshot({ path: `${SHOTS}/11-parent-plan.png`, fullPage: true });
  });

  await step("parent progress with domain stats", async () => {
    await page.goto(`${BASE}/app/progress`);
    await page.waitForSelector("text=Oblasti rozvoja");
    await page.waitForSelector("text=Hlásky a zvuky");
    await page.screenshot({ path: `${SHOTS}/12-parent-progress.png`, fullPage: true });
  });

  await step("parent messages thread", async () => {
    await page.goto(`${BASE}/app/messages`);
    await page.waitForSelector("text=Nový plán");
    await page.waitForSelector("text=odovzdajte jej veľkú pochvalu");
    await page.screenshot({ path: `${SHOTS}/13-parent-messages.png`, fullPage: true });
  });

  await step("player intro → strategy → play → quit", async () => {
    await page.goto(`${BASE}/app`);
    await page.click('a.path-row[data-state="next"]');
    await page.waitForSelector("text=Sprievodca pre rodiča");
    await page.screenshot({ path: `${SHOTS}/14-player-intro.png`, fullPage: true });
    await page.click("text=Začať");
    // interactive exercises open with the metacognitive strategy pick;
    // guided activities carry their own arc and skip it
    try {
      const strategy = page.locator(".strategy-grid .opt-card").first();
      await strategy.click({ timeout: 4000 });
      await page.screenshot({ path: `${SHOTS}/14b-player-strategy.png` });
    } catch {
      /* guided exercise — no strategy step */
    }
    await page.waitForSelector(".player-prompt, .gd-step");
    await page.screenshot({ path: `${SHOTS}/15-player-play.png` });
    await page.click(".player-quit");
    // mid-play quits ask for confirmation first
    await page.click(".pl-modal .btn-primary");
    await page.waitForURL(/\/app$/);
  });

  await step("parent checkout (mock gateway)", async () => {
    await page.goto(`${BASE}/app/checkout`);
    await page.waitForSelector("text=Predplatné už beží");
    await page.screenshot({ path: `${SHOTS}/16-parent-checkout.png`, fullPage: true });
  });

  await step("parent child settings", async () => {
    await page.goto(`${BASE}/app/child`);
    await page.waitForSelector("text=Mgr. Jana Kováčová");
    await page.waitForSelector("text=Vymazať údaje dieťaťa");
    await page.screenshot({ path: `${SHOTS}/17-parent-child.png`, fullPage: true });
  });

  await page.close();
}

/* ---------------- therapist (desktop) ---------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("dialog", (d) => d.accept());

  await step("therapist login → dashboard", async () => {
    await login(page, THERAPIST);
    await page.waitForSelector("text=Vaše rodiny");
    await page.waitForSelector("text=Emka");
    await page.waitForSelector("text=Tomáš");
    await page.screenshot({ path: `${SHOTS}/20-therapist-dash.png`, fullPage: true });
  });

  await step("family detail: plan, progress, session answers, messages", async () => {
    await page.click("text=Emka");
    await page.waitForSelector("text=Aktuálny plán");
    await page.waitForSelector("text=Oblasti rozvoja");
    await page.waitForSelector("text=Posledné cvičenia");
    // expand the most recent guided session and check reflection answers
    await page.click("text=Zaseknutá skladačka >> nth=1");
    await page.waitForSelector("text=Plán fungoval od začiatku.");
    await page.screenshot({ path: `${SHOTS}/21-family-detail.png`, fullPage: true });
  });

  await step("plan builder loads with current plan", async () => {
    await page.click("text=Upraviť plán");
    await page.waitForSelector("text=Knižnica cvičení");
    await page.waitForSelector("text=Týždenná záťaž");
    await page.screenshot({ path: `${SHOTS}/22-plan-builder.png`, fullPage: true });
  });

  await step("library with filters + preview", async () => {
    await page.goto(`${BASE}/therapist/library`);
    await page.waitForSelector("text=Knižnica cvičení");
    await page.waitForSelector("text=Jazykolamy");
    await page.screenshot({ path: `${SHOTS}/23-library.png`, fullPage: true });
    await page.click(".lib-card >> text=Náhľad >> nth=0");
    await page.waitForSelector("text=Sprievodca pre rodiča");
    await page.screenshot({ path: `${SHOTS}/24-preview.png`, fullPage: true });
  });

  await step("exercise builder form", async () => {
    await page.goto(`${BASE}/therapist/library/new`);
    await page.waitForSelector("text=Nové cvičenie");
    await page.waitForSelector("text=Rečové kartičky");
    await page.screenshot({ path: `${SHOTS}/25-exercise-form.png`, fullPage: true });
  });

  await step("invites list with pending code", async () => {
    await page.goto(`${BASE}/therapist/invites`);
    await page.waitForSelector("text=Lucia");
    await page.waitForSelector("text=využitá");
    await page.screenshot({ path: `${SHOTS}/26-invites.png`, fullPage: true });
  });

  await step("referrals overview", async () => {
    await page.goto(`${BASE}/therapist/referrals`);
    await page.waitForSelector("text=Provízie");
    await page.waitForSelector("text=platí");
    await page.screenshot({ path: `${SHOTS}/27-referrals.png`, fullPage: true });
  });

  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nSMOKE OK" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
