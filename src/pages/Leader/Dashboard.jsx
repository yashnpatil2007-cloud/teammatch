import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { problemApi, teamApi, errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { UsersRound, Plus, BarChart3, RefreshCw, Check, X, Settings, Trash2, UserMinus } from 'lucide-react';

function TeamManageModal({ open, team, problems, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [problemId, setProblemId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !team) return;
    setName(team.name || '');
    setProblemId(team.problem?._id || team.problem || '');
    setErr('');
  }, [open, team]);

  if (!team) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await teamApi.update(team._id, { name, problemId }); await onSaved(); onClose(); }
    catch (e2) { setErr(errMsg(e2)); }
    finally { setBusy(false); }
  };

  const removeMember = async (m) => {
    setErr('');
    try { await teamApi.removeMember(team._id, m._id); await onSaved(); }
    catch (e2) { setErr(errMsg(e2)); }
  };

  const deleteTeam = async () => {
    if (!window.confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    setErr('');
    try { await teamApi.remove(team._id); await onSaved(); onClose(); }
    catch (e2) { setErr(errMsg(e2)); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Team" subtitle={team.problem?.title}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Team name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
        <Field label="Problem statement">
          <select value={problemId} onChange={(e) => setProblemId(e.target.value)} className={inputCls}>
            {problems.map((p) => <option key={p._id} value={p._id}>{p.title} • {p.category}</option>)}
          </select>
        </Field>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)] mb-2">Members ({team.members?.length || 0})</div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {(team.members || []).map((m) => {
              const isLeader = String(m._id || m) === String(team.leader?._id || team.leader);
              return (
                <div key={m._id || m} className="flex items-center gap-3 p-2 rounded-xl border border-[var(--border)]">
                  <img src={m.avatar || 'https://i.pravatar.cc/100?img=12'} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate">{m.name || m._id || m}</div><div className="text-[11px] text-[var(--text-secondary)] capitalize">{m.role || 'member'}{isLeader ? ' • leader' : ''}</div></div>
                  {!isLeader && <button type="button" onClick={() => removeMember(m)} className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Remove member"><UserMinus className="w-3.5 h-3.5" /></button>}
                </div>
              );
            })}
          </div>
        </div>

        {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="button" onClick={deleteTeam} className="text-red-500 text-[12px] font-semibold flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete team</button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function LeaderDashboard(){
 const { user } = useAuth();
 const [teams,setTeams]=useState([]);
 const [invitedTeams,setInvitedTeams]=useState([]);
 const [problems,setProblems]=useState([]);
 const [name,setName]=useState('');
 const [problemId,setProblemId]=useState('');
 const [msg,setMsg]=useState('');
 const [err,setErr]=useState('');
 const [busy,setBusy]=useState(false);
 const [manageTeam,setManageTeam]=useState(null);

 const load = async ()=>{
  try{
   const [p, mine] = await Promise.all([problemApi.list(), teamApi.mine()]);
   setProblems(p); if(p[0] && !problemId) setProblemId(p[0]._id);
   setTeams(mine.filter(t=>String(t.leader?._id||t.leader)===user?._id));
   setInvitedTeams(mine.filter(t=>(t.invites||[]).some(i=>String(i.user?._id||i.user)===user?._id && i.status==='pending')));
  }catch(e){ setErr(errMsg(e)); }
 };

 useEffect(()=>{ load(); },[]); // eslint-disable-line

 const create = async (e)=>{
  e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
  try{
   await teamApi.create({ name, problemId });
   setMsg('Team created! Now invite members via AI Matching.');
   setName('');
   await load();
  }catch(e){ setErr(errMsg(e)); }
  finally{ setBusy(false); }
 };

 const respond = async (teamId, action)=>{
  try{ await teamApi.respond(teamId, user._id, action); setMsg(`Invite ${action}ed.`); await load(); setTimeout(()=>setMsg(''),3000); }
  catch(e){ setErr(errMsg(e)); }
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div><h1 className="text-[24px] font-extrabold">Team Leader Dashboard</h1><p className="text-[13px] text-[var(--text-secondary)]">Create teams, invite via AI, review members, view strength analysis.</p></div>
 <div className="flex gap-2"><Button variant="ghost" onClick={load}><RefreshCw className="w-4 h-4"/> Refresh</Button><Link to="/dashboard/matching"><Button variant="gradient"><UsersRound className="w-4 h-4"/> Find Members</Button></Link></div>
 </div>

 {msg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800">{msg}</div>}
 {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

 <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Create Team</h3>
 <form onSubmit={create} className="mt-4 space-y-3">
 <input value={name} onChange={e=>setName(e.target.value)} placeholder="Team name e.g. Team Alpha" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" required />
 <select value={problemId} onChange={e=>setProblemId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
 {problems.map(p=> <option key={p._id} value={p._id}>{p.title} • {p.category}</option>)}
 </select>
 <Button type="submit" variant="gradient" className="w-full" disabled={busy}>{busy?'Creating...':'Create Team'} <UsersRound className="w-4 h-4"/></Button>
 </form>
 </Card>

 <Card className="p-6">
 <h3 className="font-bold">My Teams</h3>
 <div className="mt-4 space-y-3">
 {teams.length? teams.map(t=> <div key={t._id} className="p-4 rounded-2xl border border-[var(--border)]"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="font-semibold text-[14px] truncate">{t.name}</div><div className="text-[11px] text-[var(--text-secondary)] truncate">{t.problem?.title} • {t.members?.length||0} members</div></div><div className="flex items-center gap-2 shrink-0"><span className="px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] font-bold capitalize">{t.status||'forming'}</span><button onClick={()=>setManageTeam(t)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface)]" title="Manage team"><Settings className="w-3.5 h-3.5"/></button></div></div><div className="mt-3 flex items-center gap-3 text-[11px] flex-wrap"><span className="font-semibold text-[#6C63FF]">Coverage {t.coverage||0}%</span><span className="text-[var(--text-secondary)]">Match {t.matchPercentage||0}%</span>{t.missingSkills?.length? <span className="text-amber-600">Missing: {t.missingSkills.join(', ')}</span>:<span className="text-emerald-600">All skills covered</span>}</div></div>)
 : <div className="p-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">No teams yet. Create your first team.</div>}
 </div>
 </Card>
 </div>

 <Card className="p-6">
 <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4"/> Pending Invites</h3>
 <div className="mt-4 space-y-2">
 {invitedTeams.length? invitedTeams.map(t=> <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]"><img src={t.leader?.avatar||'https://i.pravatar.cc/100?img=12'} className="w-9 h-9 rounded-full" alt=""/><div className="flex-1"><div className="text-[13px] font-semibold">{t.name}</div><div className="text-[11px] text-[var(--text-secondary)]">Leader: {t.leader?.name} • {t.problem?.title}</div></div><button onClick={()=>respond(t._id,'reject')} className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500"><X className="w-4 h-4"/></button><button onClick={()=>respond(t._id,'accept')} className="px-4 py-2 rounded-full bg-emerald-500 text-white text-[12px] font-semibold flex items-center gap-1"><Check className="w-3 h-3"/> Accept</button></div>)
 : <div className="p-6 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">No pending invites.</div>}
 </div>
 </Card>

 <TeamManageModal open={!!manageTeam} team={manageTeam} problems={problems} onClose={()=>setManageTeam(null)} onSaved={()=>load()} />
 </div>
 );
}
