import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ka Sari-Sari — Wholesale Ordering for Sari-Sari Stores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(145deg, #f47028 0%, #c95515 60%, #a83e0e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
        }} />
        <div style={{
          position: "absolute",
          bottom: -120,
          left: -60,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          display: "flex",
        }} />

        {/* Logo row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          marginBottom: 32,
        }}>
          {/* Icon box */}
          <div style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            background: "rgba(255,255,255,0.18)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
          }}>
            🛒
          </div>
          {/* App name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}>
              Ka Sari-Sari
            </span>
            <span style={{
              fontSize: 22,
              fontWeight: 600,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}>
              B2B Wholesale Platform
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 32,
          color: "rgba(255,255,255,0.9)",
          margin: "0 0 20px 0",
          textAlign: "center",
          maxWidth: 760,
          fontWeight: 500,
          lineHeight: 1.4,
        }}>
          Order directly from the warehouse — straight to your sari-sari store
        </p>

        {/* Pill badges */}
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {["500+ Products", "Fast Delivery", "Fair Prices", "Mobile App"].map((label) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: 100,
              padding: "10px 22px",
              fontSize: 20,
              color: "white",
              fontWeight: 600,
              display: "flex",
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div style={{
          position: "absolute",
          bottom: 36,
          right: 48,
          fontSize: 20,
          color: "rgba(255,255,255,0.5)",
          display: "flex",
        }}>
          ka-sari-sari.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
