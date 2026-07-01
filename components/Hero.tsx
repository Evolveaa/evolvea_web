/** Section 1 · Hero (light) — the core promise. */
export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="container hero-inner">
        <span className="eyebrow">
          <span className="dot" /> Metacognitive learning · Ages 6–14
        </span>
        <h1 className="hero-title">
          Ten minutes a night to rebuild how your child thinks.
        </h1>
        <p className="hero-lead">
          Evolvea is a daily exercise parents and children do together. Each
          prompt is chosen based on your child&apos;s last answer — so reasoning,
          reflection, and curiosity grow one conversation at a time.
        </p>
        <div className="hero-actions">
          <a href="#demo" className="btn btn-dark">
            Try the live demo
          </a>
          <a href="#project" className="btn btn-text">
            About the project
          </a>
        </div>
        <p className="hero-note">
          In development — the full app launches soon. The demo below is a
          preview.
        </p>
      </div>
    </section>
  );
}
