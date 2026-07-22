'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  ChevronRight,
  Activity,
  Play,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      title: string;
      status: string;
      description?: string;
      estimatedHours?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState<
    Array<{
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        employeeId: string;
        role: string;
      };
    }>
  >([]);
  const [allUsers, setAllUsers] = useState<
    Array<{
      id: string;
      name: string;
      employeeId: string;
      role: string;
    }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskHours, setTaskHours] = useState('');

  const router = useRouter();

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const mRes = await fetch(`/api/v1/projects/${id}/members`, { headers });
      if (mRes.ok) {
        setAssignedMembers(await mRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [pRes, tRes, uRes, mRes] = await Promise.all([
          fetch(`/api/v1/projects/${id}`, { headers }),
          fetch(`/api/v1/projects/${id}/tasks`, { headers }),
          fetch(`/api/v1/users`, { headers }),
          fetch(`/api/v1/projects/${id}/members`, { headers }),
        ]);

        if (pRes.status === 401 || tRes.status === 401 || uRes.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }

        setProject(await pRes.json());
        setTasks(await tRes.json());
        if (uRes.ok) {
          setAllUsers(await uRes.json());
        }
        if (mRes.ok) {
          setAssignedMembers(await mRes.json());
        }
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (res.ok) {
        setSelectedUserId('');
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          estimatedHours: taskHours ? Number(taskHours) : undefined,
        }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskHours('');
        // Reload tasks list
        const headers = { Authorization: `Bearer ${token}` };
        const tRes = await fetch(`/api/v1/projects/${id}/tasks`, { headers });
        if (tRes.ok) {
          setTasks(await tRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveBlocker = () => {
    // Implement API call if needed
    // Reload manually or update state
  };

  const handleApprovePlan = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optionally trigger reload here
    } catch (e: unknown) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-red-500 p-8">Project not found</div>;
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="completed">Done</Badge>;
      case 'progress':
        return <Badge variant="progress">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="blocked">Blocked</Badge>;
      case 'pending':
        return <Badge variant="pending">Awaiting Start</Badge>;
      case 'proposed':
      default:
        return <Badge variant="proposed">Proposed</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumb back navigation */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-bold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Campaign Details Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b-2 border-gray-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-sm">
              {(project.status as string) || 'PROJECT'}
            </span>
            <Badge
              variant={
                project.status === 'ACTIVE'
                  ? 'progress'
                  : project.status === 'COMPLETED'
                    ? 'completed'
                    : 'proposed'
              }
            >
              {project.status === 'ACTIVE'
                ? 'In Progress'
                : project.status === 'COMPLETED'
                  ? 'Done'
                  : 'Awaiting Review'}
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {project.name as string}
          </h1>
          <p className="text-gray-500 text-base max-w-2xl font-medium">
            {project.objective as string}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {typeof project.domain === 'string' && (
              <Badge variant="progress">Domain: {project.domain}</Badge>
            )}
            {Array.isArray(project.techStack) &&
              (project.techStack as string[]).map((tech: string) => (
                <Badge key={tech} variant="proposed">
                  {tech}
                </Badge>
              ))}
          </div>
        </div>

        {/* Progress Bar Widget */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {project.healthScore !== undefined && project.healthScore !== null && (
            <div
              className={`w-full lg:w-72 bg-white p-5 border-4 ${project.healthStatus === 'HIGH' ? 'border-red-600' : project.healthStatus === 'MEDIUM' ? 'border-amber-500' : 'border-emerald-500'} space-y-3`}
            >
              <div className="flex justify-between items-center text-sm font-bold">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${project.healthStatus === 'HIGH' ? 'text-red-600' : project.healthStatus === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}`}
                  />
                  <span className="text-gray-900 uppercase tracking-wider">AI Risk</span>
                </div>
                <span
                  className={
                    project.healthStatus === 'HIGH'
                      ? 'text-red-600'
                      : project.healthStatus === 'MEDIUM'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                  }
                >
                  {project.healthScore as number}/100
                </span>
              </div>
              <p className="text-xs font-medium text-gray-600 line-clamp-2">
                {project.healthReasoning as string}
              </p>
            </div>
          )}
          <div className="w-full lg:w-72 bg-white p-5 border-4 border-gray-900 space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-gray-900 uppercase tracking-wider">Campaign Progress</span>
              <span className="text-blue-600">{project.status === 'ACTIVE' ? 10 : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${project.status === 'ACTIVE' ? 10 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center gap-4 bg-gray-50 p-4 rounded-md border-2 border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-gray-900 tracking-wide">
            Campaign Execution Log
          </span>
        </div>
        <div className="flex gap-2">
          {tasks.some((t) => t.status === 'PROPOSED') && (
            <Button variant="primary" size="sm" onClick={handleApprovePlan}>
              <Play className="w-4 h-4" />
              <span>Approve Proposed Plan</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskModal(true)}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Tasks Flow */}
      <div className="space-y-6">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-900 text-lg tracking-tight">All Tasks</h3>
              </div>
            </div>

            {/* Task list inside card */}
            <Card className="divide-y-2 divide-gray-100 p-0 overflow-hidden">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-900">{task.title}</span>
                      {getTaskStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <span className="text-sm text-gray-500 font-medium block max-w-xl">
                        {task.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Task Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-bold bg-gray-100 px-3 py-1.5 rounded-sm">
                        {task.estimatedHours || 1} hrs
                      </span>
                    </div>

                    {/* Interactive Resolves */}
                    {task.status === 'BLOCKED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleResolveBlocker()}
                        className="h-9"
                      >
                        Resolve Blocker
                      </Button>
                    )}
                    <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer border-0">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <div className="text-gray-500 font-medium py-4">No tasks found for this project yet.</div>
        )}
      </div>

      {/* Team Assignment Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">Project Team Members</h3>
        </div>
        <Card className="p-6 space-y-4">
          <form
            onSubmit={handleAssignMember}
            className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-255"
          >
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase">
                Assign Team Member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select an employee...</option>
                {allUsers
                  .filter((u) => !assignedMembers.some((am) => am.user.id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.employeeId || 'No ID'})
                    </option>
                  ))}
              </select>
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedUserId}
              className="h-10 cursor-pointer"
            >
              Assign to Project
            </Button>
          </form>

          {assignedMembers.length > 0 ? (
            <div className="divide-y divide-gray-150">
              {assignedMembers.map((member) => (
                <div key={member.id} className="py-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{member.user.name}</h4>
                    <span className="text-xs text-gray-500 font-semibold">
                      Role: {member.user.role}
                    </span>
                  </div>
                  <Badge variant="completed">ID: {member.user.employeeId || 'None'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium">
              No team members assigned to this project yet.
            </p>
          )}
        </Card>
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-4 border-gray-900 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-800">
              <h2 className="text-lg font-black text-white">Create New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement user login API"
                  className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Description</label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Detail the technical implementation steps..."
                  className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Estimated Hours</label>
                <input
                  type="number"
                  value={taskHours}
                  onChange={(e) => setTaskHours(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
