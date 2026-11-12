import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { teamApi, errMsg } from '../../services/api';
import { UsersRound, Search, ShieldAlert, Archive, RefreshCw, ExternalLink, RotateCcw } from 'lucide-react';

const STATUS_BADGE = {
  forming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  complete: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  submitted: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  archived: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  moderated: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function TeamMonitoringPanel() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Moderation Modal
  const [modTeam, setModTeam] = useState(null);
  const [modStatus, setModStatus] = useState('archived');
  const [modReason, setModReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await teamApi.list();
      setTeams(data || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openModerate = (team, defaultStatus = 'archived') => {
    setModTeam(team);
    setModStatus(defaultStatus);
    setModReason(team.moderationReason || '');
  };

  const handleModerateSubmit = async (e) => {
    e.preventDefault();
    if (!modTeam) return;
    setBusy(true);
    setErr('');
    try {
      await teamApi.moderate(modTeam._id, { status: modStatus, reason: modReason });
      setMsg(`Team "${modTeam.name}" updated to "${modStatus}".`);
      setModTeam(null);
      await load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const filtered = teams.filter((t) => {
    const matchesStatus = statusFilter === 'all' || (t.status || 'forming') === statusFilter;
    if (!matchesStatus) return false;
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(term) ||
      (t.problem?.title || '').toLowerCase().includes(term) ||
      (t.leader?.name || t.leaderName || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-[#6C63FF]" /> Platform Team Monitoring & Moderation
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Monitor all student teams across competitions. Administrators moderate or archive teams with safeguards and cannot create student teams.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="text-[12px]">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </Card>

      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">{msg}</div>}

      <Card className="p-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search team name, leader, or problem statement..."
              className={`${inputCls} pl-9 py-2 text-[12px]`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} py-2 text-[12px]`}>
            <option value="all">All Statuses ({teams.length})</option>
            <option value="forming">Forming</option>
            <option value="complete">Complete</option>
            <option value="submitted">Submitted</option>
            <option value="archived">Archived</option>
            <option value="moderated">Moderated</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const st = t.status || 'forming';
            const isFlagged = st === 'archived' || st === 'moderated';
            return (
              <div key={t._id} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[15px] truncate">{t.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${STATUS_BADGE[st] || STATUS_BADGE.forming}`}>
                        {st}
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">
                      Problem: {t.problem?.title || 'Challenge'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-extrabold text-[#6C63FF]">{t.coverage ?? 0}%</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Coverage</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(t.members || []).map((m) => (
                    <div key={m._id || m} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px]">
                      <Avatar user={m} size="xs" />
                      <span className="font-medium">{m.name || m._id}</span>
                      {String(m._id || m) === String(t.leader?._id || t.leader) && (
                        <span className="text-[9px] font-bold text-[#6C63FF] uppercase">Leader</span>
                      )}
                    </div>
                  ))}
                </div>

                {t.moderationReason && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                    <strong>Moderation Note:</strong> {t.moderationReason}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
                  <Link
                    to={`/dashboard/teams/${t._id}/workspace`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6C63FF] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Inspect Workspace
                  </Link>

                  <div className="flex gap-1.5">
                    {!isFlagged ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openModerate(t, 'archived')} className="text-[11px] text-amber-600">
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openModerate(t, 'moderated')} className="text-[11px] text-red-500">
                          <ShieldAlert className="w-3.5 h-3.5" /> Moderate
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => openModerate(t, 'forming')} className="text-[11px] text-emerald-600">
                        <RotateCcw className="w-3.5 h-3.5" /> Restore Team
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <div className="md:col-span-2 py-10 text-center text-[13px] text-[var(--text-secondary)]">
              No teams match your current filters.
            </div>
          )}
        </div>
      </Card>

      {modTeam && (
        <Modal
          open={Boolean(modTeam)}
          onClose={() => setModTeam(null)}
          title={`Moderate Team: ${modTeam.name}`}
          subtitle="All team members will be notified and action is recorded in Audit Logs"
        >
          <form onSubmit={handleModerateSubmit} className="space-y-4">
            <Field label="Target Team Status">
              <select value={modStatus} onChange={(e) => setModStatus(e.target.value)} className={inputCls}>
                <option value="archived">Archived (Closed by Admin)</option>
                <option value="moderated">Moderated (Flagged / Suspended)</option>
                <option value="forming">Forming (Active / Restored)</option>
              </select>
            </Field>
            <Field label="Safeguard Reason (required for audit trail)">
              <textarea
                rows={3}
                required
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                placeholder="Explain why this team is being archived, moderated, or restored..."
                className={inputCls}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModTeam(null)}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={busy}>
                {busy ? 'Applying...' : 'Confirm Action'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
