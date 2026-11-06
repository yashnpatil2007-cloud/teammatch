import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  Menu,
  Check,
  CheckCheck,
  ExternalLink,
  Users,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notificationApi } from '../../services/api';
import { Avatar } from '../ui/Avatar';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
};

const getNotifIcon = (type) => {
  switch (type) {
    case 'invite_received':
      return <UserPlus className="w-4 h-4 text-[#6C63FF]" />;
    case 'join_requested':
      return <Users className="w-4 h-4 text-amber-500" />;
    case 'join_accepted':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'join_rejected':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'task_assigned':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'submission_status':
    case 'review_received':
      return <FileText className="w-4 h-4 text-purple-500" />;
    default:
      return <Sparkles className="w-4 h-4 text-[#6C63FF]" />;
  }
};

export default function Topbar({ onToggleMobileMenu }) {
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [term, setTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotifs, setOpenNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    const t = term.trim();
    nav(t ? `/dashboard/leaderboard?q=${encodeURIComponent(t)}` : '/dashboard/leaderboard');
  };

  // Poll unread count every 30 seconds
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await notificationApi.unreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Quiet fail on network interruption
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Load notifications when opening panel
  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await notificationApi.list({ limit: 25 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const toggleNotifPanel = () => {
    if (!openNotifs) {
      loadNotifications();
    }
    setOpenNotifs((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotifs(false);
      }
    };
    if (openNotifs) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openNotifs]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif._id);
    }
    setOpenNotifs(false);
    if (notif.link) {
      nav(notif.link);
    }
  };

  const photo = user?.profilePicture || user?.avatar;

  return (
    <div className="h-[64px] sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center gap-3 sm:gap-4 px-4 sm:px-6">
      {onToggleMobileMenu && (
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
          className="lg:hidden w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)] hover:bg-[var(--surface)] shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 flex items-center gap-3 max-w-[480px]">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search members, teams... (press Enter)"
            className="w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 sm:py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[12px] sm:text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      <button
        onClick={toggle}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)] hover:bg-[var(--surface)] shrink-0"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Notifications Drawer & Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={toggleNotifPanel}
          title="Notifications"
          aria-label="View notifications"
          className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--card)] text-[var(--text-primary)] relative hover:bg-[var(--surface)] shrink-0 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown Panel */}
        {openNotifs && (
          <div className="absolute right-0 mt-3 w-[340px] sm:w-[380px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[13px]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#6C63FF] hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)]">
              {loadingNotifs ? (
                <div className="p-8 text-center text-[12px] text-[var(--text-secondary)]">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[var(--text-secondary)]">
                  <Bell className="w-8 h-8 mx-auto text-[var(--text-secondary)]/40 mb-2" />
                  <div className="font-bold text-[var(--text-primary)]">All caught up!</div>
                  <div className="text-[11px] mt-0.5">No notifications right now.</div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-[var(--surface)] cursor-pointer transition-colors ${
                      !n.read ? 'bg-[#6C63FF]/5' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[12px] font-bold truncate ${!n.read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                        title="Mark as read"
                        className="w-5 h-5 rounded-full hover:bg-[var(--card)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#6C63FF] shrink-0 self-center"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[var(--border)] shrink-0">
        <Link to="/dashboard/profile" title="Personal Details" aria-label="Personal Details">
          <Avatar user={user} size="sm" className="hover:ring-2 hover:ring-[#6C63FF]/50 transition-all cursor-pointer" />
        </Link>
        <div className="hidden sm:block leading-tight">
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{user?.name || 'User'}</div>
          <div className="text-[11px] text-[var(--text-secondary)] capitalize">
            {user?.role} • {user?.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
          className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center hover:opacity-90"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
