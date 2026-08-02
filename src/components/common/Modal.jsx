import { useEffect } from 'react';

export function Modal({ open, title, description, children, onClose, panelClassName = '', bodyClassName = '' }) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 py-4 sm:px-6">
      <div className={`flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl ${panelClassName}`}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">Close</button>
        </div>
        <div className={`flex-1 overflow-hidden ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
