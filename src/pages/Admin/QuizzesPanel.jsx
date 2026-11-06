import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { quizApi, assessmentApi, errMsg } from '../../services/api';
import {
  Brain,
  Plus,
  Pencil,
  Trash2,
  X,
  Target,
  Sparkles,
  BarChart3,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';

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
      quizApi
        .getById(initialId)
        .then((q) =>
          setForm({ skill: q.skill, level: q.level, questions: q.questions.map((x) => ({ ...x })) })
        )
        .catch((e) => setErr(errMsg(e)))
        .finally(() => setLoading(false));
    } else {
      setForm(EMPTY);
    }
  }, [open, initialId]);

  const setQ = (qi, patch) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)) }));
  const setOpt = (qi, oi, val) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) } : q
      ),
    }));
  const addOpt = (qi) => setQ(qi, { options: [...form.questions[qi].options, ''] });
  const delOpt = (qi, oi) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const answer = q.answer >= oi && q.answer > 0 ? q.answer - 1 : q.answer;
        return { ...q, options, answer: Math.min(answer, Math.max(0, options.length - 1)) };
      }),
    }));
  const addQ = () => setForm((f) => ({ ...f, questions: [...f.questions, blankQuestion()] }));
  const delQ = (qi) => setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const options = form.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => o.trim()).filter(Boolean),
    }));
    if (!form.skill.trim()) return setErr('Skill name is required');
    if (options.some((q) => !q.q.trim() || q.options.length < 2)) {
      return setErr('Every question needs text and at least 2 options');
    }
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
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={initialId ? 'Edit Skill Assessment' : 'New Skill Assessment'}
      subtitle="Define questions, options, and difficulty tier. The radio button sets the correct answer (scored server-side)."
    >
      {loading ? (
        <div className="py-10 text-center text-[13px] text-[var(--text-secondary)]">Loading quiz data...</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Skill Slug / Name">
              <input
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
                placeholder="e.g. react, python, node, ml"
                className={inputCls}
                required
              />
            </Field>
            <Field label="Assessment Target Level (1-10)">
              <input
                type="number"
                min="1"
                max="10"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
            {form.questions.map((q, qi) => (
              <div
                key={qi}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">
                    Question {qi + 1}
                  </span>
                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => delQ(qi)}
                      className="text-red-500 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <input
                  value={q.q}
                  onChange={(e) => setQ(qi, { q: e.target.value })}
                  placeholder="Enter question text..."
                  className={inputCls}
                />
                <div className="space-y-2">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={q.answer === oi}
                        onChange={() => setQ(qi, { answer: oi })}
                        className="accent-[var(--accent)] cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        value={o}
                        onChange={(e) => setOpt(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className={inputCls}
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => delOpt(qi, oi)}
                          className="w-7 h-7 shrink-0 rounded-full border border-[var(--border)] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-secondary)]">
                  <span>Radio button selects the correct answer</span>
                  <button
                    type="button"
                    onClick={() => addOpt(qi)}
                    className="font-semibold text-[var(--accent)] hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQ}
            className="text-[13px] font-semibold text-[var(--accent)] flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add question
          </button>

          {err && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-[var(--border)]">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy ? 'Saving...' : initialId ? 'Save Changes' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function QuizzesPanel({ quizzes = [], reload }) {
  const [activeTab, setActiveTab] = useState('technical');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [err, setErr] = useState('');

  const loadStats = async () => {
    try {
      const stats = await assessmentApi.adminStats();
      setAdminStats(stats);
    } catch {
      // Ignore background stats load error
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const remove = async (q) => {
    if (!window.confirm(`Delete the ${q.skill} assessment?`)) return;
    setErr('');
    try {
      await quizApi.remove(q._id);
      await reload();
      await loadStats();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const t = adminStats?.totals || {};

  return (
    <div className="space-y-6">
      {/* Assessment Metrics Summary Header */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Completed Tests',
            value: t.allAttempts || 0,
            icon: BarChart3,
            color: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'Avg Technical Score',
            value: t.avgTechnicalScore ? `${t.avgTechnicalScore}%` : '—',
            icon: Brain,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Avg Aptitude Score',
            value: t.avgAptitudeScore ? `${t.avgAptitudeScore}%` : '—',
            icon: Target,
            color: 'from-amber-500 to-orange-600',
          },
          {
            label: 'Personality Profiles',
            value: t.personalityAttempts || 0,
            icon: Sparkles,
            color: 'from-purple-500 to-pink-600',
          },
        ].map((c) => (
          <Card key={c.label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shrink-0`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold">{c.value}</div>
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {c.label}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-[18px] flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Assessment Question Banks & Quizzes
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Manage technical skill banks, objective aptitude evaluation, and personality working-style modules.
            </p>
          </div>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> New Skill Assessment
          </Button>
        </div>

        {/* Tab navigation for Assessment Categories */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
          {[
            { key: 'technical', label: 'Technical Skills', count: quizzes.length },
            {
              key: 'aptitude',
              label: 'Aptitude & Logic',
              count: adminStats?.questionCounts?.aptitude || 10,
            },
            {
              key: 'personality',
              label: 'Working-Style Questions',
              count: adminStats?.questionCounts?.personality || 10,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[var(--border)]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {err && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">
            {err}
          </div>
        )}

        {/* Technical Quizzes View */}
        {activeTab === 'technical' && (
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {quizzes.map((q) => (
              <div
                key={q._id}
                className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--text-secondary)]/40 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] text-[var(--background)] flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[14px] capitalize">{q.skill}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Level {q.level} • {q.total} questions • Badge: {q.badge}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingId(q._id);
                    setOpen(true);
                  }}
                  className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center hover:bg-[var(--surface)]"
                  title="Edit Assessment"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(q)}
                  className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Delete Assessment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {!quizzes.length && (
              <div className="sm:col-span-2 py-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">
                No technical skill quizzes configured. Click &ldquo;New Skill Assessment&rdquo; to add one.
              </div>
            )}
          </div>
        )}

        {/* Aptitude Bank Info */}
        {activeTab === 'aptitude' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[13px]">
              <div className="font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Aptitude & Logical Reasoning Bank
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                Aptitude assessments feature 10 objective questions with server-side validation across Deductive Logic, Numerical Reasoning, Pattern Recognition, and Analytical Problem Solving.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  10-Minute Countdown Timer
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  Objective Server-Side Grading
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  Reliability Score Integration
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Personality Bank Info */}
        {activeTab === 'personality' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[13px]">
              <div className="font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Working-Style & Team Archetype Dimension Evaluation
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                Evaluates 5 collaboration dimensions: Execution, Innovation, Collaboration, Leadership, and Detail Orientation. Classifies students into collaborative archetypes (e.g. The Systems Architect, The Fast Prototyper, The Team Catalyst).
              </p>
            </div>
          </div>
        )}
      </Card>

      <QuizFormModal
        open={open}
        onClose={() => setOpen(false)}
        initialId={editingId}
        onSaved={async () => {
          await reload();
          await loadStats();
        }}
      />
    </div>
  );
}
