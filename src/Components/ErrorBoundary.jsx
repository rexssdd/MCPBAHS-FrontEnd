import React from 'react';
import { logError, ERROR_LEVELS } from '../utils/errorHandler';

/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecoverable: true,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    logError(error, {
      componentStack: errorInfo.componentStack,
      type: 'ErrorBoundary',
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      isRecoverable: !error.message?.includes('Unrecoverable'),
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            margin: '2rem auto',
            maxWidth: '600px',
            border: '2px solid #ef4444',
            borderRadius: '0.5rem',
            backgroundColor: '#fef2f2',
          }}
        >
          <h1 style={{ color: '#991b1b', marginTop: 0 }}>
            ⚠️ Something went wrong
          </h1>

          <p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>
            An unexpected error occurred in the application. Our team has been
            notified about this issue.
          </p>

          {import.meta.env.DEV && (
            <details
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#fff7ed',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <summary style={{ fontWeight: 'bold', color: '#92400e' }}>
                Error Details (Development Only)
              </summary>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <p>
                  <strong>Error:</strong> {this.state.error?.message}
                </p>
                {this.state.errorInfo && (
                  <pre
                    style={{
                      overflow: 'auto',
                      backgroundColor: '#fef3c7',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {this.state.isRecoverable && (
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
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

export default ErrorBoundary;
