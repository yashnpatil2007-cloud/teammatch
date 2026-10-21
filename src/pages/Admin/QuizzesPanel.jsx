import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { quizApi, errMsg } from '../../services/api';
import { Brain, Plus, Pencil, Trash2, X } from 'lucide-react';

const blankQuestion = () => ({ q: '', options: ['', ''], answer: 0, level: 5 });
const EMPTY = { skill: '', level: 5, questions: [blankQuestion()] };

function QuizFormModal({ open, onClose, initialId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setErr('');
    if (initialId) {
      setLoading(true);
      quizApi.getById(initialId)
        .then((q) => setForm({ skill: q.skill, level: q.level, questions: q.questions.map((x) => ({ ...x })) }))
        .catch((e) => setErr(errMsg(e)))
        .finally(() => setLoading(false));
    } else {
      setForm(EMPTY);
    }
  }, [open, initialId]);

  const setQ = (qi, patch) => setForm((f) => ({ ...f, questions: f.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) }));
  const setOpt = (qi, oi, val) => setForm((f) => ({ ...f, questions: f.questions.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q)) }));
  const addOpt = (qi) => setQ(qi, { options: [...form.questions[qi].options, ''] });
  const delOpt = (qi, oi) => setForm((f) => ({ ...f, questions: f.questions.map((q, i) => {
    if (i !== qi) return q;
    const options = q.options.filter((_, j) => j !== oi);
    const answer = q.answer >= oi && q.answer > 0 ? q.answer - 1 : q.answer;
    return { ...q, options, answer: Math.min(answer, Math.max(0, options.length - 1)) };
  }) }));
  const addQ = () => setForm((f) => ({ ...f, questions: [...f.questions, blankQuestion()] }));
  const delQ = (qi) => setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const options = form.questions.map((q) => ({ ...q, options: q.options.map((o) => o.trim()).filter(Boolean) }));
    if (!form.skill.trim()) return setErr('Skill name is required');
    if (options.some((q) => !q.q.trim() || q.options.length < 2)) return setErr('Every question needs text and at least 2 options');
    setBusy(true);
    try {
      const payload = { skill: form.skill, level: Number(form.level), questions: options };
      if (initialId) await quizApi.update(initialId, payload);
      else await quizApi.create(payload);
      onSaved();
      onClose();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} wide title={initialId ? 'Edit Quiz' : 'New Quiz'} subtitle="Correct answer is marked with the radio button.">
      {loading ? <div className="py-10 text-center text-[13px] text-[var(--text-secondary)]">Loading quiz...</div> : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Skill"><input value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} placeholder="e.g. python" className={inputCls} /></Field>
            <Field label="Quiz level (1-10)"><input type="number" min="1" max="10" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls} /></Field>
          </div>

          <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
            {form.questions.map((q, qi) => (
              <div key={qi} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">Question {qi + 1}</span>
                  {form.questions.length > 1 && <button type="button" onClick={() => delQ(qi)} className="text-red-500 text-[11px] font-semibold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Remove</button>}
                </div>
                <input value={q.q} onChange={(e) => setQ(qi, { q: e.target.value })} placeholder="Question text" className={inputCls} />
                <div className="space-y-2">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`q${qi}`} checked={q.answer === oi} onChange={() => setQ(qi, { answer: oi })} className="accent-[var(--accent)]" />
                      <input value={o} onChange={(e) => setOpt(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className={inputCls} />
                      {q.options.length > 2 && <button type="button" onClick={() => delOpt(qi, oi)} className="w-7 h-7 shrink-0 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addOpt(qi)} className="text-[12px] font-semibold text-[var(--accent)]">+ Add option</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addQ} className="text-[13px] font-semibold text-[var(--accent)] flex items-center gap-1"><Plus className="w-4 h-4" /> Add question</button>

          {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={busy}>{busy ? 'Saving...' : initialId ? 'Save Changes' : 'Create Quiz'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function QuizzesPanel({ quizzes, reload }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');

  const remove = async (q) => {
    if (!window.confirm(`Delete the ${q.skill} quiz?`)) return;
    setErr('');
    try {
      await quizApi.remove(q._id);
      await reload();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold flex items-center gap-2"><Brain className="w-4 h-4" /> Manage Quizzes <span className="text-[11px] font-semibold text-[var(--text-secondary)]">({quizzes.length})</span></h3>
        <Button variant="gradient" size="sm" onClick={() => { setEditingId(null); setOpen(true); }}><Plus className="w-4 h-4" /> New Quiz</Button>
      </div>
      {err && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {quizzes.map((q) => (
          <div key={q._id} className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center"><Brain className="w-5 h-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[14px] capitalize">{q.skill}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Level {q.level} • {q.total} questions • {q.badge}</div>
            </div>
            <button onClick={() => { setEditingId(q._id); setOpen(true); }} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center hover:bg-[var(--surface)]" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(q)} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {!quizzes.length && <div className="sm:col-span-2 py-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">No quizzes yet.</div>}
      </div>

      <QuizFormModal open={open} onClose={() => setOpen(false)} initialId={editingId} onSaved={() => reload()} />
    </Card>
  );
}
