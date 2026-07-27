export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="animate-pulse rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="h-4 w-24 rounded bg-slate-200" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="mt-3 h-3 rounded bg-slate-200" />
      ))}
    </div>
  );
}
