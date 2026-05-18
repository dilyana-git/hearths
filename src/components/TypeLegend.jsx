import React from 'react';
import { TYPE_META } from '../utils/constants';

export default function TypeLegend({ onClose }) {
  const entries = Object.entries(TYPE_META);

  return (
    <div className="panel rounded-lg shadow-2xl w-64" style={{ boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}>
      <div className="panel-header flex items-center justify-between py-2.5">
        <span className="text-xs font-medium text-parchment-300 tracking-wide uppercase">Milestone Types</span>
        <button
          onClick={onClose}
          className="text-parchment-500 hover:text-parchment-300 text-sm leading-none"
          aria-label="Close legend"
        >
          ×
        </button>
      </div>
      <div className="p-3 grid grid-cols-1 gap-y-1.5">
        {entries.map(([type, meta]) => (
          <div key={type} className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="flex-shrink-0">
              <circle
                cx="7" cy="7" r="6"
                fill={meta.color}
                fillOpacity="0.25"
                stroke={meta.color}
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-xs text-parchment-400">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
