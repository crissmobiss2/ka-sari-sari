"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Ka Sari-Sari] Unhandled error:", error);
  }, [error]);

  return (
    <html lang="fil">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#fafafa",
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "#fff3ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            fontSize: 28,
          }}
        >
          📦
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#111",
            margin: "0 0 8px",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: "0.875rem",
            maxWidth: 300,
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          An unexpected error occurred. Our team has been notified.
          {error?.digest && (
            <>
              {" "}
              <span style={{ color: "#999", fontSize: "0.75rem" }}>
                (Ref: {error.digest})
              </span>
            </>
          )}
        </p>

        <button
          onClick={reset}
          style={{
            borderRadius: 16,
            background: "#f47028",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: "12px 28px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
