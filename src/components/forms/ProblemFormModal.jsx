import { useState, useEffect } from 'react';
import { Modal, Field, inputCls } from '../ui/Modal';
import { Button } from '../ui/Button';
import { problemApi, errMsg } from '../../services/api';
import { Sparkles } from 'lucide-react';

const CATEGORIES = ['AI/ML', 'Web3', 'HealthTech', 'FinTech', 'EdTech', 'IoT', 'Open'];
const EMPTY = { title: '', description: '', category: 'AI/ML', prize: '₹2L', deadline: '', teamMin: 2, teamMax: 4 };

export default function ProblemFormModal({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [ai, setAi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setErr('');
    setAi(null);
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        category: initial.category || 'AI/ML',
        prize: initial.prize || '₹2L',
        deadline: initial.deadline || '',
        teamMin: initial.teamSize?.min ?? 2,
        teamMax: initial.teamSize?.max ?? 4,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const analyze = async () => {
    setErr('');
    if (!form.title || !form.description) return setErr('Enter a title and description to analyze');
    setAnalyzing(true);
    try {
      const res = await problemApi.analyze(form.title, form.description);
      setAi(res);
      if (res.teamRequirement) {
        setForm((f) => ({ ...f, teamMin: res.teamRequirement.min ?? f.teamMin, teamMax: res.teamRequirement.max ?? f.teamMax }));
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        prize: form.prize,
        deadline: form.deadline || null,
        teamSize: { min: Number(form.teamMin), max: Number(form.teamMax) },
      };
      const data = initial ? await problemApi.update(initial._id, payload) : await problemApi.create(payload);
      onSaved(data, !!initial);
      onClose();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} wide title={initial ? 'Edit Problem Statement' : 'New Problem Statement'} subtitle="AI extracts required skills, roles, difficulty & team size.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input value={form.title} onChange={set('title')} placeholder="e.g. AI Disaster Response" className={inputCls} required />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Mention tech like Python, React, Solidity, Figma, AWS..." className={inputCls} required />
        </Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Category">
            <select value={form.category} onChange={set('category')} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Prize">
            <input value={form.prize} onChange={set('prize')} className={inputCls} />
          </Field>
          <Field label="Deadline">
            <input type="date" value={form.deadline || ''} onChange={set('deadline')} className={inputCls} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="Team min">
            <input type="number" min="1" value={form.teamMin} onChange={set('teamMin')} className={inputCls} />
          </Field>
          <Field label="Team max">
            <input type="number" min="1" value={form.teamMax} onChange={set('teamMax')} className={inputCls} />
          </Field>
          <Button type="button" variant="ghost" onClick={analyze} disabled={analyzing}>
            <Sparkles className="w-4 h-4" /> {analyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>

        {ai && (
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[12px] space-y-1">
            <div><b>Difficulty:</b> {ai.difficulty} ({ai.difficultyScore}/10)</div>
            <div><b>Skills:</b> {(ai.requiredSkills || []).map((s) => s.name).join(', ') || '—'}</div>
            <div><b>Roles:</b> {(ai.requiredRoles || []).join(', ') || '—'}</div>
          </div>
        )}

        {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="gradient" disabled={busy}>{busy ? 'Saving...' : initial ? 'Save Changes' : 'Publish Problem'}</Button>
        </div>
      </form>
    </Modal>
  );
}
