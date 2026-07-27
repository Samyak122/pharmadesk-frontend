export function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 shadow-sm">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
