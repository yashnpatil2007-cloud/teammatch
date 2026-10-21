import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { statsApi, userApi, problemApi, quizApi, errMsg } from '../../services/api';
import { Users, FileText, Brain, Award, Shield, RefreshCw, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import UsersPanel from './UsersPanel';
import ProblemsPanel from './ProblemsPanel';
import QuizzesPanel from './QuizzesPanel';
import CertificatesPanel from './CertificatesPanel';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/dashboard/admin' },
  { key: 'users', label: 'Users', icon: ShieldCheck, to: '/dashboard/admin/users' },
  { key: 'problems', label: 'Problems', icon: FileText, to: '/dashboard/admin/problems' },
  { key: 'quizzes', label: 'Quizzes', icon: Brain, to: '/dashboard/admin/quizzes' },
  { key: 'certificates', label: 'Certificates', icon: Award, to: '/dashboard/admin/certificates' },
];

const tabFromPath = (path) => {
  const seg = path.split('/').filter(Boolean).pop();
  return ['users', 'problems', 'quizzes', 'certificates'].includes(seg) ? seg : 'overview';
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
  const cards = [
    { label: 'Total Users', value: t.users ?? users.length, icon: Users, color: 'from-[#6C63FF] to-[#60A5FA]' },
    { label: 'Problems', value: t.problems ?? problems.length, icon: FileText, color: 'from-emerald-500 to-teal-500' },
    { label: 'Quizzes', value: t.quizzes ?? quizzes.length, icon: Brain, color: 'from-amber-500 to-orange-500' },
    { label: 'Pending Certs', value: certs.filter((c) => c.status === 'pending').length, icon: Award, color: 'from-zinc-900 to-zinc-700' },
  ];
  const lineData = stats?.growth || [];
  const barData = [
    { name: 'Problems', value: t.problems || 0 },
    { name: 'Teams', value: t.teams || 0 },
    { name: 'Users', value: t.users || 0 },
    { name: 'Reviews', value: t.reviews || 0 },
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
          <div className="grid md:grid-cols-4 gap-4">
            {cards.map((s) => <Card key={s.label} className="p-5 flex items-center gap-4"><div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="w-5 h-5 text-[var(--background)]" /></div><div><div className="text-[20px] font-bold leading-none">{s.value}</div><div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">{s.label}</div></div></Card>)}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold text-[13px]">User Growth</h3>
              <div className="h-[200px] mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} /><YAxis fontSize={11} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="registered" stroke="#6C63FF" strokeWidth={3} dot={{ fill: '#6C63FF' }} /></LineChart></ResponsiveContainer></div>
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-[13px]">Platform Overview</h3>
              <div className="h-[200px] mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData}><XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} /><YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#6C63FF" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-[13px]">Quick Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {TABS.filter((x) => x.key !== 'overview').map((it) => (
                <Link key={it.key} to={it.to} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[13px] font-semibold hover:bg-[var(--surface)]"><it.icon className="w-4 h-4" /> Manage {it.label}</Link>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'users' && <UsersPanel users={users} reload={load} />}
      {tab === 'problems' && <ProblemsPanel problems={problems} reload={load} />}
      {tab === 'quizzes' && <QuizzesPanel quizzes={quizzes} reload={load} />}
      {tab === 'certificates' && <CertificatesPanel certs={certs} reload={load} />}

      {loading && <div className="text-center text-[12px] text-[var(--text-secondary)] py-4">Loading admin data...</div>}
    </div>
  );
}
