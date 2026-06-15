/**
 * EnrollmentFormErrorBoundary.jsx
 * Error boundary for enrollment form components with graceful recovery
 */

import { Component } from "react";

class EnrollmentFormErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Enrollment Form Error Boundary caught:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8f9fa"
        }}>
          {/* Header */}
          <header style={{
            backgroundColor: "#1a5c1a",
            color: "white",
            padding: "1rem 0",
            textAlign: "center"
          }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
                Maria Cristina P. Belcar Agricultural High School
              </h1>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.9 }}>
                Enrollment System
              </p>
            </div>
          </header>

          {/* Main Content */}
          <main style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem"
          }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              padding: "2rem",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "3rem",
                marginBottom: "1rem",
                color: "#dc3545"
              }}>
                ⚠️
              </div>
              <h2 style={{
                color: "#333",
                marginBottom: "1rem",
                fontSize: "1.5rem"
              }}>
                Enrollment Form Error
              </h2>
              <p style={{
                color: "#666",
                marginBottom: "1.5rem",
                lineHeight: 1.5
              }}>
                We encountered an error while loading the enrollment form.
                Please try again or contact the school administration if the problem persists.
              </p>
              {import.meta.env.DEV && (
                <details style={{
                  margin: "1rem 0",
                  textAlign: "left",
                  background: "#f8f9fa",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  border: "1px solid #dee2e6"
                }}>
                  <summary style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#495057"
                  }}>
                    Error Details (Dev Mode)
                  </summary>
                  <pre style={{
                    fontSize: "0.75rem",
                    color: "#dc3545",
                    whiteSpace: "pre-wrap",
                    marginTop: "0.5rem",
                    fontFamily: "monospace"
                  }}>
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                >
                  Try Again
                </button>
                <a
                  href="/"
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#6c757d",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    fontWeight: "500",
                    display: "inline-block",
                    textAlign: "center"
                  }}
                >
                  Back to Home
                </a>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer style={{
            backgroundColor: "#343a40",
            color: "#adb5bd",
            textAlign: "center",
            padding: "1rem",
            fontSize: "0.875rem"
          }}>
            <p style={{ margin: 0 }}>
              © 2025 Maria Cristina P. Belcar Agricultural High School. All rights reserved.
            </p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnrollmentFormErrorBoundary;