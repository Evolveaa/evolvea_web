import "@/styles/app.css";

/** Full-screen focus layout for exercise play (no app chrome). */
export default function PlayerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
