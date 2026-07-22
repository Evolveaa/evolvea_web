"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { markThreadReadAction, sendMessageAction, type MessageState } from "@/lib/parent/actions";
import type { MessageRow } from "@/lib/data/messages";

function systemLabel(
  meta: MessageRow["meta"],
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const event =
    meta && typeof meta === "object" && !Array.isArray(meta) ? meta.event : undefined;
  if (event === "plan_assigned") {
    const title =
      meta && typeof meta === "object" && !Array.isArray(meta) && typeof meta.plan_title === "string"
        ? meta.plan_title
        : "";
    return t("planAssigned", { title });
  }
  if (event === "welcome") return t("welcome");
  return t("systemGeneric");
}

/**
 * Two-party thread (parent ↔ therapist) around one child.
 * Marks incoming messages read on mount.
 */
export default function MessageThread({
  childId,
  myId,
  messages,
  hasUnread,
}: {
  childId: string;
  myId: string;
  messages: MessageRow[];
  hasUnread: boolean;
}) {
  const t = useTranslations("messagesUi");
  const format = useFormatter();
  const [state, action, pending] = useActionState<MessageState, FormData>(
    sendMessageAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (hasUnread) void markThreadReadAction(childId);
  }, [childId, hasUnread]);

  // Skroluj len kontajner vlákna — scrollIntoView skákal celou stránkou
  // (na detaile rodiny logopéda odsúval obsah nad vláknom mimo obraz).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Odpoveď druhej strany dorazí aj bez akcie používateľa (sľubujeme 24 h) —
  // ľahký poll, len keď je karta viditeľná.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => window.clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (!pending && !state?.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <>
      {messages.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">💬</span>
          <b>{t("emptyTitle")}</b>
          <p>{t("emptyLead")}</p>
        </div>
      ) : (
        <div className="msg-list" aria-live="polite" ref={listRef}>
          {messages.map((m) => {
            if (m.kind === "system")
              return (
                <div key={m.id} className="msg msg-system">
                  {systemLabel(m.meta, t)}
                </div>
              );
            const mine = m.sender_id === myId;
            return (
              <div key={m.id} className={mine ? "msg msg-mine" : "msg msg-theirs"}>
                {m.body}
                <span className="msg-time">
                  {format.dateTime(new Date(m.created_at), {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {state?.error && (
        <p className="form-error" role="alert" style={{ marginTop: "0.8rem" }}>
          {t("sendError")}
        </p>
      )}

      <form ref={formRef} action={action} className="msg-composer">
        <input type="hidden" name="child_id" value={childId} />
        <label className="sr-only" htmlFor="msg-body">
          {t("composerLabel")}
        </label>
        <textarea
          className="textarea"
          id="msg-body"
          name="body"
          rows={2}
          maxLength={4000}
          placeholder={t("composerPlaceholder")}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? t("sendingBtn") : t("sendBtn")}
        </button>
      </form>
    </>
  );
}
