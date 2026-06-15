/**
 * DashboardErrorBoundary.jsx
 * Error boundary for Dashboard component with graceful recovery
 */

import { Component } from "react";

class DashboardErrorBoundary extends Component {
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
    console.error("Dashboard Error Boundary caught:", error, errorInfo);
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
        <div className="error-boundary-fallback">
          <div className="error-boundary-container">
            <h1 className="error-boundary-title">⚠️ Dashboard Error</h1>
            <p className="error-boundary-message">
              Something went wrong loading the dashboard. Please try again.
            </p>
            {import.meta.env.DEV && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error?.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <button
              className="error-boundary-btn"
              onClick={this.handleReset}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
