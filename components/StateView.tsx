import "@/styles/app.css";

/**
 * Shared full-screen state (error / not-found / big empty). One warm, calm
 * visual: a gradient icon badge, a title, a lead, and an optional action.
 * Imports the app design system so it styles correctly even when rendered
 * from the root layout (error.tsx / not-found.tsx), which only ships globals.css.
 */
export default function StateView({
  icon,
  tone = "brand",
  title,
  lead,
  action,
}: {
  icon: React.ReactNode;
  tone?: "brand" | "warn" | "soft";
  title: string;
  lead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-view" role="status">
      <span className="state-icon" data-tone={tone} aria-hidden="true">
        {icon}
      </span>
      <h1 className="state-title">{title}</h1>
      <p className="state-lead">{lead}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}
