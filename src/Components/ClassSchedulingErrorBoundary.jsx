import React from "react";

/**
 * ClassSchedulingErrorBoundary
 * Catches rendering errors in the ClassScheduling page and displays a recovery UI.
 */
export default class ClassSchedulingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ClassScheduling] Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafbfa",
        }}>
          <div style={{
            maxWidth: "500px",
            padding: "40px",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e8ede8",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1a5c1a",
              margin: "0 0 12px",
            }}>
              Something Went Wrong
            </h2>
            <p style={{
              fontSize: "13px",
              color: "#666",
              margin: "0 0 20px",
              lineHeight: "1.5",
            }}>
              The scheduling page encountered an unexpected error and could not render properly.
            </p>
            {this.state.error && (
              <div style={{
                fontSize: "12px",
                color: "#c62828",
                background: "#ffebee",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                textAlign: "left",
                borderLeft: "3px solid #c62828",
              }}>
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                background: "#1a5c1a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
