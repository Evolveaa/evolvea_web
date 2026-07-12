"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-step destructive submit: the first tap arms the button (label swaps to
 * an explicit confirmation), the second tap actually submits the surrounding
 * form. Arms back down after a short pause — no window.confirm, no accidental
 * one-tap deletes.
 */
export default function ConfirmSubmit({
  label,
  confirmLabel,
  className = "btn btn-sm btn-danger-ghost",
}: {
  label: string;
  confirmLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type={armed ? "submit" : "button"}
      className={className}
      data-armed={armed || undefined}
      aria-live="polite"
      onClick={() => {
        if (armed) return; // second tap → native submit
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3200);
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
