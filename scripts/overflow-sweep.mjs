import { chromium } from "playwright";
const BASE = "http://localhost:3001";
const PARENT = { email: "stuodstrelovaci+rodic1@gmail.com", password: "EvolveaDemo2026" };
const THERAPIST = { email: "stuodstrelovaci+logoped@gmail.com", password: "EvolveaDemo2026" };

const browser = await chromium.launch();

async function sweep(who, routes) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill("#email", who.email);
  await page.fill("#password", who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(app|therapist)/, { timeout: 20000 });
  for (const path of routes) {
    try {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState("networkidle");
      const r = await page.evaluate(() => {
        const d = document.documentElement;
        const over = [];
        if (d.scrollWidth > d.clientWidth + 1) {
          const vw = d.clientWidth;
          for (const el of document.querySelectorAll("*")) {
            const b = el.getBoundingClientRect();
            if (b.right > vw + 1 && b.width > 40)
              over.push(`${el.tagName.toLowerCase()}.${(el.className?.toString?.()||"").split(" ")[0]} (right=${Math.round(b.right)})`);
          }
        }
        return { scrollW: d.scrollWidth, clientW: d.clientWidth, over: [...new Set(over)].slice(0, 4) };
      });
      const bad = r.scrollW > r.clientW + 1;
      console.log(`${bad ? "✗ OVERFLOW" : "✓ ok      "} ${path}  (scrollW=${r.scrollW})${bad ? "  -> " + r.over.join(", ") : ""}`);
    } catch (e) {
      console.log(`! error ${path}: ${e.message.split("\n")[0]}`);
    }
  }
  await ctx.close();
}

console.log("=== PARENT (390px) ===");
await sweep(PARENT, ["/app", "/app/plan", "/app/progress", "/app/messages", "/app/checkout", "/app/child"]);
console.log("\n=== THERAPIST (390px) ===");
await sweep(THERAPIST, ["/therapist", "/therapist/library", "/therapist/library/new", "/therapist/invites", "/therapist/referrals"]);

await browser.close();
