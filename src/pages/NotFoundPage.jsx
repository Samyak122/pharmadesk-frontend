export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">404</h1>
        <p className="mt-2 text-sm text-slate-500">The page you requested could not be found.</p>
      </div>
    </div>
  );
}
