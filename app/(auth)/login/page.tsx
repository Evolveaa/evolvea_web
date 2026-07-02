import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: `${t("loginTitle")} · Evolvea` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <LoginForm next={next} calloutError={error === "auth_callback"} />;
}
