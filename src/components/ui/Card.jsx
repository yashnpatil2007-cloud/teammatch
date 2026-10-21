export const Card = ({ className='', children, hover=false, ...props }) => (
  <div className={`bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border)] rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] ${hover?'hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all':''} ${className}`} {...props}>
    {children}
  </div>
);
