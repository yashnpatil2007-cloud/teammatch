import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import ProblemFormModal from '../../components/forms/ProblemFormModal';
import { problemApi, errMsg } from '../../services/api';
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';

export default function ProblemsPanel({ problems, reload }) {
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setOpen(true); };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    setErr('');
    try {
      await problemApi.remove(p._id);
      await reload();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Manage Problem Statements <span className="text-[11px] font-semibold text-[var(--text-secondary)]">({problems.length})</span></h3>
        <Button variant="gradient" size="sm" onClick={openNew}><Plus className="w-4 h-4" /> New Problem</Button>
      </div>
      {err && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[var(--text-secondary)] text-[11px] tracking-widest uppercase">
            <tr>
              <th className="text-left py-2">Problem</th>
              <th className="text-center">Category</th>
              <th className="text-center">Difficulty</th>
              <th className="text-center">Prize</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p._id} className="border-t border-[var(--border)]">
                <td className="py-3 font-medium max-w-[320px]">
                  <div className="truncate">{p.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">{p.description}</div>
                </td>
                <td className="text-center"><span className="px-2 py-1 rounded-full bg-[var(--surface)] text-[11px] font-semibold">{p.category}</span></td>
                <td className="text-center">{p.difficulty || '—'}</td>
                <td className="text-center font-semibold">{p.prize || '—'}</td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center hover:bg-[var(--surface)] mr-1" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(p)} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-red-500 hover:bg-red-500/10" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {!problems.length && <tr><td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">No problem statements yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <ProblemFormModal open={open} onClose={() => setOpen(false)} initial={editing} onSaved={() => reload()} />
    </Card>
  );
}
