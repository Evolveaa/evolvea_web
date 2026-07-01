# Evolvea — Landing Page

Marketing landing page for **Evolvea** — *ten minutes a night to rebuild how your
child thinks.* Evolvea is a daily **metacognitive exercise** parents and children do
together (ages 6–14): each prompt adapts to the child's last answer so reasoning,
reflection, and curiosity grow one conversation at a time.

The page has two focal parts:

1. **Hero (light)** — the core promise, with *Try the live demo* / *About the project*.
2. **Live demo (dark)** — an **interactive phone mockup** you can tap through, mirroring
   the steps a parent follows in the app for tonight's exercise, *The Stuck Puzzle*.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19**
- **TypeScript** (strict mode)
- **[next/font](https://nextjs.org/docs/app/getting-started/fonts)** — self-hosted *Inter*, no layout shift
- Plain, hand-authored CSS design system (`app/globals.css`) — no CSS framework
- Deploys to **Vercel** with zero config

## Project structure

```
app/
  layout.tsx        Root layout — <html>, Inter font, metadata, viewport
  page.tsx          Page composition
  globals.css       The full design system (tokens, sections, phone, responsive)
components/
  SiteHeader.tsx    Sticky header — scroll-adaptive light/dark (client)
  Hero.tsx          Hero section
  DemoSection.tsx   Dark demo section (copy + phone)
  Phone.tsx         Interactive 7-step phone state machine (client)
  Project.tsx       "About the project" section
  Info.tsx          "Why it works" section
  SiteFooter.tsx    Footer
lib/
  phone-content.ts  Typed content for the phone demo
legacy/             The original static HTML/CSS/JS prototype (kept for reference)
```

## The interactive demo

The phone is a typed state machine — tap the tabs or the buttons to walk through it:

| Step | What it shows |
| --- | --- |
| Intro | Why this exercise was chosen tonight |
| Feel | Tappable emotion chips + a live counter |
| Plan | Metacognitive planning questions |
| Engage | Facilitator prompts + an optional note |
| Reflect | Reflective evaluation questions |
| Anchor | A selectable self-efficacy statement |
| Sent | Session summary, then *Replay demo* |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
```

## Notes

- Responsive (desktop two-column → stacked on mobile), `prefers-reduced-motion` aware.
- The design is a faithful 1:1 port of the original static prototype, now preserved in
  `legacy/` for reference.
