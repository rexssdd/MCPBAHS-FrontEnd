/**
 * FacultyErrorBoundary.jsx
 * Error boundary for Faculty and Staff component with graceful recovery
 */

import { Component } from "react";

class FacultyErrorBoundary extends Component {
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
    console.error("Faculty Error Boundary caught:", error, errorInfo);
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
                <h1 style={{ color: "#C62828", marginBottom: "16px" }}>⚠️ Faculty and Staff Error</h1>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                  Something went wrong loading the faculty page. Please try again.
                </p>
                {import.meta.env.DEV && (
                  <details style={{ margin: "20px 0", textAlign: "left", background: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: "8px" }}>Error Details (Development)</summary>
                    <pre style={{ fontSize: "12px", overflow: "auto", maxHeight: "200px", color: "#333" }}>
                      {this.state.error?.toString()}
                    </pre>
                    <pre style={{ fontSize: "12px", overflow: "auto", maxHeight: "200px", color: "#333" }}>
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <button
                  className="btn btn-primary"
                  onClick={this.handleReset}
                  style={{ marginTop: "16px" }}
                >
                  Reload Faculty and Staff
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

export default FacultyErrorBoundary;
