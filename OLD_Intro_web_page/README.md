# Stará intro (landing) stránka — odložená

Pôvodná landing page (Next.js komponenty) nahradená novým dizajnom „Evolvea pre logopédov".
Tieto súbory sú VYRADENÉ z buildu (pozri `tsconfig.json` → `exclude` a `eslint.config.mjs` → `ignores`)
a nikde sa neimportujú. Sú tu len pre referenciu. `LanguageSwitcher` zostal v `components/`, lebo ho
používa aj appka (auth, AppShell, AppSidebar).

- `components/` — pôvodné SiteHeader, SiteFooter, Hero, DemoSection, Project, Info, Phone
- `page.tsx.old` — pôvodné zloženie landing stránky
