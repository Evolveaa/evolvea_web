# Evolvea — Landing Page Prototype

A static, single-page prototype for **Evolvea** — *ten minutes a night to rebuild how your
child thinks.* Evolvea is a daily **metacognitive exercise** parents and children do together
(ages 6–14): each prompt adapts to the child's last answer so reasoning, reflection, and
curiosity grow one conversation at a time.

This prototype is a faithful rebuild of the recorded design reference and has two parts:

1. **Hero (light)** — the core promise, with *Try the live demo* / *See the app*.
2. **Live demo (dark)** — an **interactive phone mockup** you can tap through, mirroring the
   four steps a parent sees in the app for tonight's exercise, the *Think-Aloud Puzzle*.

> ⚠️ Design/communication prototype. The "Join the beta" and app buttons are illustrative.

## The interactive demo

The phone is a real state machine — tap the tabs or the buttons to move through it:

| Step | State | What it shows |
| --- | --- | --- |
| Intro | `Intro` | Why this exercise was chosen tonight |
| Read | `Read` | The parent's three simple jobs |
| Do | `Do` | Live capture — tap the thinking moves you hear (chips toggle, counter + timer run) |
| Reflect | `Reflect` | Reflection questions + tomorrow's adaptation |
| Done | `Done` | Session summary, then *Replay demo* |

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The single-page site (semantic HTML). |
| `css/styles.css` | Design system + styling (no framework, no build step). |
| `js/main.js` | Interactive phone state machine, signal chips, live timer, adaptive header. |
| `The Stuck puzzle.pages` | Source material from an earlier exercise concept. |

## Run it

No build step — plain HTML/CSS/JS.

```bash
open index.html                 # or:
python3 -m http.server 8000     # then visit http://localhost:8000
```

## Tech

- Hand-written HTML/CSS/JS, zero dependencies, zero build.
- Font: *Inter* via Google Fonts.
- Responsive (desktop two-column → stacked on mobile), `prefers-reduced-motion` aware.

## Possible next steps

- Wire "Join the beta" to a real waitlist.
- Slovak translation with a language toggle.
- Replace the demo's mock content with live app screens.
