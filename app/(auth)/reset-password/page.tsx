import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return { title: `${t("newTitle")} · Evolvea` };
}

/**
 * The user lands here from the recovery e-mail via /auth/callback, which
 * exchanges the recovery code for a session. No session → the link was
 * expired or already consumed → offer to request a fresh one.
 */
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.reset");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">{t("expiredTitle")}</h1>
        <p className="auth-lead">{t("expiredLead")}</p>
        <Link href="/forgot-password" className="btn btn-primary btn-block">
          {t("goForgot")}
        </Link>
        <p className="auth-alt">
          <Link href="/login">{t("backToLogin")}</Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
