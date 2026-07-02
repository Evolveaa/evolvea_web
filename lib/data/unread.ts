import { createClient } from "@/lib/supabase/server";

/**
 * Unread messages addressed to the current user across all threads
 * RLS lets them see. Their own messages are excluded.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);
  return count ?? 0;
}
