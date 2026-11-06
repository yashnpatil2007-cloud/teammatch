import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { statsApi, userApi, problemApi, quizApi, errMsg } from '../../services/api';
import { Users, FileText, Brain, Award, Shield, RefreshCw, LayoutDashboard, ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import UsersPanel from './UsersPanel';
import ProblemsPanel from './ProblemsPanel';
import QuizzesPanel from './QuizzesPanel';
import CertificatesPanel from './CertificatesPanel';
import SubmissionsReviewPanel from '../Organizer/SubmissionsReviewPanel';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/dashboard/admin' },
  { key: 'submissions', label: 'Submissions', icon: FileCheck, to: '/dashboard/admin/submissions' },
  { key: 'users', label: 'Users', icon: ShieldCheck, to: '/dashboard/admin/users' },
  { key: 'problems', label: 'Problems', icon: FileText, to: '/dashboard/admin/problems' },
  { key: 'quizzes', label: 'Quizzes', icon: Brain, to: '/dashboard/admin/quizzes' },
  { key: 'certificates', label: 'Certificates', icon: Award, to: '/dashboard/admin/certificates' },
];

const tabFromPath = (path) => {
  const seg = path.split('/').filter(Boolean).pop();
  return ['users', 'problems', 'quizzes', 'certificates', 'submissions'].includes(seg) ? seg : 'overview';
};

export default function AdminDashboard() {
  const { pathname } = useLocation();
  const tab = tabFromPath(pathname);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certs, setCerts] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setErr('');
    try {
      const [s, u, p, q, c] = await Promise.all([
        statsApi.get(), userApi.list(), problemApi.list(), quizApi.list(), userApi.pendingCertificates(),
      ]);
      setStats(s); setUsers(u); setProblems(p); setQuizzes(q); setCerts(c);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const t = stats?.totals || {};
  const roles = stats?.roles || t.roles || { member: 0, leader: 0, organizer: 0, admin: 0 };
  const subs = stats?.submissions || {};
  const subStatus = subs.byStatus || { draft: 0, submitted: 0, under_review: 0, revisions_requested: 0, approved: 0 };
  const assess = stats?.assessments || {};
  const collab = stats?.collaboration || {};

  const cards = [
    { label: 'Total Users', value: t.allUsersCount ?? users.length, icon: Users, color: 'from-[#6C63FF] to-[#60A5FA]', sub: `${roles.member || 0} members • ${roles.leader || 0} leaders` },
    { label: 'Challenges', value: t.problems ?? problems.length, icon: FileText, color: 'from-emerald-500 to-teal-500', sub: `${t.registeredParticipants || 0} participants registered` },
    { label: 'Teams & Groups', value: t.teams ?? 0, icon: ShieldCheck, color: 'from-amber-500 to-orange-500', sub: `${t.activeTeams ?? 0} active • avg size: ${t.avgTeamSize ?? 0}` },
    { label: 'Submissions', value: subs.total ?? (t.submissionsTotal || 0), icon: FileCheck, color: 'from-purple-600 to-indigo-600', sub: `${subStatus.approved || 0} approved • ${subStatus.under_review || 0} reviewing` },
  ];

  const lineData = stats?.growth || [];
  const barData = [
    { name: 'Problems', value: t.problems || 0 },
    { name: 'Teams', value: t.teams || 0 },
    { name: 'Users', value: t.allUsersCount || users.length || 0 },
    { name: 'Submissions', value: subs.total || t.submissionsTotal || 0 },
    { name: 'Reviews', value: t.reviews || 0 },
  ];

  const roleBarData = [
    { name: 'Members', count: roles.member || 0 },
    { name: 'Leaders', count: roles.leader || 0 },
    { name: 'Organizers', count: roles.organizer || 0 },
    { name: 'Admins', count: roles.admin || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2"><Shield className="w-6 h-6 text-[#6C63FF]" /> Admin Panel</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Manage users, problem statements, quizzes & certificates</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full bg-[var(--card)] border border-[var(--border)]"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((it) => (
          <Link key={it.key} to={it.to} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border ${tab === it.key ? 'bg-[var(--text-primary)] text-[var(--background)] border-transparent' : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <it.icon className="w-4 h-4" /> {it.label}
          </Link>
        ))}
      </div>

      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

      {tab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((s) => (
              <Card key={s.label} className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  <s.icon className="w-5 h-5 text-[var(--background)]" />
                </div>
                <div>
                  <div className="text-[20px] font-extrabold leading-none">{s.value}</div>
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)] mt-1">
                    {s.label}
                  </div>
                  {s.sub && <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">{s.sub}</div>}
                </div>
              </Card>
            ))}
          </div>

          {/* Growth & Distribution Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[13px]">User Registration Growth</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Database-derived registrations (Past 7 days)</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Live DB
                </span>
              </div>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="registered" stroke="#6C63FF" strokeWidth={3} dot={{ fill: '#6C63FF', r: 3 }} name="Total Users" />
                    <Line type="monotone" dataKey="users" stroke="#22C55E" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#22C55E', r: 2 }} name="Daily New" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[13px]">User Role Distribution</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Active platform roles from database records</p>
                </div>
              </div>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleBarData}>
                    <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6C63FF" radius={[6, 6, 0, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Detailed Platform Metrics Row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Submissions Pipeline */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[13px] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-600" /> Submission Pipeline
                </h3>
                <span className="text-[11px] font-extrabold text-purple-600">
                  {subs.total || 0} Total
                </span>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Approved & Complete</span>
                  <span className="font-bold text-emerald-600">{subStatus.approved || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Under Review</span>
                  <span className="font-bold text-amber-600">{subStatus.under_review || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Revisions Requested</span>
                  <span className="font-bold text-orange-600">{subStatus.revisions_requested || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Submitted (Pending)</span>
                  <span className="font-bold text-blue-600">{subStatus.submitted || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-secondary)]">Average Review Score</span>
                  <span className="font-extrabold text-[#6C63FF]">{subs.avgScore ? `${subs.avgScore}/100` : 'N/A'}</span>
                </div>
              </div>
            </Card>

            {/* Assessment & Skill Verifications */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[13px] flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-600" /> Assessment Intelligence
                </h3>
                <span className="text-[11px] font-extrabold text-emerald-600">
                  {assess.total || t.assessmentsTotal || 0} Attempts
                </span>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Aptitude Tests Taken</span>
                  <span className="font-bold">{assess.byType?.aptitude || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Avg Aptitude Score</span>
                  <span className="font-bold text-emerald-600">{assess.avgAptitudeScore || 0}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Technical Skill Tests</span>
                  <span className="font-bold">{assess.byType?.technical || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Personality Evaluations</span>
                  <span className="font-bold">{assess.byType?.personality || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-secondary)]">Verified Students</span>
                  <span className="font-extrabold text-[#6C63FF]">{t.verifiedUsers || 0}</span>
                </div>
              </div>
            </Card>

            {/* Collaboration & Team Activity */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[13px] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Team Collaboration
                </h3>
                <span className="text-[11px] font-extrabold text-blue-600">
                  {collab.tasksTotal || t.tasksTotal || 0} Tasks
                </span>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Tasks Completed</span>
                  <span className="font-bold text-emerald-600">{collab.taskStatus?.completed || t.tasksCompleted || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Tasks In Progress</span>
                  <span className="font-bold text-amber-600">{collab.taskStatus?.inProgress || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Team Messages Sent</span>
                  <span className="font-bold">{collab.messagesTotal || t.messagesTotal || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Pending Invitations</span>
                  <span className="font-bold">{collab.pendingInvites || t.pendingInvites || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-secondary)]">Pending Join Requests</span>
                  <span className="font-extrabold text-[#6C63FF]">{collab.pendingJoinRequests || t.pendingJoinRequests || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-[13px]">Quick Actions & Panel Navigation</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TABS.filter((x) => x.key !== 'overview').map((it) => (
                <Link key={it.key} to={it.to} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[13px] font-semibold hover:bg-[var(--surface)]"><it.icon className="w-4 h-4" /> Manage {it.label}</Link>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'submissions' && <SubmissionsReviewPanel />}
      {tab === 'users' && <UsersPanel users={users} reload={load} />}
      {tab === 'problems' && <ProblemsPanel problems={problems} reload={load} />}
      {tab === 'quizzes' && <QuizzesPanel quizzes={quizzes} reload={load} />}
      {tab === 'certificates' && <CertificatesPanel certs={certs} reload={load} />}

      {loading && <div className="text-center text-[12px] text-[var(--text-secondary)] py-4">Loading admin data...</div>}
    </div>
  );
}
