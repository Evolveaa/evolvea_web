const CARDS = [
  {
    no: "01",
    title: "Thinking out loud",
    body: "Children who put their reasoning into words learn to notice it — and to steer it. That awareness is the skill being built.",
  },
  {
    no: "02",
    title: "Effort over answers",
    body: "The parent never solves or corrects. They ask, then wait. Being stuck stops feeling like failure and starts feeling like the work.",
  },
  {
    no: "03",
    title: "One day at a time",
    body: "Consistency of the questions matters far more than the puzzle in front of them.",
  },
];

/** Section 4 · Why it works (light). */
export default function Info() {
  return (
    <section className="info" id="info">
      <div className="container">
        <span className="eyebrow info-eyebrow">
          <span className="dot" /> Why it works
        </span>
        <h2 className="sec-title sec-title-tight">
          A small habit with a serious idea behind it.
        </h2>
        <div className="info-grid">
          {CARDS.map((card) => (
            <div className="info-card" key={card.no}>
              <span className="info-no">{card.no}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
