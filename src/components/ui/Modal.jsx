import { X } from 'lucide-react';

export const Modal = ({ open, onClose, title, subtitle, children, wide = false, footer = null }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-6 bg-[var(--card)] border border-[var(--border)] rounded-[22px] shadow-[0_24px_60px_rgba(0,0,0,0.25)]`}>
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)]">
          <div>
            <h3 className="text-[16px] font-extrabold">{title}</h3>
            {subtitle && <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 shrink-0 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 border-t border-[var(--border)] flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">{label}</span>
    <div className="mt-1.5">{children}</div>
    {hint && <span className="text-[11px] text-[var(--text-secondary)]">{hint}</span>}
  </label>
);

export const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]';
