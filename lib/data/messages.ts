import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

/** Full thread for one child, oldest first. */
export async function getThread(childId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
