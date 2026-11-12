import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { userApi, errMsg } from '../../services/api';
import {
  Search,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Award,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Ban,
  RefreshCw,
  Eye,
  Filter,
} from 'lucide-react';

const ROLE_OPTIONS = ['member', 'leader', 'organizer', 'admin'];

const STATUS_BADGES = {
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  suspended: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  deactivated: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

export default function UsersPanel({ reload }) {
  const [directory, setDirectory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Search, Filters & Pagination
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Quick Status Modal
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [nextStatus, setNextStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');
  const [busyId, setBusyId] = useState('');

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await userApi.adminDirectory({
        q,
        role: roleFilter,
        accountStatus: statusFilter,
        isVerified: verifiedFilter,
        sortBy,
        sortDir: sortBy === 'name' ? 'asc' : 'desc',
        page,
        limit,
      });
      setDirectory(data.users || []);
      setSummary(data.summary || null);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, statusFilter, verifiedFilter, sortBy, page]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const changeRole = async (id, role) => {
    setErr('');
    setBusyId(id);
    try {
      await userApi.update(id, { role });
      await fetchDirectory();
      if (reload) reload();
      notify('User role updated and audit logged.');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusyId('');
    }
  };

  const toggleVerify = async (u) => {
    setErr('');
    setBusyId(u._id);
    try {
      await userApi.update(u._id, { isVerified: !u.isVerified });
      await fetchDirectory();
      if (reload) reload();
      notify(`User ${!u.isVerified ? 'verified' : 'unverified'}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusyId('');
    }
  };

  const openStatusModal = (u) => {
    setStatusModalUser(u);
    setNextStatus(u.accountStatus || 'active');
    setStatusReason(u.statusReason || '');
  };

  const handleStatusSave = async (e) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setErr('');
    setBusyId(statusModalUser._id);
    try {
      await userApi.adminUpdateStatus(statusModalUser._id, {
        accountStatus: nextStatus,
        reason: statusReason,
      });
      setStatusModalUser(null);
      await fetchDirectory();
      if (reload) reload();
      notify(`Account status set to ${nextStatus}.`);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusyId('');
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Permanently delete user "${u.name}" (${u.email})? This action cannot be undone.`)) return;
    setErr('');
    setBusyId(u._id);
    try {
      await userApi.remove(u._id);
      await fetchDirectory();
      if (reload) reload();
      notify('User removed.');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusyId('');
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setQ('');
    setRoleFilter('all');
    setStatusFilter('all');
    setVerifiedFilter('all');
    setSortBy('createdAt');
    setPage(1);
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total Users', value: summary.totalUsers, tone: 'text-[var(--text-primary)]' },
            { label: 'Active', value: summary.activeUsers, tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Suspended', value: summary.suspendedUsers, tone: 'text-amber-600 dark:text-amber-400' },
            { label: 'Deactivated', value: summary.deactivatedUsers, tone: 'text-red-600 dark:text-red-400' },
            { label: 'Verified Profiles', value: summary.verifiedUsers, tone: 'text-[#6C63FF]' },
            { label: 'Pending Certs', value: summary.pendingCertificatesTotal, tone: 'text-indigo-600 dark:text-indigo-400' },
          ].map((stat) => (
            <Card key={stat.label} className="p-3.5">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">{stat.label}</div>
              <div className={`text-[20px] font-extrabold mt-0.5 ${stat.tone}`}>{stat.value}</div>
            </Card>
          ))}
        </div>
      )}

      {err && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600 dark:text-red-400">
          {err}
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">
          {msg}
        </div>
      )}

      <Card className="p-5 space-y-4">
        {/* Search & Filters Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[15px] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6C63FF]" /> User Directory & Record Management
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Search, filter, inspect full 8-section profiles, verify credentials, and control account status.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchDirectory} className="self-start text-[12px]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, college, branch, skill..."
              className={`${inputCls} pl-9 py-2 text-[12px]`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} py-2 text-[12px]`}
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Role: {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} py-2 text-[12px]`}
            aria-label="Filter by account status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Status: Active</option>
            <option value="suspended">Status: Suspended</option>
            <option value="deactivated">Status: Deactivated</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} py-2 text-[12px]`}
            aria-label="Filter by verification"
          >
            <option value="all">All Verification</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified Only</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className={`${inputCls} py-2 text-[12px] flex-1`}
              aria-label="Sort users"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="reliabilityScore">Reliability</option>
            </select>
            {(q || roleFilter !== 'all' || statusFilter !== 'all' || verifiedFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                title="Reset filters"
                className="px-2.5 rounded-xl border border-[var(--border)] text-[11px] font-semibold hover:bg-[var(--surface)]"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase text-[var(--text-secondary)]">
                <th className="py-3 pr-3">User</th>
                <th className="py-3 pr-3">Role</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Records</th>
                <th className="py-3 pr-3">Reliability</th>
                <th className="py-3 pr-3">Verified</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {directory.map((u) => {
                const status = u.accountStatus || 'active';
                return (
                  <tr key={u._id} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3 min-w-[210px]">
                        <Avatar user={u} size="sm" />
                        <div className="min-w-0">
                          <Link
                            to={`/dashboard/admin/users/${u._id}`}
                            className="font-bold hover:text-[#6C63FF] transition truncate block"
                          >
                            {u.name}
                          </Link>
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">{u.email}</div>
                          {(u.college || u.branch || u.course) && (
                            <div className="text-[10px] text-[var(--text-secondary)] truncate">
                              {[u.college, u.course, u.branch].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <select
                        value={u.role}
                        disabled={busyId === u._id}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[12px] font-semibold capitalize"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => openStatusModal(u)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize transition hover:opacity-80 ${
                          STATUS_BADGES[status] || STATUS_BADGES.active
                        }`}
                        title="Manage account status"
                      >
                        {status}
                      </button>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] font-semibold">
                          {u.skillsCount ?? (u.skills || []).length} skills
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" />
                          {u.certificatesCount ?? (u.certificates || []).length}
                          {u.pendingCertificatesCount > 0 && (
                            <span className="ml-0.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                              {u.pendingCertificatesCount}
                            </span>
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] font-semibold">
                          {u.teamsCount ?? 0} teams
                        </span>
                        {u.hasResume && (
                          <span
                            title="Resume uploaded"
                            className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5"
                          >
                            <FileText className="w-3 h-3" /> CV
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3 font-extrabold text-[#6C63FF]">{u.reliabilityScore ?? 70}%</td>

                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        disabled={busyId === u._id}
                        onClick={() => toggleVerify(u)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                          u.isVerified
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#6C63FF]/40'
                        }`}
                      >
                        {u.isVerified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/dashboard/admin/users/${u._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white text-[11px] font-bold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => openStatusModal(u)}
                          title="Manage Status"
                          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-amber-600 hover:bg-amber-500/10 transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === u._id}
                          onClick={() => remove(u)}
                          title="Delete User"
                          className="p-1.5 rounded-lg border border-[var(--border)] text-red-500 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && directory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
                    No users match the current search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)] text-[12px]">
          <span className="text-[var(--text-secondary)]">
            Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{total}</strong> users
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-[12px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="px-3 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-bold">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-[12px]"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Status Modal */}
      {statusModalUser && (
        <Modal
          open={Boolean(statusModalUser)}
          onClose={() => setStatusModalUser(null)}
          title={`Manage Account Status: ${statusModalUser.name}`}
          subtitle={statusModalUser.email}
        >
          <form onSubmit={handleStatusSave} className="space-y-4">
            <Field label="Account Status">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className={inputCls}
              >
                <option value="active">Active (Full Access)</option>
                <option value="suspended">Suspended (Login Blocked)</option>
                <option value="deactivated">Deactivated (Account Disabled)</option>
              </select>
            </Field>

            <Field label="Administrative Reason / Notes">
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Provide clear context for this status change (recorded in Audit Log)..."
                className={inputCls}
              />
            </Field>

            {nextStatus !== 'active' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Setting an account to <strong>{nextStatus}</strong> immediately blocks login and invalidates active authenticated requests for this user.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStatusModalUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={busyId === statusModalUser._id}>
                {busyId === statusModalUser._id ? 'Saving...' : 'Update Account Status'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
