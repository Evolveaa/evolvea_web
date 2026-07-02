import type { Database } from "@/lib/database.types";

export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

/** Monthly price a family pays (EUR). */
export const MONTHLY_PRICE_EUR = 9.9;
/** Therapist share per active family. */
export const COMMISSION_RATE = 0.3;
export const COMMISSION_PER_FAMILY_EUR =
  Math.round(MONTHLY_PRICE_EUR * COMMISSION_RATE * 100) / 100;
export const TRIAL_DAYS = 14;

export type AccessState = "active" | "trial" | "expired" | "canceled" | "none";

export function accessState(sub: SubscriptionRow | null | undefined, now = new Date()): AccessState {
  if (!sub) return "none";
  if (sub.status === "active") return "active";
  if (sub.status === "canceled") return "canceled";
  return new Date(sub.trial_ends_at) > now ? "trial" : "expired";
}

/** May the family still practise? Trial and paid both count. */
export function hasAccess(sub: SubscriptionRow | null | undefined, now = new Date()): boolean {
  const state = accessState(sub, now);
  return state === "active" || state === "trial";
}

export function trialDaysLeft(sub: SubscriptionRow, now = new Date()): number {
  return Math.max(
    0,
    Math.ceil((new Date(sub.trial_ends_at).getTime() - now.getTime()) / 86_400_000),
  );
}
