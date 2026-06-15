import React from 'react';

/**
 * Inline Error Component for form fields
 */
export function FormError({ message, className = '' }) {
  if (!message) return null;

  return (
    <div
      style={{
        color: '#dc2626',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
      }}
      className={className}
    >
      {message}
    </div>
  );
}

/**
 * Form Error Alert Component
 */
export function FormErrorAlert({ errors = {}, validationErrors = null }) {
  if (!Object.keys(errors).length && !validationErrors) return null;

  // Map validation errors to field names
  const errorMap = {};
  if (validationErrors && Array.isArray(validationErrors)) {
    validationErrors.forEach(({ field, messages }) => {
      errorMap[field] = messages[0]; // Use first error message
    });
  }

  const allErrors = { ...errorMap, ...errors };

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        color: '#991b1b',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
        ⚠️ Please fix the following errors:
      </h3>
      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
        {Object.entries(allErrors).map(([field, message]) => (
          <li key={field} style={{ marginBottom: '0.25rem' }}>
            <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Field Error Wrapper Component
 */
export function FormField({ label, error, children, required = false, className = '' }) {
  return (
    <div style={{ marginBottom: '1.25rem' }} className={className}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      {error && <FormError message={error} />}
    </div>
  );
}

/**
 * Status Message Component
 */
export function StatusMessage({ type = 'info', message, onDismiss = null }) {
  if (!message) return null;

  const typeStyles = {
    error: {
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      textColor: '#991b1b',
      icon: '✕',
    },
    success: {
      backgroundColor: '#dcfce7',
      borderColor: '#bbf7d0',
      textColor: '#166534',
      icon: '✓',
    },
    warning: {
      backgroundColor: '#fef3c7',
      borderColor: '#fde68a',
      textColor: '#92400e',
      icon: '⚠',
    },
    info: {
      backgroundColor: '#dbeafe',
      borderColor: '#bfdbfe',
      textColor: '#0c4a6e',
      icon: 'ℹ',
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        borderRadius: '0.375rem',
        color: style.textColor,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: style.textColor,
            opacity: 0.7,
            padding: '0',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Validation Feedback Component
 */
export function ValidationFeedback({ type = 'info', message }) {
  if (!message) return null;

  const styles = {
    error: { color: '#dc2626', fontSize: '0.85rem' },
    success: { color: '#16a34a', fontSize: '0.85rem' },
    warning: { color: '#ea580c', fontSize: '0.85rem' },
    info: { color: '#2563eb', fontSize: '0.85rem' },
  };

  return (
    <p style={{ ...styles[type], marginTop: '0.25rem', marginBottom: 0 }}>
      {message}
    </p>
  );
}

export default FormError;
