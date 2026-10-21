import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { userApi, errMsg } from '../../services/api';
import { Award, Check, X, ExternalLink } from 'lucide-react';

const STATUS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function CertificatesPanel({ certs, reload }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const review = async (cert, action) => {
    setErr('');
    setBusy(cert._id);
    try {
      await userApi.verifyCertificate(cert._id, action);
      await reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold flex items-center gap-2"><Award className="w-4 h-4" /> Certificate Verification <span className="text-[11px] font-semibold text-[var(--text-secondary)]">({certs.length})</span></h3>
      <p className="text-[12px] text-[var(--text-secondary)] mt-1">Approve uploaded certificates to boost reliability and grant a Certified badge.</p>
      {err && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      <div className="mt-4 space-y-3">
        {certs.map((c) => (
          <div key={c._id} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-[var(--border)]">
            <img src={c.user?.avatar || 'https://i.pravatar.cc/100?img=12'} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[14px]">{c.title}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">{c.user?.name} • {c.issuer}{c.skill ? ` • ${c.skill}` : ''}</div>
            </div>
            {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] text-[12px] font-semibold flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> View</a>}
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border capitalize ${STATUS[c.status] || STATUS.pending}`}>{c.status}</span>
            {c.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => review(c, 'verify')} disabled={busy === c._id} className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[12px] font-semibold flex items-center gap-1 disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Verify</button>
                <button onClick={() => review(c, 'reject')} disabled={busy === c._id} className="px-3 py-1.5 rounded-full border border-[var(--border)] text-red-500 text-[12px] font-semibold flex items-center gap-1 disabled:opacity-50"><X className="w-3.5 h-3.5" /> Reject</button>
              </div>
            )}
          </div>
        ))}
        {!certs.length && <div className="py-8 text-center text-[13px] text-[var(--text-secondary)] border border-dashed border-[var(--border)] rounded-2xl">No certificates submitted yet.</div>}
      </div>
    </Card>
  );
}
