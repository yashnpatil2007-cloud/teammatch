import { useEffect, useState, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { userApi, competitionApi, errMsg } from '../../services/api';
import { UserCog, Plus, ShieldOff, Award, Calendar, RefreshCw, CheckSquare } from 'lucide-react';

export default function OrganizersPanel({ reload }) {
  const [organizers, setOrganizers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  // Create/Promote Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [mode, setMode] = useState('new'); // 'new' | 'promote'
  const [form, setForm] = useState({ name: '', email: '', password: '', userId: '', assignedCompetitions: [] });

  // Assign Competitions Modal
  const [assignOrg, setAssignOrg] = useState(null);
  const [selectedComps, setSelectedComps] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [orgs, comps, users] = await Promise.all([
        userApi.adminOrganizers(),
        competitionApi.list(),
        userApi.list(),
      ]);
      setOrganizers(orgs || []);
      setCompetitions(comps || []);
      setAllUsers((users || []).filter((u) => u.role === 'member' || u.role === 'leader'));
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const toggleFormComp = (id) => {
    setForm((prev) => ({
      ...prev,
      assignedCompetitions: prev.assignedCompetitions.includes(id)
        ? prev.assignedCompetitions.filter((x) => x !== id)
        : [...prev.assignedCompetitions, id],
    }));
  };

  const toggleAssignComp = (id) => {
    setSelectedComps((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateOrPromote = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy('create');
    try {
      const payload =
        mode === 'promote'
          ? { userId: form.userId, assignedCompetitions: form.assignedCompetitions }
          : { name: form.name, email: form.email, password: form.password, assignedCompetitions: form.assignedCompetitions };
      await userApi.adminCreateOrganizer(payload);
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '', userId: '', assignedCompetitions: [] });
      await load();
      if (reload) reload();
      notify(mode === 'promote' ? 'User promoted to Organizer!' : 'New Organizer account created!');
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy('');
    }
  };

  const openAssignModal = (org) => {
    setAssignOrg(org);
    setSelectedComps(org.assignedCompetitions || []);
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!assignOrg) return;
    setErr('');
    setBusy(assignOrg._id);
    try {
      await userApi.adminAssignOrganizer(assignOrg._id, { assignedCompetitions: selectedComps });
      setAssignOrg(null);
      await load();
      notify('Organizer competition assignments updated.');
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy('');
    }
  };

  const handleRevoke = async (org) => {
    if (!window.confirm(`Revoke Organizer privileges from "${org.name}" (${org.email}) and demote to Team Member?`)) return;
    setErr('');
    setBusy(org._id);
    try {
      await userApi.adminAssignOrganizer(org._id, { revoke: true, fallbackRole: 'member' });
      await load();
      if (reload) reload();
      notify(`Revoked organizer access for ${org.name}.`);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <UserCog className="w-5 h-5 text-[#6C63FF]" /> Organizer Management
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Create or promote Organizers, assign competitions they are authorized to manage, or revoke organizer privileges.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load} className="text-[12px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setCreateOpen(true)} className="text-[12px]">
            <Plus className="w-4 h-4" /> Add / Assign Organizer
          </Button>
        </div>
      </Card>

      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {organizers.map((org) => (
          <Card key={org._id} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar user={org} size="md" />
                <div className="min-w-0">
                  <div className="font-bold text-[15px] truncate">{org.name}</div>
                  <div className="text-[12px] text-[var(--text-secondary)] truncate">{org.email}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Problems Created: <strong>{org.problemCount || 0}</strong> • Status:{' '}
                    <span className="capitalize font-semibold">{org.accountStatus || 'active'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">
                Assigned Competitions ({(org.assignedCompetitionDetails || []).length})
              </div>
              {(org.assignedCompetitionDetails || []).length ? (
                <div className="flex flex-wrap gap-1.5">
                  {org.assignedCompetitionDetails.map((c) => (
                    <span
                      key={c._id}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-[#6C63FF]" /> {c.title}
                      <span className="text-[10px] opacity-70 capitalize">({c.status})</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-[var(--text-secondary)] italic">No competitions assigned yet.</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={() => openAssignModal(org)} className="text-[12px]">
                <Calendar className="w-3.5 h-3.5 text-[#6C63FF]" /> Assign Competitions
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy === org._id}
                onClick={() => handleRevoke(org)}
                className="text-[12px] text-red-500 hover:bg-red-500/10 ml-auto"
              >
                <ShieldOff className="w-3.5 h-3.5" /> Revoke Access
              </Button>
            </div>
          </Card>
        ))}

        {!loading && organizers.length === 0 && (
          <Card className="md:col-span-2 p-8 text-center text-[13px] text-[var(--text-secondary)]">
            No organizers registered yet. Click &ldquo;Add / Assign Organizer&rdquo; to create or promote one.
          </Card>
        )}
      </div>

      {/* Add / Promote Organizer Modal */}
      {createOpen && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Provision Organizer Account"
          subtitle="Create a new Organizer login or promote an existing user"
        >
          <form onSubmit={handleCreateOrPromote} className="space-y-4">
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold ${mode === 'new' ? 'bg-[var(--card)] shadow-sm text-[#6C63FF]' : 'text-[var(--text-secondary)]'}`}
              >
                Create New Account
              </button>
              <button
                type="button"
                onClick={() => setMode('promote')}
                className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold ${mode === 'promote' ? 'bg-[var(--card)] shadow-sm text-[#6C63FF]' : 'text-[var(--text-secondary)]'}`}
              >
                Promote Existing User
              </button>
            </div>

            {mode === 'new' ? (
              <>
                <Field label="Organizer Full Name">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Dr. Priya Verma" />
                </Field>
                <Field label="Email Address">
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="organizer@university.edu" />
                </Field>
                <Field label="Initial Password (min 6 chars)">
                  <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="••••••" />
                </Field>
              </>
            ) : (
              <Field label="Select Existing User">
                <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className={inputCls}>
                  <option value="">Choose user...</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Assign Competitions</label>
              <div className="max-h-[150px] overflow-y-auto space-y-1.5 p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
                {competitions.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-[12px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.assignedCompetitions.includes(c._id)}
                      onChange={() => toggleFormComp(c._id)}
                    />
                    <span className="font-semibold">{c.title}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] capitalize">({c.status})</span>
                  </label>
                ))}
                {!competitions.length && <div className="text-[11px] text-[var(--text-secondary)]">No competitions available yet.</div>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={busy === 'create'}>
                {busy === 'create' ? 'Saving...' : mode === 'promote' ? 'Promote to Organizer' : 'Create Organizer'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Competitions Modal */}
      {assignOrg && (
        <Modal
          open={Boolean(assignOrg)}
          onClose={() => setAssignOrg(null)}
          title={`Assign Competitions: ${assignOrg.name}`}
          subtitle="Organizer will only manage competitions assigned here or created by them"
        >
          <form onSubmit={handleSaveAssignments} className="space-y-4">
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {competitions.map((c) => (
                <label
                  key={c._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 cursor-pointer hover:border-[#6C63FF]/50"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedComps.includes(c._id)}
                      onChange={() => toggleAssignComp(c._id)}
                    />
                    <div>
                      <div className="font-bold text-[13px]">{c.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] capitalize">Status: {c.status}</div>
                    </div>
                  </div>
                  <CheckSquare className={`w-4 h-4 ${selectedComps.includes(c._id) ? 'text-[#6C63FF]' : 'text-[var(--text-secondary)]/30'}`} />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAssignOrg(null)}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={busy === assignOrg._id}>
                {busy === assignOrg._id ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
