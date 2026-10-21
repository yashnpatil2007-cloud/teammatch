import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, UsersRound, Brain, Trophy, Star, Shield, GraduationCap, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleNav = {
  organizer: [
    { label:'Dashboard', icon: LayoutDashboard, to:'/dashboard/organizer' },
    { label:'Problems', icon: FileText, to:'/dashboard/organizer/problems' },
    { label:'AI Analyzer', icon: Brain, to:'/dashboard/organizer/analyzer' },
    { label:'Teams', icon: UsersRound, to:'/dashboard/teams' },
    { label:'Leaderboard', icon: Trophy, to:'/dashboard/leaderboard' },
  ],
  leader: [
    { label:'Dashboard', icon: LayoutDashboard, to:'/dashboard/leader' },
    { label:'Create Team', icon: UsersRound, to:'/dashboard/leader/create' },
    { label:'Matching', icon: Brain, to:'/dashboard/matching' },
    { label:'Strength', icon: Star, to:'/dashboard/strength' },
    { label:'Reviews', icon: Star, to:'/dashboard/reviews' },
  ],
  member: [
    { label:'Dashboard', icon: LayoutDashboard, to:'/dashboard/member' },
    { label:'Profile', icon: GraduationCap, to:'/dashboard/member/profile' },
    { label:'Quizzes', icon: Brain, to:'/dashboard/member/quizzes' },
    { label:'Teams', icon: UsersRound, to:'/dashboard/teams' },
    { label:'Leaderboard', icon: Trophy, to:'/dashboard/leaderboard' },
  ],
  admin: [
    { label:'Dashboard', icon: LayoutDashboard, to:'/dashboard/admin' },
    { label:'Users', icon: Shield, to:'/dashboard/admin/users' },
    { label:'Problems', icon: FileText, to:'/dashboard/admin/problems' },
    { label:'Quizzes', icon: Brain, to:'/dashboard/admin/quizzes' },
    { label:'Certificates', icon: Award, to:'/dashboard/admin/certificates' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'member';
  const nav = roleNav[role] || roleNav.member;

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-[var(--card)] border-r border-[var(--border)] min-h-screen sticky top-0">
      <div className="h-[64px] flex items-center gap-2.5 px-6 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center">
          <UsersRound className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-[16px] text-[var(--text-primary)]">TeamMatch</span>
        <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] uppercase tracking-widest">{role}</span>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({isActive})=> `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${isActive?'bg-[var(--text-primary)] text-[var(--background)]':'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'}`}>
            <item.icon className="w-4 h-4" /> {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#60A5FA] p-4 text-white">
          <div className="text-[13px] font-bold">Need a hand?</div>
          <div className="text-[11px] opacity-90">Explore the leaderboard or revisit the home page.</div>
          <NavLink to="/dashboard/leaderboard" className="mt-3 w-full py-2 rounded-full bg-white text-zinc-900 text-[12px] font-semibold flex items-center justify-center">Leaderboard</NavLink>
        </div>
      </div>
    </aside>
  );
}
