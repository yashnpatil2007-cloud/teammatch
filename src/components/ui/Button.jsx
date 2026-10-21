export const Button = ({ variant='primary', size='md', className='', children, ...props }) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]';
  const variants = {
    primary: 'bg-[var(--text-primary)] text-[var(--background)] hover:opacity-90 shadow-[0_8px_20px_rgba(0,0,0,0.12)] border border-transparent',
    ghost: 'bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface)]',
    gradient: 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] text-white shadow-[0_8px_20px_rgba(108,99,255,0.35)] border border-transparent',
    outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface)]',
  };
  const sizes = { sm:'px-4 py-2 text-[12px]', md:'px-6 py-3 text-[13px]', lg:'px-7 py-3.5 text-[14px]' };
  return <button className={`${base} ${variants[variant]||variants.primary} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};
