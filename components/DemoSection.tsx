import Phone from "./Phone";

/** Section 2 · Live demo (dark) — copy on the left, interactive phone on the right. */
export default function DemoSection() {
  return (
    <section className="demo" id="demo">
      <div className="container demo-inner">
        {/* Left: copy */}
        <div className="demo-copy">
          <span className="eyebrow eyebrow-dark">Live demo · Tap through it</span>
          <h2 className="demo-title">
            Tonight&apos;s exercise:
            <br />
            <em>The Stuck Puzzle.</em>
          </h2>
          <p className="demo-lead">
            A parent-guided routine that turns &quot;I can&apos;t&quot; into
            &quot;I&apos;ll try a small step.&quot; Walk the same path a parent
            follows at the table — then send the session to your logopedist for
            evaluation.
          </p>
          <ol className="demo-steps">
            <li>
              <span className="ds-no">01</span> Name the feeling — being stuck is
              normal, not failure.
            </li>
            <li>
              <span className="ds-no">02</span> Plan and reflect — type the
              answers as you go.
            </li>
            <li>
              <span className="ds-no">03</span> Let them try; prompt when stuck,
              never solve.
            </li>
            <li>
              <span className="ds-no">04</span> Anchor a takeaway, then send it to
              the logopedist.
            </li>
          </ol>
        </div>

        {/* Right: interactive phone */}
        <div className="demo-device">
          <Phone />
        </div>
      </div>
    </section>
  );
}
