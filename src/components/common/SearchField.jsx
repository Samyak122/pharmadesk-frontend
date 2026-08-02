import { memo } from 'react';
import { Search } from 'lucide-react';

function SearchFieldComponent({ value, onChange, placeholder, loading = false, className = '' }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className={`w-full rounded-2xl border border-slate-200 px-10 py-3 text-sm outline-none ${className}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {loading ? <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true"><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" /></div> : null}
    </div>
  );
}

export const SearchField = memo(SearchFieldComponent);
