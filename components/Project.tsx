/** Section 3 · About the project (light). */
export default function Project() {
  return (
    <section className="project" id="project">
      <div className="container">
        <span className="eyebrow info-eyebrow">
          <span className="dot" /> The project
        </span>
        <h2 className="sec-title">
          A companion to therapy, not a replacement.
        </h2>
        <p className="project-lead">
          Evolvea is a B2B2C educational-health platform that supports young
          children with speech and cognitive development. It bridges the gap
          between the therapy room and the living room: a logopedist recommends
          it, a parent runs a short guided exercise each day, and the
          child&apos;s progress flows back to shape the next session.
        </p>
        <p className="project-lead">
          A logopedist assigns a personalised plan from their dashboard. At home,
          parents get guided <b>parent-and-child</b> activities — never
          unsupervised screen time — while the platform quietly tracks progress
          and engagement.
        </p>

        <div className="who-grid">
          <div className="who-card">
            <h3>
              <span className="who-ico" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </span>{" "}
              Logopedists
            </h3>
            <p>
              Independent logopedists, speech specialists, and small clinics
              extend their care between appointments — and earn recurring income
              for every active referral.
            </p>
          </div>
          <div className="who-card">
            <h3>
              <span className="who-ico" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>{" "}
              Parents
            </h3>
            <p>
              Families get clear, guided exercises and the confidence that the
              few minutes they spend each day are spent on the right things.
            </p>
          </div>
          <div className="who-card">
            <h3>
              <span className="who-ico" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </span>{" "}
              Children
            </h3>
            <p>
              Children working on speech, memory, or concentration get steady,
              low-pressure practice that feels like time with a parent — not
              homework.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
