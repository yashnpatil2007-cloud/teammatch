import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { problemApi, teamApi, submissionApi, errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  UsersRound, Plus, BarChart3, RefreshCw, Check, X, Settings, Trash2,
  UserMinus, UserPlus, LayoutDashboard, Send, Inbox, Briefcase, CheckSquare, FileCheck, Shield
} from 'lucide-react';

const TEAM_ROLE_OPTIONS = ['Leader', 'Frontend', 'Backend', 'Full Stack', 'AI / ML', 'UI / UX', 'Data / Research', 'DevOps', 'Presenter', 'Member'];

const LEADER_TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/dashboard/leader' },
  { key: 'create', label: 'Create Team', icon: Plus, to: '/dashboard/leader/create' },
  { key: 'teams', label: 'My Teams', icon: UsersRound, to: '/dashboard/leader/teams' },
  { key: 'invitations', label: 'Invitations', icon: Send, to: '/dashboard/leader/invitations' },
  { key: 'requests', label: 'Join Requests', icon: Inbox, to: '/dashboard/leader/requests' },
  { key: 'workspace', label: 'Workspace', icon: Briefcase, to: '/dashboard/leader/workspace' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, to: '/dashboard/leader/tasks' },
  { key: 'submissions', label: 'Submissions', icon: FileCheck, to: '/dashboard/leader/submissions' },
];

const leaderTabFromPath = (path) => {
  const seg = path.split('/').filter(Boolean).pop();
  return ['create', 'teams', 'invitations', 'requests', 'workspace', 'tasks', 'submissions'].includes(seg) ? seg : 'overview';
};

function TeamManageModal({ open, team, problems, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [problemId, setProblemId] = useState('');
  const [memberRoles, setMemberRoles] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || !team) return;
    setName(team.name || '');
    setProblemId(team.problem?._id || team.problem || '');
    const rolesMap = {};
    if (Array.isArray(team.memberRoles)) {
      team.memberRoles.forEach((mr) => {
        if (mr?.userId) rolesMap[String(mr.userId)] = mr.teamRole || 'Member';
      });
    } else if (team.memberRoles && typeof team.memberRoles === 'object') {
      Object.assign(rolesMap, team.memberRoles);
    }
    setMemberRoles(rolesMap);
    setErr('');
  }, [open, team]);

  if (!team) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await teamApi.update(team._id, { name, problemId });
      const memberRolesPayload = Object.entries(memberRoles)
        .filter(([, teamRole]) => !!teamRole)
        .map(([userId, teamRole]) => ({ userId, teamRole }));
      await teamApi.updateMemberRoles(team._id, memberRolesPayload);
      await onSaved();
      onClose();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (m) => {
    setErr('');
    try {
      await teamApi.removeMember(team._id, m._id);
      await onSaved();
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  const deleteTeam = async () => {
    if (!window.confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
    setErr('');
    try {
      await teamApi.remove(team._id);
      await onSaved();
      onClose();
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  return (
    <Modal open={open} onClose={onClose} wide title="Manage Team & Member Roles" subtitle={team.problem?.title}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Team name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Problem statement">
            <select value={problemId} onChange={(e) => setProblemId(e.target.value)} className={inputCls}>
              {problems.map((p) => (
                <option key={p._id} value={p._id}>{p.title} • {p.category}</option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-secondary)] mb-2">
            Members & Team Functional Roles ({team.members?.length || 0})
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto">
            {(team.members || []).map((m) => {
              const memberId = String(m._id || m);
              const isLeader = memberId === String(team.leader?._id || team.leader);
              const assignedRole = memberRoles[memberId] || (isLeader ? 'Leader' : 'Member');
              return (
                <div key={memberId} className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl border border-[var(--border)]">
                  <Avatar user={m} size="sm" />
                  <div className="flex-1 min-w-[140px]">
                    <div className="text-[13px] font-semibold truncate">{m.name || memberId}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] capitalize">
                      {m.role || 'member'}{isLeader ? ' • Team Leader' : ''}
                    </div>
                  </div>
                  <select
                    value={assignedRole}
                    onChange={(e) => setMemberRoles((prev) => ({ ...prev, [memberId]: e.target.value }))}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[12px]"
                  >
                    {TEAM_ROLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {!isLeader && (
                    <button
                      type="button"
                      onClick={() => removeMember(m)}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500 hover:bg-red-500/10"
                      title="Remove member"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(team.invites || []).some((i) => i.status === 'requested') && (
          <div className="pt-2 border-t border-[var(--border)]">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-indigo-600 mb-2">
              Pending Join Requests ({(team.invites || []).filter((i) => i.status === 'requested').length})
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {(team.invites || [])
                .filter((i) => i.status === 'requested')
                .map((inv) => {
                  const candidate = inv.user;
                  return (
                    <div
                      key={candidate?._id || candidate}
                      className="flex items-center gap-3 p-2 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20"
                    >
                      <Avatar user={candidate} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{candidate?.name || 'Candidate'}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {candidate?.skills?.slice(0, 2).map((s) => s.name || s).join(', ') || 'Student'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await teamApi.respond(team._id, candidate._id || candidate, 'approve');
                            await onSaved();
                          } catch (ex) {
                            setErr(errMsg(ex));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await teamApi.respond(team._id, candidate._id || candidate, 'reject');
                            await onSaved();
                          } catch (ex) {
                            setErr(errMsg(ex));
                          }
                        }}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="button" onClick={deleteTeam} className="text-red-500 text-[12px] font-semibold flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> Delete team
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={busy}>{busy ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function LeaderDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const tab = leaderTabFromPath(location.pathname);

  const [teams, setTeams] = useState([]);
  const [invitedTeams, setInvitedTeams] = useState([]);
  const [problems, setProblems] = useState([]);
  const [submissionsByTeam, setSubmissionsByTeam] = useState({});
  const [name, setName] = useState('');
  const [problemId, setProblemId] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [manageTeam, setManageTeam] = useState(null);

  const load = async () => {
    try {
      const [p, mine] = await Promise.all([problemApi.list(), teamApi.mine()]);
      setProblems(p);
      if (p[0] && !problemId) setProblemId(p[0]._id);
      const led = mine.filter((t) => String(t.leader?._id || t.leader) === user?._id);
      setTeams(led);
      setInvitedTeams(mine.filter((t) => (t.invites || []).some((i) => String(i.user?._id || i.user) === user?._id && i.status === 'pending')));

      if (led.length > 0) {
        const entries = await Promise.all(
          led.map(async (t) => {
            try {
              const sub = await submissionApi.getByTeam(t._id);
              return [t._id, sub?.submission || sub];
            } catch {
              return [t._id, null];
            }
          })
        );
        setSubmissionsByTeam(Object.fromEntries(entries));
      }
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const create = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      await teamApi.create({ name, problemId });
      setMsg('Team created! Now invite members via Find Members.');
      setName('');
      await load();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const respond = async (teamId, action) => {
    try {
      await teamApi.respond(teamId, user._id, action);
      setMsg(`Invite ${action}ed.`);
      await load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const handleCandidateAction = async (teamId, candidateId, action) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await teamApi.respond(teamId, candidateId, action);
      setMsg(action === 'approve' ? 'Student join request approved! Member added to team.' : 'Join request declined.');
      await load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const incomingRequests = [];
  const sentInvites = [];
  teams.forEach((t) => {
    (t.invites || []).forEach((inv) => {
      if (inv.status === 'requested') {
        incomingRequests.push({ teamId: t._id, teamName: t.name, candidate: inv.user, invitedAt: inv.invitedAt });
      } else if (inv.status === 'pending' || inv.status === 'accepted' || inv.status === 'rejected') {
        sentInvites.push({ teamId: t._id, teamName: t.name, candidate: inv.user, status: inv.status, invitedAt: inv.invitedAt });
      }
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold">Team Leader Dashboard</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Create teams, invite members via AI matching, approve requests, assign team roles, and submit projects.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Link to="/dashboard/matching"><Button variant="gradient"><UsersRound className="w-4 h-4" /> Find Members</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEADER_TABS.map((it) => (
          <Link
            key={it.key}
            to={it.to}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-semibold border ${
              tab === it.key
                ? 'bg-[var(--text-primary)] text-[var(--background)] border-transparent'
                : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <it.icon className="w-3.5 h-3.5" /> {it.label}
            {it.key === 'requests' && incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {msg && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">{msg}</div>}
      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">{err}</div>}

      {/* Incoming Join Requests Section */}
      {(tab === 'requests' || (tab === 'overview' && incomingRequests.length > 0)) && (
        <Card className="p-6 border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[15px] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-500" />
              Incoming Join Requests ({incomingRequests.length})
            </h3>
            {incomingRequests.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white">Action Required</span>
            )}
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] mb-4">
            Students requesting to join your teams. Review their skills and approve or decline.
          </p>

          {incomingRequests.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">
              No pending join requests right now.
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map(({ teamId, teamName, candidate }) => (
                <div
                  key={`${teamId}-${candidate?._id || candidate}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <Avatar user={candidate} size="md" />
                    <div>
                      <div className="font-bold text-[14px] flex items-center gap-2">
                        {candidate?.name || 'Student Candidate'}
                        {candidate?.reliabilityScore && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {candidate.reliabilityScore}% Rel.
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[var(--text-secondary)]">
                        Wants to join <strong className="text-[var(--text-primary)]">{teamName}</strong>
                        {candidate?.email ? ` • ${candidate.email}` : ''}
                      </div>
                      {candidate?.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {candidate.skills.slice(0, 4).map((s) => (
                            <span key={s.name || s} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] capitalize font-medium">
                              {s.name || s} (L{s.level || 5})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="gradient"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleCandidateAction(teamId, candidate?._id || candidate, 'approve')}
                      className="text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Request
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleCandidateAction(teamId, candidate?._id || candidate, 'reject')}
                      className="text-[12px] text-red-500 hover:bg-red-500/10 flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Overview / Create / My Teams */}
      {(tab === 'overview' || tab === 'create' || tab === 'teams') && (
        <div className={`grid gap-6 ${tab === 'overview' ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'grid-cols-1'}`}>
          {(tab === 'overview' || tab === 'create') && (
            <Card className="p-6">
              <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Team</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">Select a published problem statement to launch a new team.</p>
              <form onSubmit={create} className="mt-4 space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name e.g. Team Alpha" className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] outline-none" required />
                <select value={problemId} onChange={(e) => setProblemId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  {problems.map((p) => <option key={p._id} value={p._id}>{p.title} • {p.category}</option>)}
                </select>
                <Button type="submit" variant="gradient" className="w-full" disabled={busy}>
                  {busy ? 'Creating...' : 'Create Team'} <UsersRound className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          )}

          {(tab === 'overview' || tab === 'teams') && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">My Teams ({teams.length})</h3>
                <Link to="/dashboard/strength" className="text-[12px] font-semibold text-[#6C63FF] hover:underline">
                  View Team Strength →
                </Link>
              </div>
              <div className="space-y-3">
                {teams.length ? (
                  teams.map((t) => (
                    <div key={t._id} className="p-4 rounded-2xl border border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-[14px] truncate">{t.name}</div>
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">{t.problem?.title} • {t.members?.length || 0}/{t.maxSize || 5} members</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link to={`/dashboard/teams/${t._id}/workspace`} className="px-3 py-1.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF]/20 text-[11px] font-bold flex items-center gap-1">
                            Workspace →
                          </Link>
                          <span className="px-2 py-1 rounded-full bg-[var(--text-primary)] text-[var(--background)] text-[11px] font-bold capitalize">{t.status || 'forming'}</span>
                          <button onClick={() => setManageTeam(t)} className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface)]" title="Manage team & roles">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] flex-wrap">
                        <span className="font-semibold text-[#6C63FF]">Coverage {t.coverage || 0}%</span>
                        <span className="text-[var(--text-secondary)]">Match {t.matchPercentage || 0}%</span>
                        {t.missingSkills?.length ? <span className="text-amber-600">Missing: {t.missingSkills.join(', ')}</span> : <span className="text-emerald-600">All skills covered</span>}
                      </div>
                      {((Array.isArray(t.memberRoles) && t.memberRoles.length > 0) || (t.memberRoles && !Array.isArray(t.memberRoles) && Object.keys(t.memberRoles).length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border)]">
                          {(t.members || []).map((m) => {
                            const mid = String(m._id || m);
                            const roleEntry = Array.isArray(t.memberRoles)
                              ? t.memberRoles.find((mr) => String(mr.userId) === mid)?.teamRole
                              : t.memberRoles[mid];
                            return (
                              <span key={mid} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                                {m.name || 'Member'}: <strong>{roleEntry || (mid === String(t.leader?._id || t.leader) ? 'Leader' : 'Member')}</strong>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                    No teams yet. Create your first team.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Sent Invitations & Pending Invites */}
      {(tab === 'overview' || tab === 'invitations') && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold flex items-center gap-2"><Send className="w-4 h-4 text-[#6C63FF]" /> Sent Invitations ({sentInvites.length})</h3>
            <div className="mt-4 space-y-2">
              {sentInvites.length ? sentInvites.map((inv, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar user={inv.candidate} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{inv.candidate?.name || 'Student'}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">Team: {inv.teamName}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[var(--surface)] border border-[var(--border)]">
                    {inv.status}
                  </span>
                </div>
              )) : (
                <div className="p-6 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">
                  No outgoing invitations yet. Use Find Members to invite students.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Invitations Received ({invitedTeams.length})</h3>
            <div className="mt-4 space-y-2">
              {invitedTeams.length ? invitedTeams.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                  <Avatar user={t.leader} size="sm" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{t.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Leader: {t.leader?.name} • {t.problem?.title}</div>
                  </div>
                  <button onClick={() => respond(t._id, 'reject')} className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500"><X className="w-4 h-4" /></button>
                  <button onClick={() => respond(t._id, 'accept')} className="px-4 py-2 rounded-full bg-emerald-500 text-white text-[12px] font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Accept</button>
                </div>
              )) : (
                <div className="p-6 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                  No incoming team invites.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Workspace / Tasks / Submissions Launchers */}
      {(tab === 'workspace' || tab === 'tasks' || tab === 'submissions') && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-[16px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6C63FF]" />
              {tab === 'workspace' && 'Team Workspaces'}
              {tab === 'tasks' && 'Task & Milestone Coordination'}
              {tab === 'submissions' && 'Final Project Submissions (Team Leader Only)'}
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Open a team workspace directly to manage tasks, milestones, team discussions, resources, and final project submissions.
            </p>
          </div>
          {teams.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">
              Create a team first to unlock its collaborative workspace and project submission portal.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map((t) => {
                const sub = submissionsByTeam[t._id];
                const subPath = tab === 'submissions'
                  ? `/dashboard/teams/${t._id}/workspace?tab=submission`
                  : tab === 'tasks'
                  ? `/dashboard/teams/${t._id}/workspace?tab=tasks`
                  : `/dashboard/teams/${t._id}/workspace`;
                return (
                  <div key={t._id} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[15px]">{t.name}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{t.problem?.title || 'Problem Statement'} • {t.members?.length || 0} members</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] uppercase">
                        {sub ? sub.status : 'No submission yet'}
                      </span>
                    </div>
                    {sub && (
                      <div className="text-[12px] text-[var(--text-secondary)]">
                        Latest: <strong className="text-[var(--text-primary)]">{sub.title}</strong>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Link to={subPath}>
                        <Button size="sm" variant="gradient">
                          {tab === 'submissions' ? 'Manage Submission →' : tab === 'tasks' ? 'Manage Tasks →' : 'Open Workspace →'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <TeamManageModal open={!!manageTeam} team={manageTeam} problems={problems} onClose={() => setManageTeam(null)} onSaved={() => load()} />
    </div>
  );
}
