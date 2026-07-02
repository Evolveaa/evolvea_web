import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RegisterForm from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: `${t("registerTitle")} · Evolvea` };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
