#!/usr/bin/env node
/**
 * Visual audit: screenshot every screen at desktop + mobile widths.
 * Usage: BASE_URL=http://localhost:3001 SHOTS=/tmp/shots node scripts/visual-audit.mjs
 * Never throws on a single screen — logs and moves on, so one broken page
 * doesn't abort the whole sweep.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const SHOTS = process.env.SHOTS ?? "./audit-shots";
mkdirSync(SHOTS, { recursive: true });

const PARENT = { email: "stuodstrelovaci+rodic1@gmail.com", password: "EvolveaDemo2026" };
const THERAPIST = { email: "stuodstrelovaci+logoped@gmail.com", password: "EvolveaDemo2026" };

const VIEWPORTS = [
  { tag: "desktop", width: 1280, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

let n = 0;
const log = (m) => console.log(m);

async function shot(page, name, vpTag) {
  n += 1;
  const file = `${SHOTS}/${String(n).padStart(2, "0")}-${name}__${vpTag}.png`;
  try {
    await page.screenshot({ path: file, fullPage: true });
    log(`  ✓ ${name} [${vpTag}]`);
  } catch (e) {
    log(`  ✗ shot ${name} [${vpTag}]: ${e.message.split("\n")[0]}`);
  }
}

async function login(page, who) {
  await page.goto(`${BASE}/login`);
  await page.fill("#email", who.email);
  await page.fill("#password", who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(app|therapist)/, { timeout: 20000 });
}

const soft = async (name, fn) => {
  try { await fn(); } catch (e) { log(`  ! ${name}: ${e.message.split("\n")[0]}`); }
};

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  log(`\n=== ${vp.tag} (${vp.width}px) ===`);

  /* ---- public ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await soft("landing", async () => { await page.goto(BASE); await page.waitForLoadState("networkidle"); await shot(page, "landing", vp.tag); });
    await soft("login", async () => { await page.goto(`${BASE}/login`); await page.waitForLoadState("networkidle"); await shot(page, "login", vp.tag); });
    await soft("register", async () => { await page.goto(`${BASE}/register`); await page.waitForLoadState("networkidle"); await shot(page, "register", vp.tag); });
    await ctx.close();
  }

  /* ---- parent ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on("dialog", (d) => d.accept());
    await soft("parent-login", async () => { await login(page, PARENT); await page.waitForLoadState("networkidle"); });
    await soft("today", async () => { await page.goto(`${BASE}/app`); await page.waitForLoadState("networkidle"); await shot(page, "parent-today", vp.tag); });
    await soft("plan", async () => { await page.goto(`${BASE}/app/plan`); await page.waitForLoadState("networkidle");
      await soft("expand-area", async () => { await page.locator(".area-card .area-head").first().click({ timeout: 3000 }); });
      await shot(page, "parent-plan", vp.tag); });
    await soft("progress", async () => { await page.goto(`${BASE}/app/progress`); await page.waitForLoadState("networkidle"); await shot(page, "parent-progress", vp.tag); });
    await soft("messages", async () => { await page.goto(`${BASE}/app/messages`); await page.waitForLoadState("networkidle"); await shot(page, "parent-messages", vp.tag); });
    await soft("checkout", async () => { await page.goto(`${BASE}/app/checkout`); await page.waitForLoadState("networkidle"); await shot(page, "parent-checkout", vp.tag); });
    await soft("child", async () => { await page.goto(`${BASE}/app/child`); await page.waitForLoadState("networkidle"); await shot(page, "parent-child", vp.tag); });
    // player: intro → strategy → play
    await soft("player", async () => {
      await page.goto(`${BASE}/app`); await page.waitForLoadState("networkidle");
      await page.click('a.path-row[data-state="next"]', { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await shot(page, "player-intro", vp.tag);
      await soft("start", async () => { await page.click("text=Začať", { timeout: 4000 }); await page.waitForLoadState("networkidle"); });
      await soft("strategy", async () => {
        const strategy = page.locator(".strategy-grid .opt-card").first();
        await strategy.click({ timeout: 4000 });
        await shot(page, "player-strategy", vp.tag);
      });
      await soft("play", async () => { await page.waitForSelector(".player-prompt, .gd-step", { timeout: 4000 }); await shot(page, "player-play", vp.tag); });
    });
    await ctx.close();
  }

  /* ---- therapist ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on("dialog", (d) => d.accept());
    await soft("therapist-login", async () => { await login(page, THERAPIST); await page.waitForLoadState("networkidle"); });
    await soft("dashboard", async () => { await page.goto(`${BASE}/therapist`); await page.waitForLoadState("networkidle"); await shot(page, "therapist-dash", vp.tag); });
    await soft("family-detail", async () => {
      await page.goto(`${BASE}/therapist`); await page.waitForLoadState("networkidle");
      await page.click("text=Emka", { timeout: 5000 });
      await page.waitForSelector("text=Aktuálny plán", { timeout: 8000 });
      await soft("expand-session", async () => { await page.click("text=Zaseknutá skladačka >> nth=1", { timeout: 3000 }); });
      await shot(page, "therapist-family", vp.tag);
    });
    await soft("plan-builder", async () => {
      await page.click("text=Upraviť plán", { timeout: 5000 });
      await page.waitForSelector("text=Knižnica cvičení", { timeout: 8000 });
      await shot(page, "therapist-plan-builder", vp.tag);
    });
    await soft("library", async () => { await page.goto(`${BASE}/therapist/library`); await page.waitForLoadState("networkidle"); await shot(page, "therapist-library", vp.tag); });
    await soft("preview", async () => {
      await page.goto(`${BASE}/therapist/library`); await page.waitForLoadState("networkidle");
      await page.click(".row-list >> text=Náhľad >> nth=0", { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await shot(page, "therapist-preview", vp.tag);
    });
    await soft("exercise-new", async () => { await page.goto(`${BASE}/therapist/library/new`); await page.waitForLoadState("networkidle"); await shot(page, "therapist-exercise-new", vp.tag); });
    await soft("invites", async () => { await page.goto(`${BASE}/therapist/invites`); await page.waitForLoadState("networkidle"); await shot(page, "therapist-invites", vp.tag); });
    await soft("referrals", async () => { await page.goto(`${BASE}/therapist/referrals`); await page.waitForLoadState("networkidle"); await shot(page, "therapist-referrals", vp.tag); });
    await ctx.close();
  }
}

await browser.close();
log(`\nDONE — ${n} screenshots in ${SHOTS}`);
