import React from 'react';
import { SORT_OPTIONS } from '../utils/constants';

export default function Header({
  activeView, views, onViewChange, onAbout, onLegend, showLegend,
  sortBy, onSortChange, activeViewObj,
}) {
  return (
    <header className="flex-shrink-0 bg-coal-800 border-b border-coal-600 z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-coal-700">
        <div className="flex items-center gap-4">
          {/* Wordmark */}
          <div className="flex items-baseline gap-2">
            <h1 className="serif text-2xl font-semibold text-parchment-200 tracking-wide">
              Hearths
            </h1>
            <span className="text-xs text-parchment-500 tracking-widest uppercase hidden sm:block">
              Atlas of Cultural Evolution
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort control (threads only) */}
          {activeView === 'threads' && (
            <div className="hidden sm:flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-parchment-400">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={e => onSortChange(e.target.value)}
                className="text-xs bg-coal-700 border border-coal-500 text-parchment-300 rounded px-2 py-1 focus:outline-none focus:border-teal-600"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onLegend}
            className={`btn-ghost text-xs ${showLegend ? 'text-teal-400' : ''}`}
            aria-pressed={showLegend}
          >
            Legend
          </button>

          <button
            onClick={onAbout}
            className="btn-ghost text-xs"
          >
            About & Caveats
          </button>
        </div>
      </div>

      {/* View tab bar */}
      <nav className="flex items-center px-4" role="tablist" aria-label="Primary views">
        {views.map(view => (
          <button
            key={view.id}
            role="tab"
            aria-selected={activeView === view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors duration-150
              ${activeView === view.id
                ? 'border-teal-500 text-teal-400 font-medium'
                : 'border-transparent text-parchment-400 hover:text-parchment-200 hover:border-coal-500'
              }
            `}
          >
            <span>{view.label}</span>
            <span className="hidden sm:block text-xs text-parchment-500">
              — {view.description}
            </span>
          </button>
        ))}
      </nav>
    </header>
  );
}
