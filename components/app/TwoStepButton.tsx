"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-step destructive button: first tap arms it (label swaps to an explicit
 * confirmation), second tap fires onConfirm. Disarms itself after a short
 * pause. Shared by NotesPanel, GoalsPanel and TemplatesMenu — for a submit
 * variant inside a <form action=…> see ConfirmSubmit.
 */
export default function TwoStepButton({
  label,
  confirmLabel,
  onConfirm,
  className = "btn btn-sm btn-danger-ghost",
  disabled,
  ariaLabel,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      className={className}
      aria-live="polite"
      aria-label={armed ? confirmLabel : (ariaLabel ?? label)}
      disabled={disabled}
      data-armed={armed || undefined}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
          return;
        }
        setArmed(true);
        timer.current = setTimeout(() => setArmed(false), 3200);
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
