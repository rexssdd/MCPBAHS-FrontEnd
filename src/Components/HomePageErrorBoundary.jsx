/**
 * HomePageErrorBoundary.jsx
 * Error boundary for HomePage component with graceful recovery
 */

import { Component } from "react";

class HomePageErrorBoundary extends Component {
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
    console.error("HomePage Error Boundary caught:", error, errorInfo);
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
        <div className="hp-page">
          <main style={{ padding: "40px 20px", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 style={{ color: "#C62828", marginBottom: "16px", fontSize: "2rem" }}>⚠️ Something went wrong</h1>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 20px" }}>
              We encountered an error loading the homepage. Please try again.
            </p>
            {import.meta.env.DEV && (
              <details style={{ margin: "20px auto", textAlign: "left", background: "#f5f5f5", padding: "12px", borderRadius: "4px", maxWidth: "600px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Error Details (Dev Mode)</summary>
                <pre style={{ fontSize: "12px", color: "#d32f2f", whiteSpace: "pre-wrap", marginTop: "8px" }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: "12px 24px",
                background: "#1976D2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                margin: "0 auto",
              }}
            >
              Try Again
            </button>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HomePageErrorBoundary;