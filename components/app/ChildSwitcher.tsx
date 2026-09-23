"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setActiveChildAction } from "@/lib/parent/actions";
import type { Child } from "@/lib/data/parent";

export default function ChildSwitcher({
  kids,
  activeId,
}: {
  kids: Child[];
  activeId: string;
}) {
  const t = useTranslations("parent");
  const [pending, startTransition] = useTransition();
  if (kids.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={t("switchChild")}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.1rem" }}
    >
      {kids.map((kid) => (
        <button
          key={kid.id}
          type="button"
          className="chip"
          style={
            kid.id === activeId
              ? { background: "var(--accent-soft)", color: "var(--accent-ink)", borderColor: "transparent" }
              : undefined
          }
          aria-pressed={kid.id === activeId}
          disabled={pending}
          onClick={() => startTransition(() => setActiveChildAction(kid.id))}
        >
          <span aria-hidden="true">{kid.avatar}</span> {kid.first_name}
        </button>
      ))}
    </div>
  );
}
