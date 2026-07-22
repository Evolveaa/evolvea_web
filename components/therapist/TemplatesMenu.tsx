"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  deleteTemplateAction,
  saveTemplateAction,
  type ClinicalFormState,
} from "@/lib/therapist/clinical-actions";
import type { PlanTemplateRow, TemplateItem } from "@/lib/data/clinical";
import TwoStepButton from "@/components/app/TwoStepButton";


export default function TemplatesMenu({
  templates,
  onApply,
  currentItems,
}: {
  templates: (PlanTemplateRow & { parsedItems: TemplateItem[] })[];
  /** Replaces the builder draft with the template's items. */
  onApply: (items: TemplateItem[]) => void;
  /** The builder's current draft — saved as a new template. */
  currentItems: TemplateItem[];
}) {
  const t = useTranslations("therapist.templates");

  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [rowError, setRowError] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [state, action, pending] = useActionState<ClinicalFormState, FormData>(
    saveTemplateAction,
    null,
  );

  // successful save → clear the mini-form, keep the popover open as feedback
  // (render-time adjustment instead of an effect, per React guidance)
  const [seenState, setSeenState] = useState<ClinicalFormState>(null);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setFormKey((k) => k + 1);
  }

  // close on outside click / Escape (focus returns to the trigger)
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function remove(templateId: string) {
    setRowError(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("template_id", templateId);
      const res = await deleteTemplateAction(fd);
      if (res?.error) setRowError(true);
    });
  }

  function apply(items: TemplateItem[]) {
    onApply(items);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="tpl-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="chip"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        📁 {t("trigger")}
      </button>

      {open && (
        <div className="tpl-pop">
          {rowError && (
            <p className="form-error" role="alert" style={{ marginBottom: "0.6rem" }}>
              {t("errors.unknown")}
            </p>
          )}

          {templates.length === 0 ? (
            <p className="card-sub" style={{ padding: "0.2rem 0 0.4rem" }}>
              {t("empty")}
            </p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {templates.map((template) => (
                <li
                  key={template.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    border: "1px solid var(--ink-line)",
                    borderRadius: 12,
                    padding: "0.5rem 0.6rem",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: "block", fontSize: "0.86rem" }}>{template.title}</b>
                    <span style={{ fontSize: "0.73rem", color: "var(--ink-soft)" }}>
                      {t("count", { count: template.parsedItems.length })}
                      {template.description ? ` · ${template.description}` : ""}
                    </span>
                  </span>
                  {currentItems.length > 0 ? (
                    <TwoStepButton
                      label={t("apply")}
                      confirmLabel={t("confirmApply")}
                      className="btn btn-sm btn-outline"
                      onConfirm={() => apply(template.parsedItems)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => apply(template.parsedItems)}
                    >
                      {t("apply")}
                    </button>
                  )}
                  <TwoStepButton
                    label="✕"
                    confirmLabel={t("confirmDelete")}
                    ariaLabel={t("deleteLabel")}
                    onConfirm={() => remove(template.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--ink-line)",
              margin: "0.75rem 0",
            }}
          />

          <form key={formKey} action={action}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {t("saveTitle")}
            </p>

            {state?.error && (
              <p className="form-error" role="alert" style={{ marginBottom: "0.6rem" }}>
                {t(`errors.${state.error}`)}
              </p>
            )}
            {state?.ok && (
              <p
                role="status"
                style={{ fontSize: "0.8rem", color: "var(--success-ink)", marginBottom: "0.5rem" }}
              >
                {t("saved")}
              </p>
            )}

            <input type="hidden" name="items" value={JSON.stringify(currentItems)} />
            <div className="field" style={{ marginBottom: "0.5rem" }}>
              <label className="label" htmlFor="tpl-title">
                {t("form.title")}
              </label>
              <input className="input" id="tpl-title" name="title" maxLength={200} required />
            </div>
            <div className="field" style={{ marginBottom: "0.6rem" }}>
              <label className="label" htmlFor="tpl-desc">
                {t("form.description")}
              </label>
              <input className="input" id="tpl-desc" name="description" maxLength={600} />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm btn-block"
              disabled={pending || currentItems.length === 0}
            >
              {pending ? t("form.saving") : t("form.submit")}
            </button>
            {currentItems.length === 0 && (
              <p className="form-hint" style={{ marginTop: "0.4rem" }}>
                {t("emptyDraftHint")}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
