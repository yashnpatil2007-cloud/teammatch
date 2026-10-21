import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { userApi, errMsg } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Trash2, BadgeCheck } from 'lucide-react';

const ROLE_TINT = {
  admin: 'bg-zinc-900 text-white',
  organizer: 'bg-emerald-500 text-white',
  leader: 'bg-[#6C63FF] text-white',
  member: 'bg-slate-200 text-zinc-800',
};

export default function UsersPanel({ users, reload }) {
  const { user: me } = useAuth();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const run = async (id, fn) => {
    setErr('');
    setBusy(id);
    try {
      await fn();
      await reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const changeRole = (u, role) => run(u._id, () => userApi.update(u._id, { role }));
  const toggleVerify = (u) => run(u._id, () => userApi.update(u._id, { isVerified: !u.isVerified }));
  const remove = (u) => {
    if (window.confirm(`Delete ${u.name}? This cannot be undone.`)) run(u._id, () => userApi.remove(u._id));
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Manage Users <span className="text-[11px] font-semibold text-[var(--text-secondary)]">({users.length})</span></h3>
      {err && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[var(--text-secondary)] text-[11px] tracking-widest uppercase">
            <tr>
              <th className="text-left py-2">User</th>
              <th className="text-left">Role</th>
              <th className="text-center">Reliability</th>
              <th className="text-center">Verified</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-[var(--border)]">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar || 'https://i.pravatar.cc/100?img=12'} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{u.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    value={u.role}
                    disabled={busy === u._id || u._id === me?._id}
                    onChange={(e) => changeRole(u, e.target.value)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold capitalize border border-transparent outline-none cursor-pointer disabled:opacity-60 ${ROLE_TINT[u.role]}`}
                  >
                    <option value="member">member</option>
                    <option value="leader">leader</option>
                    <option value="organizer">organizer</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="text-center font-bold">{u.reliabilityScore ?? 75}</td>
                <td className="text-center">
                  <button onClick={() => toggleVerify(u)} disabled={busy === u._id} className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${u.isVerified ? 'border-emerald-500 text-emerald-600' : 'border-[var(--border)] text-[var(--text-secondary)]'} disabled:opacity-50`}>
                    <BadgeCheck className="w-3.5 h-3.5 inline mr-1" />{u.isVerified ? 'Verified' : 'Unverified'}
                  </button>
                </td>
                <td className="text-right">
                  <button onClick={() => remove(u)} disabled={busy === u._id || u._id === me?._id} className="w-8 h-8 rounded-full border border-[var(--border)] inline-flex items-center justify-center text-red-500 hover:bg-red-500/10 disabled:opacity-30" title="Delete user">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
