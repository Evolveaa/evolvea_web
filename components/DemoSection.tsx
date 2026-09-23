import { getTranslations } from "next-intl/server";
import Phone from "./Phone";

/** Section 2 · Live demo (dark) — copy on the left, interactive phone on the right. */
export default async function DemoSection() {
  const t = await getTranslations("demo");
  const steps = t.raw("steps") as string[];

  return (
    <section className="demo" id="demo">
      <div className="container demo-inner">
        {/* Left: copy */}
        <div className="demo-copy">
          <span className="eyebrow eyebrow-dark">{t("eyebrow")}</span>
          <h2 className="demo-title">
            {t("titleLead")}
            <br />
            <em>{t("titleEm")}</em>
          </h2>
          <p className="demo-lead">{t("lead")}</p>
          <ol className="demo-steps">
            {steps.map((step, i) => (
              <li key={i}>
                <span className="ds-no">{String(i + 1).padStart(2, "0")}</span>{" "}
                {step}
              </li>
            ))}
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
