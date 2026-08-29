import React from 'react';

export default function MStripeDivider({ className = '' }) {
  return (
    <div className={`h-1 w-full flex select-none ${className}`}>
      <div className="bg-m-blue-light flex-1" />
      <div className="bg-m-blue-dark flex-1" />
      <div className="bg-m-red flex-1" />
    </div>
  );
}
