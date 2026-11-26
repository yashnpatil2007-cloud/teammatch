import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal, Field, inputCls } from '../../components/ui/Modal';
import { teamApi, submissionApi, errMsg, resolveFileUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/ui/Avatar';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Send,
  Link as LinkIcon,
  Code2,
  Globe,
  FileText,
  UploadCloud,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquare,
  Trophy,
  ShieldCheck,
  Trash2,
  ExternalLink,
  RefreshCw,
  X,
  FileCheck,
  UserPlus,
  Crown
} from 'lucide-react';

const TEAM_ROLE_OPTIONS = [
  'Generalist',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Specialist',
  'Data Engineer',
  'UI/UX Designer',
  'Mobile Developer',
  'DevOps / Cloud',
  'QA / Testing',
  'Smart Contract Dev',
  'Project Pitch / Lead',
];

export default function TeamWorkspace() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTabParam = new URLSearchParams(location.search).get('tab');
  const validInitialTab = ['tasks', 'milestones', 'submission', 'chat', 'resources', 'timeline'].includes(initialTabParam)
    ? initialTabParam
    : 'tasks';

  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState(validInitialTab); // 'tasks' | 'milestones' | 'submission' | 'chat' | 'resources' | 'timeline'

  // Task creation modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    assignee: '',
    dueDate: '',
  });
  const [taskBusy, setTaskBusy] = useState(false);

  // Milestone creation modal
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    deadline: '',
    status: 'pending',
  });

  // Resource modal
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    url: '',
    type: 'doc',
  });

  // Chat message state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  // Submission state
  const [submission, setSubmission] = useState(null);
  const [subForm, setSubForm] = useState({
    title: '',
    description: '',
    githubUrl: '',
    demoUrl: '',
    presentationUrl: '',
    attachments: [],
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadWorkspace = async () => {
    try {
      setErr('');
      const data = await teamApi.workspace(teamId);
      setWorkspaceData(data);
      setChatMessages(data.messages || []);

      // Load submission details
      try {
        const subData = await submissionApi.getByTeam(teamId);
        if (subData?.submission) {
          setSubmission(subData.submission);
          setSubForm({
            title: subData.submission.title || '',
            description: subData.submission.description || '',
            githubUrl: subData.submission.githubUrl || '',
            demoUrl: subData.submission.demoUrl || '',
            presentationUrl: subData.submission.presentationUrl || '',
            attachments: subData.submission.attachments || [],
          });
        }
      } catch {}
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [teamId]);

  // Poll chat messages every 10 seconds while on chat tab
  useEffect(() => {
    if (activeTab !== 'chat') return;
    const interval = setInterval(async () => {
      try {
        const msgs = await teamApi.messages(teamId);
        setChatMessages(msgs || []);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [teamId, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Task actions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskBusy(true);
    setErr('');
    try {
      await teamApi.createTask(teamId, taskForm);
      setTaskModalOpen(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', status: 'To Do', assignee: '', dueDate: '' });
      setMsg('Task created and added to workspace!');
      loadWorkspace();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setTaskBusy(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    try {
      await teamApi.updateTask(teamId, taskId, { status: nextStatus });
      loadWorkspace();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await teamApi.deleteTask(teamId, taskId);
      loadWorkspace();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Milestone actions
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await teamApi.addMilestone(teamId, milestoneForm);
      setMilestoneModalOpen(false);
      setMilestoneForm({ title: '', deadline: '', status: 'pending' });
      loadWorkspace();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const handleToggleMilestone = async (msId, currentStatus) => {
    const next = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await teamApi.updateMilestone(teamId, msId, { status: next });
      loadWorkspace();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const handleAssignRole = async (memberId, role) => {
    try {
      const currentRoles = Array.isArray(team.memberRoles)
        ? [...team.memberRoles]
        : Object.entries(team.memberRoles || {}).map(([userId, teamRole]) => ({ userId, teamRole }));
      const idx = currentRoles.findIndex((r) => String(r.userId) === String(memberId));
      if (idx !== -1) {
        currentRoles[idx].teamRole = role;
      } else {
        currentRoles.push({ userId: String(memberId), teamRole: role });
      }
      await teamApi.updateMemberRoles(team._id, { memberRoles: currentRoles });
      setWorkspaceData((prev) => ({
        ...prev,
        team: {
          ...prev.team,
          memberRoles: currentRoles,
        },
      }));
      setMsg('Teammate functional role updated successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Resource actions
  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      await teamApi.addResource(teamId, resourceForm);
      setResourceModalOpen(false);
      setResourceForm({ title: '', url: '', type: 'doc' });
      loadWorkspace();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  // Message actions
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      const added = await teamApi.postMessage(teamId, newMsgText.trim());
      setChatMessages((prev) => [...prev, added]);
      setNewMsgText('');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSendingMsg(false);
    }
  };

  // File upload for submissions
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setErr('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await submissionApi.upload(formData);
      setSubForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, res.file],
      }));
      setMsg(`File "${file.name}" uploaded successfully!`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (idx) => {
    setSubForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  };

  // Project Submission actions
  const handleSubmitProject = async (targetStatus = 'submitted') => {
    setSubmitting(true);
    setErr('');
    try {
      const res = await submissionApi.submit({
        teamId,
        ...subForm,
        status: targetStatus,
      });
      setSubmission(res);
      setMsg(targetStatus === 'draft' ? 'Project draft saved!' : 'Project submitted for organizer review! 🎉');
      loadWorkspace();
      setTimeout(() => setMsg(''), 4500);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--text-secondary)]">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
        Loading team workspace...
      </div>
    );
  }

  if (err && !workspaceData) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-extrabold text-[16px] text-red-600">Access Restricted</h3>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">{err}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/teams')} className="mt-4">
          Back to Teams
        </Button>
      </Card>
    );
  }

  const team = workspaceData.team;
  const problem = workspaceData.problem;
  const metrics = workspaceData.metrics || {};
  const isLeader = workspaceData.permissions?.isLeader;
  const canEdit = workspaceData.permissions?.canEdit;
  const tasks = workspaceData.tasks || [];

  return (
    <div className="space-y-6">
      {/* Pending Join Requests Alert for Team Leader */}
      {isLeader && (team.invites || []).some((i) => i.status === 'requested') && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[14px] text-[var(--text-primary)]">
                {(team.invites || []).filter((i) => i.status === 'requested').length} Student Join Request(s) Pending
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">
                Students have applied to join this team. Review and approve them on your Leader Dashboard.
              </div>
            </div>
          </div>
          <Link
            to="/dashboard/leader"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[12px] flex items-center gap-1.5 transition"
          >
            Review Requests →
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20">
                Team Workspace
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] uppercase">
                {team.status || 'forming'}
              </span>
              {problem && (
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  • {problem.title} ({problem.category})
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-black">{team.name}</h1>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div className="text-[18px] font-black text-[#6C63FF]">{metrics.completionRate}%</div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Tasks Done</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center">
              <div className="text-[18px] font-black text-[var(--text-primary)]">
                {metrics.completedTasks}/{metrics.totalTasks}
              </div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Completed</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className="flex -space-x-2 overflow-hidden items-center pl-2 hover:opacity-80 transition cursor-pointer"
              title="Click to view full team members & roster"
            >
              <Avatar user={team.leader} size="sm" className="ring-2 ring-[var(--card)]" />
              {(team.members || []).map((m) => (
                <Avatar key={m._id} user={m} size="sm" className="ring-2 ring-[var(--card)]" />
              ))}
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2 text-[13px]">
          {[
            { id: 'tasks', label: 'Kanban Tasks', count: tasks.length },
            { id: 'milestones', label: 'Milestones', count: team.milestones?.length || 0 },
            { id: 'members', label: 'Team Members', count: (team.members?.length || 0) + (team.leader ? 1 : 0) },
            { id: 'submission', label: 'Project Submission', badge: submission?.status },
            { id: 'chat', label: 'Team Chat', count: chatMessages.length },
            { id: 'resources', label: 'Shared Links', count: team.resources?.length || 0 },
            { id: 'timeline', label: 'Activity Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'}`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[13px] text-emerald-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {/* TAB 1: KANBAN TASK BOARD */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[16px] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#6C63FF]" /> Kanban Sprint Board
            </h3>
            {canEdit && (
              <Button variant="gradient" onClick={() => setTaskModalOpen(true)} className="flex items-center gap-1.5 text-[12px]">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {['To Do', 'In Progress', 'Completed'].map((columnStatus) => {
              const colTasks = tasks.filter((t) => t.status === columnStatus);
              const colColors = {
                'To Do': 'border-t-zinc-400',
                'In Progress': 'border-t-blue-500',
                'Completed': 'border-t-emerald-500',
              };

              return (
                <div key={columnStatus} className={`p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] border-t-4 ${colColors[columnStatus]} space-y-3 min-h-[340px]`}>
                  <div className="flex items-center justify-between font-extrabold text-[13px]">
                    <span>{columnStatus}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2 hover:border-[#6C63FF]/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[13px] leading-snug">{task.title}</h4>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              task.priority === 'High'
                                ? 'bg-red-500/10 text-red-600'
                                : task.priority === 'Medium'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-zinc-500/10 text-zinc-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                          <span>{task.assigneeName || 'Unassigned'}</span>
                          <div className="flex items-center gap-1.5">
                            {columnStatus !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task._id, columnStatus === 'To Do' ? 'In Progress' : 'Completed')}
                                className="text-[10px] font-semibold text-[#6C63FF] hover:underline"
                              >
                                {columnStatus === 'To Do' ? 'Start →' : 'Done ✓'}
                              </button>
                            )}
                            {(isLeader || task.createdBy === user._id) && (
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="p-6 text-center text-[12px] text-[var(--text-secondary)] border border-dashed rounded-xl">
                        No tasks in {columnStatus}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[16px] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#6C63FF]" /> Project Milestones & Deliverables
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)]">Target deadlines and release checkpoints</p>
            </div>
            {isLeader && (
              <Button variant="gradient" onClick={() => setMilestoneModalOpen(true)} className="text-[12px] flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Milestone
              </Button>
            )}
          </div>

          <div className="divide-y divide-[var(--border)] mt-4">
            {(team.milestones || []).map((ms, idx) => (
              <div key={ms._id || idx} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => isLeader && handleToggleMilestone(ms._id, ms.status)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      ms.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-[var(--border)] hover:border-[#6C63FF]'
                    }`}
                  >
                    {ms.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <h4 className={`text-[14px] font-bold ${ms.status === 'completed' ? 'line-through text-[var(--text-secondary)]' : ''}`}>
                      {ms.title}
                    </h4>
                    {ms.deadline && (
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Due: {new Date(ms.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    ms.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {ms.status}
                </span>
              </div>
            ))}
            {(!team.milestones || team.milestones.length === 0) && (
              <div className="p-8 text-center text-[13px] text-[var(--text-secondary)]">
                No milestones added yet. Team leader can add deliverable targets.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB: TEAM MEMBERS & ROSTER */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Squad Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Members</div>
              <div className="text-[20px] font-black text-[var(--text-primary)] mt-1">
                {(team.members || []).length + (team.leader ? 1 : 0)} / {team.problem?.teamSize || team.maxSize || 5}
              </div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Skill Coverage</div>
              <div className="text-[20px] font-black text-[#6C63FF] mt-1">{team.coverage || 85}%</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Team Balance</div>
              <div className="text-[20px] font-black text-emerald-600 mt-1">{team.balanceScore || 8}/10</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Open Gaps</div>
              <div className="text-[14px] font-bold text-amber-600 mt-2 truncate">
                {team.missingSkills?.length ? team.missingSkills.join(', ') : 'None (Full Coverage)'}
              </div>
            </Card>
          </div>

          {/* Leader Card */}
          <Card className="p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C63FF] mb-3 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" /> Team Leader & Founder
            </div>
            {team.leader ? (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#6C63FF]/5 border border-[#6C63FF]/15">
                <div className="flex items-center gap-3">
                  <Avatar user={team.leader} size="lg" />
                  <div>
                    <div className="font-bold text-[16px] flex items-center gap-2">
                      {team.leader.name || 'Team Leader'}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#6C63FF] text-white uppercase">
                        Squad Lead
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--text-secondary)]">{team.leader.email}</div>
                    {team.leader.personality?.archetype && (
                      <div className="text-[11px] font-semibold text-purple-600 mt-0.5">
                        Working-Style: <strong>{team.leader.personality.archetype}</strong>
                      </div>
                    )}
                  </div>
                </div>
                {team.leader.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-sm">
                    {team.leader.skills.slice(0, 5).map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[11px] font-medium">
                        {s.name} {s.badge ? `(${s.badge})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[13px] text-[var(--text-secondary)]">Leader information not available.</div>
            )}
          </Card>

          {/* Members Grid */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[16px] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#6C63FF]" /> Teammates & Assigned Functional Roles ({(team.members || []).length})
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  {isLeader ? 'Assign functional responsibilities to members to divide project sprints.' : 'Roster of active engineers and designers in this workspace.'}
                </p>
              </div>
              {isLeader && (
                <Link to="/dashboard/matching" className="px-3 py-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52ef] text-white text-[12px] font-bold flex items-center gap-1.5 transition">
                  <UserPlus className="w-3.5 h-3.5" /> Find More Teammates
                </Link>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(team.members || []).map((m) => {
                const mid = String(m._id || m);
                const isLead = mid === String(team.leader?._id || team.leader);
                const roleEntry = Array.isArray(team.memberRoles)
                  ? team.memberRoles.find((mr) => String(mr.userId) === mid)?.teamRole
                  : (team.memberRoles && team.memberRoles[mid]);
                const assignedTasksCount = tasks.filter((tsk) => String(tsk.assignedTo) === mid).length;

                return (
                  <div key={mid} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={m} size="md" />
                        <div>
                          <div className="font-bold text-[14px] flex items-center gap-1.5">
                            {m.name || 'Member'}
                            {isLead && <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#6C63FF] text-white">Lead</span>}
                          </div>
                          <div className="text-[12px] text-[var(--text-secondary)]">{m.email || 'Participant'}</div>
                          {m.personality?.archetype && (
                            <span className="mt-1 inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                              {m.personality.archetype}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          {assignedTasksCount} task{assignedTasksCount === 1 ? '' : 's'} assigned
                        </span>
                      </div>
                    </div>

                    {/* Role Assignment */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Functional Role:</span>
                      {isLeader ? (
                        <select
                          value={roleEntry || (isLead ? 'Project Pitch / Lead' : 'Generalist')}
                          onChange={(e) => handleAssignRole(mid, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[11px] font-semibold text-[#6C63FF] outline-none"
                        >
                          {TEAM_ROLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6C63FF]/10 text-[#6C63FF]">
                          {roleEntry || 'Generalist'}
                        </span>
                      )}
                    </div>

                    {/* Skills Chips */}
                    {m.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.skills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-[10px] font-medium">
                            {s.name} {s.badge ? `(${s.badge})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {(!team.members || team.members.length === 0) && (
                <div className="col-span-2 p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl text-[13px] text-[var(--text-secondary)]">
                  No other members have joined yet. Use <strong>Find Members</strong> to invite candidates matching your required skills.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PROJECT SUBMISSION */}
      {activeTab === 'submission' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="font-extrabold text-[18px] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#6C63FF]" /> Final Project Submission Engine
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Deliver code repositories, live demo links, presentations, and files for organizer evaluation.
              </p>
            </div>
            {submission && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold text-[var(--text-secondary)]">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-extrabold uppercase ${
                    submission.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : submission.status === 'revisions_requested'
                      ? 'bg-red-500/20 text-red-400'
                      : submission.status === 'under_review'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {submission.status}
                </span>
              </div>
            )}
          </div>

          {/* Organizer Reviews & Scores Display */}
          {submission?.reviews?.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#6C63FF]/5 border border-[#6C63FF]/20 space-y-3">
              <h4 className="font-extrabold text-[14px] flex items-center gap-2 text-[#6C63FF]">
                <ShieldCheck className="w-5 h-5" /> Official Organizer Evaluation & Feedback
              </h4>
              {submission.reviews.map((rev) => (
                <div key={rev._id} className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px]">{rev.reviewerName || 'Organizer Review'}</span>
                    {rev.score !== null && (
                      <span className="text-[15px] font-black text-[#6C63FF]">{rev.score}/100</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{rev.feedback}</p>
                  {rev.revisionsRequired?.length > 0 && (
                    <div className="pt-1.5 text-[11px] text-red-600 font-semibold">
                      Required Revisions: {rev.revisionsRequired.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submission Form (Editable by leader, Read-only for members) */}
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Project Title">
                <input
                  disabled={!isLeader}
                  value={subForm.title}
                  onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                  placeholder="e.g. MedVision — AI Diagnostics Platform"
                  className={inputCls}
                />
              </Field>
              <Field label="GitHub Repository URL">
                <input
                  disabled={!isLeader}
                  value={subForm.githubUrl}
                  onChange={(e) => setSubForm({ ...subForm, githubUrl: e.target.value })}
                  placeholder="https://github.com/org/repo"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Live Demo / Deployment URL">
                <input
                  disabled={!isLeader}
                  value={subForm.demoUrl}
                  onChange={(e) => setSubForm({ ...subForm, demoUrl: e.target.value })}
                  placeholder="https://my-app.netlify.app"
                  className={inputCls}
                />
              </Field>
              <Field label="Presentation / Pitch Deck URL">
                <input
                  disabled={!isLeader}
                  value={subForm.presentationUrl}
                  onChange={(e) => setSubForm({ ...subForm, presentationUrl: e.target.value })}
                  placeholder="https://slides.google.com/..."
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Detailed Project Description & Architecture">
              <textarea
                disabled={!isLeader}
                rows={4}
                value={subForm.description}
                onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                placeholder="Explain the solution, technical stack, architecture, and problem solved..."
                className={inputCls}
              />
            </Field>

            {/* File Uploads Section (max 20MB per file) */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[var(--text-secondary)] mb-2">
                Supporting Documents & Presentations (PDF, DOCX, ZIP, PPTX $\le$ 20MB)
              </label>

              {isLeader && (
                <div className="flex items-center gap-3 mb-3">
                  <label className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--card)] text-[12px] font-bold cursor-pointer flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#6C63FF]" />
                    {uploadingFile ? 'Uploading...' : 'Upload File'}
                    <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploadingFile} />
                  </label>
                  <span className="text-[11px] text-[var(--text-secondary)]">Maximum 20MB per file</span>
                </div>
              )}

              {/* Uploaded File Attachments List */}
              <div className="space-y-2">
                {subForm.attachments?.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[12px]">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#6C63FF]" />
                      <span className="font-semibold">{file.name}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">({Math.round((file.size || 0) / 1024)} KB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={resolveFileUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#6C63FF] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </a>
                      {isLeader && (
                        <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!subForm.attachments || subForm.attachments.length === 0) && (
                  <div className="text-[12px] text-[var(--text-secondary)] italic">No attachments uploaded yet.</div>
                )}
              </div>
            </div>

            {/* Action Buttons (Leader only) */}
            {isLeader ? (
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmitProject('draft')}
                  disabled={submitting}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={() => handleSubmitProject('submitted')}
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Final Project'}
                </Button>
              </div>
            ) : (
              <div className="text-[12px] text-[var(--text-secondary)] italic">
                Only the designated team leader can submit or update official project entries.
              </div>
            )}
          </form>
        </Card>
      )}

      {/* TAB 4: TEAM CHAT / DISCUSSION */}
      {activeTab === 'chat' && (
        <Card className="p-5 flex flex-col h-[520px]">
          <div className="pb-3 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-extrabold text-[15px] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#6C63FF]" /> Team Discussion Channel
            </h3>
            <span className="text-[11px] text-[var(--text-secondary)]">Member-only encrypted channel</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {chatMessages.map((msg) => {
              const isMe = msg.sender === user._id;
              return (
                <div key={msg._id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar user={{ name: msg.senderName, avatar: msg.senderAvatar }} size="sm" />
                  <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold">{msg.senderName}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-[13px] leading-relaxed ${isMe ? 'bg-[#6C63FF] text-white rounded-tr-none' : 'bg-[var(--surface)] border border-[var(--border)] rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {chatMessages.length === 0 && (
              <div className="p-8 text-center text-[12px] text-[var(--text-secondary)]">
                No messages yet. Start the conversation with your team!
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 border-t border-[var(--border)] flex gap-2">
            <input
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              placeholder="Type message to team..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] outline-none focus:border-[#6C63FF]"
            />
            <Button type="submit" variant="gradient" disabled={sendingMsg || !newMsgText.trim()} className="px-5">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 5: SHARED RESOURCES */}
      {activeTab === 'resources' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[16px] flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#6C63FF]" /> Shared Documents & Workspaces
            </h3>
            {canEdit && (
              <Button variant="gradient" onClick={() => setResourceModalOpen(true)} className="text-[12px] flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Link
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {(team.resources || []).map((res) => (
              <a
                key={res._id}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[#6C63FF]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] uppercase font-bold">
                    <span>{res.type}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-[14px] mt-1 line-clamp-1">{res.title}</h4>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{res.url}</div>
                </div>
              </a>
            ))}
            {(!team.resources || team.resources.length === 0) && (
              <div className="col-span-full p-8 text-center text-[13px] text-[var(--text-secondary)]">
                No shared links or resources yet. Add Figma, Docs, or GitHub links above.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-extrabold text-[16px] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6C63FF]" /> Team Activity Timeline
          </h3>

          <div className="divide-y divide-[var(--border)] mt-4">
            {(team.activityTimeline || []).map((act) => (
              <div key={act._id} className="py-3.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#6C63FF] mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-[var(--text-primary)]">
                    {act.details || act.action}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    By {act.actorName || 'Member'} • {new Date(act.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {(!team.activityTimeline || team.activityTimeline.length === 0) && (
              <div className="p-8 text-center text-[12px] text-[var(--text-secondary)]">
                No activities recorded yet.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MODAL: ADD TASK */}
      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Create New Task" subtitle={`Team: ${team.name}`}>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Field label="Task Title">
            <input
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Implement authentication middleware"
              className={inputCls}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Details or acceptance criteria..."
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className={inputCls}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
            <Field label="Assignee">
              <select
                value={taskForm.assignee}
                onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                <option value={team.leader?._id}>{team.leader?.name} (Leader)</option>
                {(team.members || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Due Date">
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={taskBusy}>
              {taskBusy ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD MILESTONE */}
      <Modal open={milestoneModalOpen} onClose={() => setMilestoneModalOpen(false)} title="Add Milestone">
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <Field label="Milestone Title">
            <input
              required
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              placeholder="e.g. Frontend UI Completed"
              className={inputCls}
            />
          </Field>
          <Field label="Target Deadline">
            <input
              type="date"
              value={milestoneForm.deadline}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, deadline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Save Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD RESOURCE */}
      <Modal open={resourceModalOpen} onClose={() => setResourceModalOpen(false)} title="Share Project Resource">
        <form onSubmit={handleAddResource} className="space-y-4">
          <Field label="Resource Title">
            <input
              required
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              placeholder="e.g. Figma Design System"
              className={inputCls}
            />
          </Field>
          <Field label="Resource URL">
            <input
              required
              type="url"
              value={resourceForm.url}
              onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <select
              value={resourceForm.type}
              onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
              className={inputCls}
            >
              <option value="doc">Document</option>
              <option value="figma">Figma Design</option>
              <option value="github">GitHub</option>
              <option value="drive">Google Drive</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient">
              Save Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
