"use client";

import { useTranslations } from "next-intl";
import { signOutAction } from "@/lib/auth/actions";

export default function SignOutButton() {
  const t = useTranslations("shell");
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-sm btn-outline">
        {t("signOut")}
      </button>
    </form>
  );
}
