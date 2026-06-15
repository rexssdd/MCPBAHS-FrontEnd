// src/pages/NotFound.jsx
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font, 'Inter', sans-serif)",
      background: "var(--gray-100, #f3f4f6)",
      color: "var(--gray-900, #111827)",
      padding: "32px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "96px",
        fontWeight: 800,
        color: "var(--green-800, #003d0f)",
        lineHeight: 1,
        letterSpacing: "-4px",
        marginBottom: "16px",
      }}>404</div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
        Page not found
      </h1>
      <p style={{ fontSize: "14px", color: "var(--gray-500, #6b7280)", maxWidth: "360px", marginBottom: "28px" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "var(--green-800, #003d0f)",
          color: "#fff",
          border: "none",
          padding: "10px 24px",
          borderRadius: "var(--radius-md, 8px)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Go back
      </button>
    </div>
  );
}
