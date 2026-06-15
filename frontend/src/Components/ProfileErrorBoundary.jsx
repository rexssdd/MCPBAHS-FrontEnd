/**
 * ProfileErrorBoundary.jsx
 * Error boundary for Profile component with graceful recovery
 */

import { Component } from "react";

class ProfileErrorBoundary extends Component {
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
    console.error("Profile Error Boundary caught:", error, errorInfo);
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
        <div className="page-layout">
          <main className="page-main">
            <div className="page-body">
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <h1 style={{ color: "#C62828", marginBottom: "16px" }}>⚠️ Profile Error</h1>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                  Something went wrong loading your profile. Please try again.
                </p>
                {import.meta.env.DEV && (
                  <details style={{ margin: "20px 0", textAlign: "left", background: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
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
                    padding: "10px 20px",
                    background: "#1976D2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProfileErrorBoundary;