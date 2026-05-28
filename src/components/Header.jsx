import React from 'react';
import { SORT_OPTIONS } from '../utils/constants';

export default function Header({
  activeView, views, onViewChange, onAbout, onLegend, showLegend,
  sortBy, onSortChange,
}) {
  const activeViewObj = views.find(v => v.id === activeView);

  return (
    <header className="flex-shrink-0 bg-coal-900 border-b border-coal-700 z-10">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Wordmark + active view subtitle */}
        <div className="flex items-baseline gap-3">
          <h1 className="serif text-2xl font-medium text-parchment-200 tracking-wide">
            Hearths
          </h1>
          <span className="hidden sm:block w-px h-4 bg-coal-500" aria-hidden="true" />
          <span className="hidden sm:block text-xs text-parchment-500 tracking-wide">
            {activeViewObj?.description}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {activeView === 'threads' && (
            <div className="hidden sm:flex items-center gap-1.5 mr-3">
              <label htmlFor="sort-sel" className="text-xs text-parchment-500">Sort</label>
              <select
                id="sort-sel"
                value={sortBy}
                onChange={e => onSortChange(e.target.value)}
                className="text-xs bg-coal-800 border border-coal-600 text-parchment-400 rounded px-2 py-1 focus:outline-none focus:border-teal-700"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <button onClick={onLegend} className={`btn-ghost text-xs ${showLegend ? 'text-teal-400' : ''}`} aria-pressed={showLegend}>
            Legend
          </button>
          <button onClick={onAbout} className="btn-ghost text-xs">
            About
          </button>
        </div>
      </div>

      {/* View switcher */}
      <nav className="flex items-center gap-1 px-5 pb-3" role="tablist" aria-label="Primary views">
        {views.map(v => {
          if (v.disabled) {
            return (
              <span
                key={v.id}
                title="Coming soon"
                className="px-3.5 py-1 rounded-full text-xs tracking-wide text-parchment-700 border border-transparent cursor-default select-none"
                aria-disabled="true"
              >
                {v.label}
              </span>
            );
          }
          return (
            <button
              key={v.id}
              role="tab"
              aria-selected={activeView === v.id}
              onClick={() => onViewChange(v.id)}
              className={`
                px-3.5 py-1 rounded-full text-xs tracking-wide transition-all duration-200
                ${activeView === v.id
                  ? 'bg-coal-700 text-teal-400 border border-teal-800'
                  : 'text-parchment-500 hover:text-parchment-300 border border-transparent hover:border-coal-600'
                }
              `}
            >
              {v.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
