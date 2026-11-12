import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { competitionApi, errMsg } from '../../services/api';
import {
  Trophy, Plus, Pencil, Users, Scale, Award, CheckCircle2,
  AlertTriangle, RefreshCw, Calendar, Eye, EyeOff, Trash2
} from 'lucide-react';

const STATUS_BADGE = {
  draft: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  published: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  ongoing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  closed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  bannerUrl: '',
  rules: '',
  eligibility: '',
  category: 'Open Innovation',
  registrationStart: '',
  registrationEnd: '',
  startDate: '',
  endDate: '',
  teamSizeMin: 2,
  teamSizeMax: 5,
  status: 'draft',
};

export default function CompetitionsPanel({ initialMode = 'list', focusMode = null, onUpdated }) {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const [formOpen, setFormOpen] = useState(initialMode === 'create');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [teamsModalComp, setTeamsModalComp] = useState(null);
  const [compTeams, setCompTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [judgesModalComp, setJudgesModalComp] = useState(null);
  const [judgesText, setJudgesText] = useState('');

  const [resultsModalComp, setResultsModalComp] = useState(null);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [winners, setWinners] = useState([]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await competitionApi.list();
      setCompetitions(data.competitions || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (initialMode === 'create') {
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormOpen(true);
    }
  }, [initialMode]);

  const flash = (m) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 4000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title || '',
      description: c.description || '',
      bannerUrl: c.bannerUrl || '',
      rules: c.rules || '',
      eligibility: c.eligibility || '',
      category: c.category || 'Open Innovation',
      registrationStart: c.registrationStart ? c.registrationStart.slice(0, 10) : '',
      registrationEnd: c.registrationEnd ? c.registrationEnd.slice(0, 10) : '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
      teamSizeMin: c.teamSizeMin ?? 2,
      teamSizeMax: c.teamSizeMax ?? 5,
      status: c.status || 'draft',
    });
    setFormOpen(true);
  };

  const saveCompetition = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = {
        ...form,
        teamSizeMin: Number(form.teamSizeMin),
        teamSizeMax: Number(form.teamSizeMax),
        registrationStart: form.registrationStart || null,
        registrationEnd: form.registrationEnd || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      if (editing) {
        await competitionApi.update(editing._id, payload);
        flash('Competition updated.');
      } else {
        await competitionApi.create(payload);
        flash('Competition created.');
      }
      setFormOpen(false);
      await load();
      onUpdated?.();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c, nextStatus) => {
    setErr('');
    try {
      await competitionApi.updateStatus(c._id, nextStatus);
      flash(`Competition status updated to ${nextStatus}.`);
      await load();
      onUpdated?.();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const openTeams = async (c) => {
    setTeamsModalComp(c);
    setLoadingTeams(true);
    setErr('');
    try {
      const data = await competitionApi.teams(c._id);
      setCompTeams(data.teams || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoadingTeams(false);
    }
  };

  const openJudges = (c) => {
    setJudgesModalComp(c);
    const lines = (c.judges || []).map((j) => `${j.name || ''} | ${j.email || ''} | ${j.expertise || ''}`).join('\n');
    setJudgesText(lines);
  };

  const saveJudges = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const judges = judgesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name = '', email = '', expertise = ''] = line.split('|').map((p) => p.trim());
          return { name, email, expertise };
        })
        .filter((j) => j.name || j.email);

      await competitionApi.assignJudges(judgesModalComp._id, { judges });
      flash('Judges roster updated.');
      setJudgesModalComp(null);
      await load();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setSaving(false);
    }
  };

  const openResults = async (c) => {
    setResultsModalComp(c);
    setResultsPublished(!!c.resultsPublished);
    setWinners(c.winners?.length ? c.winners : [{ rank: 1, teamId: '', teamName: '', projectTitle: '', score: 0, notes: '' }]);
    try {
      const data = await competitionApi.teams(c._id);
      setCompTeams(data.teams || []);
    } catch {
      setCompTeams([]);
    }
  };

  const addWinnerRow = () => {
    setWinners((prev) => [...prev, { rank: prev.length + 1, teamId: '', teamName: '', projectTitle: '', score: 0, notes: '' }]);
  };

  const updateWinnerRow = (idx, field, value) => {
    setWinners((prev) =>
      prev.map((w, i) => {
        if (i !== idx) return w;
        if (field === 'teamId') {
          const found = compTeams.find((t) => t._id === value);
          return { ...w, teamId: value, teamName: found ? found.name : w.teamName };
        }
        return { ...w, [field]: value };
      })
    );
  };

  const removeWinnerRow = (idx) => {
    setWinners((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveResults = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const cleanWinners = winners
        .filter((w) => w.teamName || w.teamId || w.projectTitle)
        .map((w) => ({
          ...w,
          rank: Number(w.rank) || 1,
          score: Number(w.score) || 0,
        }));
      await competitionApi.publishResults(resultsModalComp._id, {
        resultsPublished,
        winners: cleanWinners,
      });
      flash(resultsPublished ? 'Official competition results published!' : 'Results saved as draft.');
      setResultsModalComp(null);
      await load();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-[18px] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#6C63FF]" />
            {focusMode === 'judging'
              ? 'Judging & Evaluation Panel'
              : focusMode === 'results'
              ? 'Results & Winners Publishing'
              : 'My Assigned & Created Competitions'}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Manage competition rules, dates, team capacity, judges, participating teams, and official winners.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={load}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="gradient" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create Competition
          </Button>
        </div>
      </div>

      {err && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{err}</span>
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{msg}</span>
        </div>
      )}

      <div className="space-y-3">
        {competitions.map((c) => (
          <div key={c._id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-extrabold text-[15px]">{c.title}</h4>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>
                    {c.status || 'draft'}
                  </span>
                  {c.resultsPublished && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                      Results Published
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">{c.description || 'No description provided.'}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-secondary)] pt-1">
                  <span>Category: <strong className="text-[var(--text-primary)]">{c.category || 'General'}</strong></span>
                  <span>Team Size: <strong className="text-[var(--text-primary)]">{c.teamSizeMin || 2}–{c.teamSizeMax || 5}</strong></span>
                  <span>Problems: <strong className="text-[var(--text-primary)]">{c.problemCount ?? 0}</strong></span>
                  <span>Teams: <strong className="text-[var(--text-primary)]">{c.teamCount ?? 0}</strong></span>
                  <span>Judges: <strong className="text-[var(--text-primary)]">{c.judges?.length || 0}</strong></span>
                  {c.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Ends {String(c.endDate).slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openTeams(c)}>
                  <Users className="w-3.5 h-3.5" /> Teams
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openJudges(c)}>
                  <Scale className="w-3.5 h-3.5" /> Judges
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openResults(c)}>
                  <Award className="w-3.5 h-3.5" /> Results
                </Button>
                {c.status !== 'published' ? (
                  <Button size="sm" variant="gradient" onClick={() => toggleStatus(c, 'published')}>
                    <Eye className="w-3.5 h-3.5" /> Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(c, 'closed')}>
                    <EyeOff className="w-3.5 h-3.5" /> Close
                  </Button>
                )}
              </div>
            </div>

            {c.winners?.length > 0 && (
              <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[11px] flex flex-wrap gap-3">
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Winners ({c.resultsPublished ? 'Public' : 'Draft'}):
                </span>
                {c.winners.map((w, idx) => (
                  <span key={idx} className="font-semibold">
                    #{w.rank} {w.teamName || 'Team'} {w.projectTitle ? `(${w.projectTitle})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {!loading && competitions.length === 0 && (
          <div className="p-10 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-2xl">
            No competitions assigned or created yet. Click "Create Competition" to start one.
          </div>
        )}
      </div>

      {/* Create / Edit Competition Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        wide
        title={editing ? 'Edit Competition' : 'Create New Competition'}
        subtitle="Configure rules, timeline, team capacity limits, and publication state."
      >
        <form onSubmit={saveCompetition} className="space-y-4">
          <Field label="Competition Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Global AI Builder Challenge 2026" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the theme, goals, and prize pool..." className={inputCls} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Category">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Min Team Size">
              <input type="number" min="1" max="20" value={form.teamSizeMin} onChange={(e) => setForm({ ...form, teamSizeMin: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Max Team Size">
              <input type="number" min="1" max="20" value={form.teamSizeMax} onChange={(e) => setForm({ ...form, teamSizeMax: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Rules & Guidelines">
              <textarea rows={2} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Original code during competition window..." className={inputCls} />
            </Field>
            <Field label="Eligibility Criteria">
              <textarea rows={2} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="Open to university students and builders..." className={inputCls} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Reg. Start">
              <input type="date" value={form.registrationStart} onChange={(e) => setForm({ ...form, registrationStart: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Reg. End">
              <input type="date" value={form.registrationEnd} onChange={(e) => setForm({ ...form, registrationEnd: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
            </Field>
            <Field label="End Date">
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Banner Image URL (Optional)">
              <input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Competition'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Participating Teams Modal */}
      {teamsModalComp && (
        <Modal
          open={!!teamsModalComp}
          onClose={() => setTeamsModalComp(null)}
          wide
          title={`Participating Teams — ${teamsModalComp.title}`}
          subtitle="Read-only monitoring of teams competing in this competition."
        >
          {loadingTeams ? (
            <div className="py-8 text-center text-[13px] text-[var(--text-secondary)]">Loading teams...</div>
          ) : compTeams.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed rounded-xl">
              No teams registered in this competition yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {compTeams.map((t) => (
                <div key={t._id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[14px] flex items-center gap-2">
                      {t.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)] uppercase">{t.status}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Problem: {t.problem?.title || '—'} • Leader: {t.leader?.name || '—'} • Members: {t.members?.length || 0}/{t.maxSize || 5} • Coverage: {t.coverage || 0}%
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/teams/${t._id}/workspace`}
                    className="px-3 py-1.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-[11px] font-bold"
                  >
                    Inspect Workspace →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Assign Judges Modal */}
      {judgesModalComp && (
        <Modal
          open={!!judgesModalComp}
          onClose={() => setJudgesModalComp(null)}
          title={`Assign Judges — ${judgesModalComp.title}`}
          subtitle="Enter one judge per line in format: Name | Email | Expertise"
        >
          <form onSubmit={saveJudges} className="space-y-4">
            <Field label="Judges Roster">
              <textarea
                rows={5}
                value={judgesText}
                onChange={(e) => setJudgesText(e.target.value)}
                placeholder={'Dr. Ananya Rao | ananya@judge.org | Distributed Systems\nMarcus Chen | marcus@vc.io | Applied AI'}
                className={inputCls}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setJudgesModalComp(null)}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={saving}>
                {saving ? 'Saving...' : 'Save Judges'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Publish Results & Winners Modal */}
      {resultsModalComp && (
        <Modal
          open={!!resultsModalComp}
          onClose={() => setResultsModalComp(null)}
          wide
          title={`Results & Winners — ${resultsModalComp.title}`}
          subtitle="Select winning teams and publish official results."
        >
          <form onSubmit={saveResults} className="space-y-4">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={resultsPublished}
                onChange={(e) => setResultsPublished(e.target.checked)}
                className="w-4 h-4 accent-[#6C63FF]"
              />
              Publish official results publicly
            </label>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto">
              {winners.map((w, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] grid sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <Field label="Rank">
                      <input type="number" min="1" value={w.rank} onChange={(e) => updateWinnerRow(idx, 'rank', e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <div className="sm:col-span-4">
                    <Field label="Team">
                      {compTeams.length > 0 ? (
                        <select value={w.teamId} onChange={(e) => updateWinnerRow(idx, 'teamId', e.target.value)} className={inputCls}>
                          <option value="">Select team or type custom...</option>
                          {compTeams.map((t) => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input value={w.teamName} onChange={(e) => updateWinnerRow(idx, 'teamName', e.target.value)} placeholder="Team Name" className={inputCls} />
                      )}
                    </Field>
                  </div>
                  <div className="sm:col-span-3">
                    <Field label="Project Title">
                      <input value={w.projectTitle} onChange={(e) => updateWinnerRow(idx, 'projectTitle', e.target.value)} placeholder="Project Title" className={inputCls} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Score">
                      <input type="number" min="0" max="100" value={w.score} onChange={(e) => updateWinnerRow(idx, 'score', e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeWinnerRow(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Remove row">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="ghost" onClick={addWinnerRow}>
                <Plus className="w-3.5 h-3.5" /> Add Winner Slot
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setResultsModalComp(null)}>Cancel</Button>
                <Button type="submit" variant="gradient" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Results'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  );
}
