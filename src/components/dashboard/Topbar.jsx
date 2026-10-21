import { useState } from 'react';
import { Bell, Search, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Topbar() {
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [term, setTerm] = useState('');
  const handleLogout = () => { logout(); nav('/'); };
  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const t = term.trim();
    nav(t ? `/dashboard/leaderboard?q=${encodeURIComponent(t)}` : '/dashboard/leaderboard');
  };
  return (
    <div className="h-[64px] sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center gap-4 px-6">
      <div className="flex-1 flex items-center gap-3 max-w-[480px]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={handleSearch} placeholder="Search members, teams, skills... (press Enter)" className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent)]/20" />
        </div>
      </div>

      <button onClick={toggle} aria-label="Toggle theme" className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)] hover:bg-[var(--surface)]">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <Link to="/dashboard/reviews" title="Reviews & feedback" className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)] relative hover:bg-[var(--surface)]">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </Link>

      <div className="flex items-center gap-3 pl-3 border-l border-[var(--border)]">
        <img src={user?.avatar || `https://i.pravatar.cc/100?img=${user?.role==='organizer'?33:12}`} className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" alt="" />
        <div className="hidden sm:block leading-tight">
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{user?.name || 'User'}</div>
          <div className="text-[11px] text-[var(--text-secondary)] capitalize">{user?.role} • {user?.email}</div>
        </div>
        <button onClick={handleLogout} aria-label="Logout" className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center hover:opacity-90">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
