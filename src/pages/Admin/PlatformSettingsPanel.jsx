import { useEffect, useState, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { inputCls } from '../../components/ui/Modal';
import { userApi, errMsg } from '../../services/api';
import { Settings, ShieldAlert, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PlatformSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [s, r] = await Promise.all([userApi.adminSettings(), userApi.adminReports()]);
      setSettings(s);
      setReports(r || []);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setErr('');
    try {
      const updated = await userApi.adminUpdateSettings(settings);
      setSettings(updated);
      setMsg('Platform settings saved & audit logged.');
      setTimeout(() => setMsg(''), 3500);
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setSaving(false);
    }
  };

  const resolveReport = async (repId, status) => {
    setErr('');
    try {
      await userApi.adminResolveReport(repId, { status, resolutionNote: `Marked ${status} by administrator` });
      await load();
      setMsg(`Report marked as ${status}.`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  return (
    <div className="space-y-6">
      {err && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-600">{err}</div>}
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-700 dark:text-emerald-400">{msg}</div>}

      {settings && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="font-bold text-[16px] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#6C63FF]" /> Platform Settings & Role Permissions
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Control self-registration rules, competition publishing approval, and student capacity policies.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={load} className="text-[12px]">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Platform Display Name</label>
                <input
                  value={settings.platformName || 'TeamMatch'}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className={`${inputCls} mt-1`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-[var(--text-secondary)]">Max Teams Per Student</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxTeamsPerStudent ?? 3}
                  onChange={(e) => setSettings({ ...settings, maxTeamsPerStudent: Number(e.target.value) })}
                  className={`${inputCls} mt-1`}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'allowMemberRegistration', label: 'Allow Public Team Member Registration' },
                { key: 'allowLeaderRegistration', label: 'Allow Public Team Leader Registration' },
                { key: 'allowOrganizerRegistration', label: 'Allow Self-Registration as Organizer (Admin approval preferred)' },
                { key: 'requireAdminApprovalForCompetitions', label: 'Require Admin Approval Before Publishing Competitions' },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(settings[toggle.key])}
                    onChange={(e) => setSettings({ ...settings, [toggle.key]: e.target.checked })}
                  />
                  <span className="text-[12px] font-semibold">{toggle.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="gradient" disabled={saving}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Platform Settings'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* User & Content Reports */}
      <Card className="p-6 space-y-4">
        <div className="border-b border-[var(--border)] pb-3">
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> User & Content Moderation Reports ({reports.length})
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Review inappropriate content or misconduct reports submitted by platform participants.
          </p>
        </div>

        {reports.length ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/30 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px]">{r.reason}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C63FF]/10 text-[#6C63FF] uppercase">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Target: {r.targetType} ({r.targetId}) • Reported by: {r.reporterName}
                  </div>
                  {r.details && <p className="text-[12px]">{r.details}</p>}
                </div>

                {r.status === 'open' || r.status === 'reviewing' ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => resolveReport(r._id, 'resolved')} className="text-[11px] text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => resolveReport(r._id, 'dismissed')} className="text-[11px] text-[var(--text-secondary)]">
                      Dismiss
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--text-secondary)] italic">{r.resolutionNote || r.status}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-[12px] text-[var(--text-secondary)]">
            No active user or content reports.
          </div>
        )}
      </Card>
    </div>
  );
}

