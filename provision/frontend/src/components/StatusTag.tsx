import React from 'react';

interface StatusTagProps {
  status: string;
  className?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  const displayLabel = status.replace(/_/g, ' ');

  return (
    <span className={`status-tag ${normalized} ${className}`}>
      <span className="status-dot" />
      {displayLabel}
    </span>
  );
};
