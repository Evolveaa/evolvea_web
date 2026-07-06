import { getTranslations } from "next-intl/server";
import MessageThread from "@/components/app/MessageThread";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import { getActiveChild } from "@/lib/data/parent";
import { getThread } from "@/lib/data/messages";
import { getSessionProfile } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const t = await getTranslations("parent");
  const session = await getSessionProfile();
  const { child } = await getActiveChild();

  if (!child || !session) {
    return (
      <>
        <h1 className="page-h">{t("messagesTitle")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const supabase = await createClient();
  const [messages, { data: therapist }] = await Promise.all([
    getThread(child.id),
    child.therapist_id
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", child.therapist_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const hasUnread = messages.some((m) => m.read_at === null && m.sender_id !== session.profile.id);

  return (
    <div className="col-narrow">
      <h1 className="page-h">{t("messagesTitle")}</h1>
      <p className="page-sub">
        {therapist?.full_name
          ? t("messagesLead", { name: therapist.full_name })
          : t("messagesLeadNoTherapist")}
      </p>
      <MessageThread
        childId={child.id}
        myId={session.profile.id}
        messages={messages}
        hasUnread={hasUnread}
      />
    </div>
  );
}
