import { useEffect } from 'react';

export function Modal({ open, title, description, children, onClose, panelClassName = '', bodyClassName = '', footer = null }) {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 sm:px-6">
      <div className={`flex w-[min(1000px,95vw)] max-h-[90vh] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl ${panelClassName}`}>
        <div className="sticky top-0 z-10 flex flex-shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">Close</button>
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto px-5 py-4 sm:px-6 ${bodyClassName}`}>{children}</div>
        {footer ? (
          <div className="sticky bottom-0 z-10 flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
