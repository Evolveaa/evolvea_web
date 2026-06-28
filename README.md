# Evolvea — Landing Page Prototype

A static, single-page marketing prototype for **Evolvea**, a B2B2C educational-health platform
that acts as a **digital companion for speech therapy**. It helps children aged **5–10** with
speech and cognitive development by turning in-office therapy into small, guided, parent-led
exercises at home — connecting **therapists → parents → children** in one loop.

> ⚠️ This is a design/communication prototype. Forms are illustrative and don't submit anywhere.
> Figures shown (pricing, referral amounts) are taken from the project brief to communicate the
> business model, not as a final price list.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The full single-page site (semantic HTML). |
| `css/styles.css` | Design system + all styling (no framework, no build step). |
| `js/main.js` | Mobile nav, scroll reveals, stat counters, exercise modal. |
| `The Stuck puzzle.pages` | Source material — a sample parent-mediated exercise featured on the page. |

## Sections

1. **Hero** — the core promise: "therapy continues between sessions."
2. **Stats** — the model at a glance.
3. **The gap** — why between-session consistency matters.
4. **How it works** — the therapist → parent → child loop.
5. **Exercises** — the three intervention categories.
6. **Featured exercise** — *The Stuck Puzzle*, the real 6-step protocol (with full modal).
7. **For therapists** — dashboard, engagement data, referral income.
8. **For parents** — daily plan, reminders, progress.
9. **Partnership** — the B2B2C model (families / therapists / Evolvea).
10. **CTA + footer**.

## Run it

No build step — it's plain HTML/CSS/JS.

```bash
# Just open the file…
open index.html

# …or serve it locally
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Tech

- Hand-written HTML/CSS/JS — zero dependencies, zero build.
- Fonts: *Fraunces* (display) + *Plus Jakarta Sans* (text) via Google Fonts.
- Responsive (desktop → mobile), with `prefers-reduced-motion` support and basic a11y.

## Possible next steps

- Wire the early-access form to a real backend / waitlist.
- Slovak translation (`sk`) with a language toggle.
- Split into therapist vs. parent landing variants.
- Real screenshots of the product replacing the mock dashboard/phone.
