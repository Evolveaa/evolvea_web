"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Sticky header that mirrors the original prototype behaviour:
 *  - gains a translucent background once the page is scrolled
 *  - flips to its light-on-dark treatment while the dark demo section
 *    is under the header band
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const t = useTranslations("header");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);

      const demo = document.getElementById("demo");
      if (demo) {
        const { top, bottom } = demo.getBoundingClientRect();
        setOnDark(top <= 60 && bottom >= 60);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const className = [
    "site-header",
    scrolled && "scrolled",
    onDark && "on-dark",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className} id="top">
      <div className="container header-inner">
        <a href="#top" className="brand" aria-label={t("homeAria")}>
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Evolvea</span>
        </a>
        <div className="header-actions">
          <LanguageSwitcher />
          <Link href="/login" className="btn btn-text">
            {t("signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
