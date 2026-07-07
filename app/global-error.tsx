"use client";

// Catastrophic errors that break the root layout render here — so it must ship
// its own <html>/<body> and cannot rely on the i18n provider. Kept minimal.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="sk">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f4f2ec",
          color: "#161f33",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: "0.8rem" }}>🌧️</div>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem", letterSpacing: "-0.03em" }}>
            Niečo sa pokazilo
          </h1>
          <p style={{ color: "#5a6475", lineHeight: 1.55, margin: "0 0 1.4rem" }}>
            Prepáčte, aplikáciu sa nepodarilo načítať. Skúste to prosím znova.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#161f33",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Skúsiť znova
          </button>
        </div>
      </body>
    </html>
  );
}
