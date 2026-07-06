import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LibraryBrowser, { type LibraryRow } from "@/components/therapist/LibraryBrowser";
import { getSessionProfile } from "@/lib/data/user";
import { getLibrary } from "@/lib/data/therapist";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const t = await getTranslations("therapist.library");
  const [session, library, { saved }] = await Promise.all([
    getSessionProfile(),
    getLibrary(),
    searchParams,
  ]);
  if (!session) return null;

  const rows: LibraryRow[] = library.map((e) => ({
    id: e.id,
    title: e.title,
    domain: e.domain,
    modality: e.modality,
    difficulty: e.difficulty,
    duration_minutes: e.duration_minutes,
    age_min: e.age_min,
    age_max: e.age_max,
    summary: e.summary,
    is_builtin: e.is_builtin,
    is_active: e.is_active,
    mine: e.created_by === session.profile.id,
  }));

  return (
    <>
      <div className="card-head">
        <div>
          <h1 className="page-h">{t("pageTitle")}</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {t("pageLead")}
          </p>
        </div>
        <Link href="/therapist/library/new" className="btn btn-primary btn-sm">
          ＋ {t("create")}
        </Link>
      </div>

      {saved && (
        <p className="form-success" role="status" style={{ margin: "0.9rem 0" }}>
          {t("savedBanner")}
        </p>
      )}

      <div style={{ marginTop: "1rem" }}>
        <LibraryBrowser exercises={rows} />
      </div>

      <p className="form-hint" style={{ marginTop: "1.4rem", maxWidth: "70ch" }}>
        {t("methodNote")}
      </p>
    </>
  );
}
