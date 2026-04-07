import React from 'react';

/**
 * ProgressBar — displays a linear progress indicator (0-100).
 */
const ProgressBar = ({ value = 0, label }) => (
  <div>
    {label && (
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
        {label} — {Math.round(value)}%
      </p>
    )}
    <div
      style={{
        background: '#1e1e3a',
        borderRadius: '9999px',
        height: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: value >= 100 ? '#34d399' : '#2563eb',
          borderRadius: '9999px',
          height: '100%',
          transition: 'width 0.3s ease',
          width: `${Math.min(100, Math.max(0, value))}%`,
        }}
      />
    </div>
  </div>
);

export default ProgressBar;
