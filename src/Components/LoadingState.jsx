import React from 'react';

/**
 * Generic Loading Skeleton Component
 */
export function Skeleton({ width = '100%', height = '20px', className = '' }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e5e7eb',
        borderRadius: '0.375rem',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
      className={className}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md', overlay = false, message = '' }) {
  if (overlay) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Spinner size={size} />
          {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <Spinner size={size} />
      {message && <p>{message}</p>}
    </div>
  );
}

/**
 * Spinner SVG Component
 */
function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 60,
  };

  const spinnerSize = sizes[size] || sizes.md;

  return (
    <svg
      width={spinnerSize}
      height={spinnerSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite',
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-20 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

/**
 * Table Skeleton Loader
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton Loader
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <Skeleton height="24px" style={{ marginBottom: '0.75rem' }} />
          <Skeleton height="16px" style={{ marginBottom: '0.5rem' }} />
          <Skeleton height="16px" width="80%" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
