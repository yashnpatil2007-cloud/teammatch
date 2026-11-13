import { useEffect, useState, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { competitionApi, errMsg, resolveFileUrl } from '../../services/api';
import { Trophy, Calendar, Users, FileText, RefreshCw, CheckCircle2 } from 'lucide-react';

const COMP_STATUS = {
  draft: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20',
  published: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ongoing: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  closed: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
};

export default function CompetitionsOversightPanel() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await competitionApi.list();
      setCompetitions(data || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (comp, status) => {
    setBusyId(comp._id);
    setErr('');
    try {
      await competitionApi.updateStatus(comp._id, status);
      setMsg(`Competition "${comp.title}" set to ${status}.`);
      await load();
      setTimeout(() => setMsg(''), 3500);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#6C63FF]" /> Platform Competition Oversight
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Monitor all competitions, assigned organizers, problem statements, teams, submission progress, and published results.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="text-[12px]">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </Card>

      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">{msg}</div>}

      <div className="space-y-4">
        {competitions.map((c) => (
          <Card key={c._id} className="p-5 space-y-4">
            {c.bannerUrl && (
              <div className="w-full h-32 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-sunken)]">
                <img
                  src={resolveFileUrl(c.bannerUrl)}
                  alt={c.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-[240px]">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-extrabold text-[16px]">{c.title}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${COMP_STATUS[c.status] || COMP_STATUS.published}`}>
                    {c.status}
                  </span>
                  {c.resultsPublished && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Results Published
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">{c.description}</p>
                <div className="flex flex-wrap gap-4 text-[11px] text-[var(--text-secondary)] pt-1">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {c.stats?.problemsCount || 0} Problems</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.stats?.teamsCount || 0} Teams</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {c.stats?.submissionsCount || 0} Submissions ({c.stats?.approvedCount || 0} approved)</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Team Size: {c.teamSizeMin}–{c.teamSizeMax}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Override Status</label>
                <select
                  value={c.status}
                  disabled={busyId === c._id}
                  onChange={(e) => changeStatus(c, e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[12px] font-bold capitalize"
                >
                  <option value="draft">Draft (Unpublished)</option>
                  <option value="published">Published</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {c.winners?.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[12px]">
                <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">Recorded Winners</div>
                <div className="flex flex-wrap gap-2">
                  {c.winners.map((w) => (
                    <span key={`${w.rank}-${w.teamId}`} className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)] font-semibold">
                      #{w.rank} {w.teamName} {w.prize ? `(${w.prize})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {!loading && competitions.length === 0 && (
          <Card className="p-8 text-center text-[13px] text-[var(--text-secondary)]">
            No competitions created yet.
          </Card>
        )}
      </div>
    </div>
  );
}

