'use client';

import { useState, useEffect } from 'react';
import { UserCheck, MessageSquare, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';
import { useRouter } from 'next/navigation';

interface DBUser {
  id: string;
  name: string;
  role: string;
  employeeId?: string;
  specialty?: string;
  phoneNumber: string;
  projectMembers?: Array<{
    project: {
      id: string;
      name: string;
      objective: string;
      domain: string;
      techStack: string[];
      targetDeadline?: string;
      tasks?: Array<{
        id: string;
        title: string;
        status: string;
      }>;
    };
  }>;
}

interface DBProject {
  id: string;
  name: string;
  status: string;
  members?: unknown[];
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<DBUser[]>([]);
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningMap, setAssigningMap] = useState<Record<string, string>>({});
  const router = useRouter();

  const fetchWorkloads = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [uRes, pRes] = await Promise.all([
        fetch('/api/v1/users', { headers }),
        fetch('/api/v1/projects', { headers }),
      ]);
      if (uRes.ok) {
        const usersData = await uRes.json();
        setEmployees(usersData.filter((u: DBUser) => u.role === 'EMPLOYEE'));
      }
      if (pRes.ok) {
        setProjects(await pRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchWorkloads();
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleAssignProject = async (userId: string) => {
    const projectId = assigningMap[userId];
    if (!projectId) return;

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert('Project assigned and WhatsApp alert sent successfully!');
        setAssigningMap((prev) => ({ ...prev, [userId]: '' }));
        // Reload employee details from database to show real time updates on page
        fetchWorkloads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassignProject = async (userId: string, projectId: string) => {
    if (!confirm('Are you sure you want to unassign this project?')) return;

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}/assign/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchWorkloads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const calculateStats = (member: DBUser) => {
    const pms = member.projectMembers || [];
    const pCount = pms.length;

    // Load allocation mapping
    let load = 0;
    if (pCount === 1) load = 60;
    else if (pCount === 2) load = 80;
    else if (pCount >= 3) load = 95;

    // Sum task counts across assigned projects
    let active = 0;
    let queued = 0;
    let blocked = 0;

    pms.forEach((pm) => {
      const tasks = pm.project.tasks || [];
      tasks.forEach((t) => {
        if (t.status === 'ACTIVE') active++;
        else if (t.status === 'BLOCKED') blocked++;
        else queued++;
      });
    });

    return { load, active, queued, blocked };
  };

  const getLoadColor = (load: number) => {
    if (load >= 85) return 'bg-rose-500';
    if (load >= 60) return 'bg-purple-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Team Workloads</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Review resource allocation, active tasks, and employee status details.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-400 py-8">Loading team workloads...</div>
      ) : employees.length > 0 ? (
        /* Team grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {employees.map((member) => {
            const stats = calculateStats(member);
            const assignedProjects = member.projectMembers || [];

            return (
              <Card
                key={member.id}
                className="flex flex-col justify-between hover:border-zinc-700/80 transition-all duration-300"
              >
                <div className="space-y-6">
                  {/* Member profile header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-sm">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-200 text-base">{member.name}</h3>
                        <span className="block text-xs text-purple-400 font-semibold">
                          Specialty: {member.specialty || 'General'}
                        </span>
                        <span className="block text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                          ID: {member.employeeId || 'None'} • Phone: {member.phoneNumber}
                        </span>
                      </div>
                    </div>
                    <Badge variant={assignedProjects.length > 0 ? 'completed' : 'proposed'}>
                      {assignedProjects.length > 0 ? 'Active' : 'Waiting'}
                    </Badge>
                  </div>

                  {/* Project Assignment Control */}
                  <div className="space-y-2 p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Assign to Project
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={assigningMap[member.id] || ''}
                        onChange={(e) =>
                          setAssigningMap((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-purple-500"
                      >
                        <option value="">Select project...</option>
                        {projects
                          .filter((p) => !p.members || p.members.length === 0)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAssignProject(member.id)}
                        disabled={!assigningMap[member.id]}
                        className="h-8 text-xs cursor-pointer shadow-md"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>

                  {/* Workload Stats */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
                      <span>Current Allocation Load</span>
                      <span
                        className={
                          stats.load >= 85
                            ? 'text-rose-400'
                            : stats.load >= 60
                              ? 'text-purple-400'
                              : 'text-emerald-400'
                        }
                      >
                        {stats.load}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getLoadColor(stats.load)}`}
                        style={{ width: `${stats.load}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                        <span className="block text-zinc-500 text-[9px] font-bold uppercase">
                          Active Tasks
                        </span>
                        <span className="text-zinc-200 text-xs font-bold">{stats.active}</span>
                      </div>
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                        <span className="block text-zinc-500 text-[9px] font-bold uppercase">
                          Queued Tasks
                        </span>
                        <span className="text-zinc-200 text-xs font-bold">{stats.queued}</span>
                      </div>
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                        <span className="block text-zinc-500 text-[9px] font-bold uppercase">
                          Blocked Tasks
                        </span>
                        <span
                          className={`text-xs font-bold ${stats.blocked > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`}
                        >
                          {stats.blocked}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real Active Project details */}
                  <div className="space-y-3">
                    {assignedProjects.length > 0 ? (
                      assignedProjects.map((pm) => (
                        <div
                          key={pm.project.id}
                          className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 space-y-2 relative group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                              Assigned Project
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="progress">{pm.project.domain || 'General'}</Badge>
                              <button
                                onClick={() => handleUnassignProject(member.id, pm.project.id)}
                                className="p-1 rounded bg-red-950/40 hover:bg-red-950 border border-red-900/50 hover:border-red-500 text-red-400 cursor-pointer border-0 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                title="Unassign Project"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-200">{pm.project.name}</h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed min-h-[30px]">
                            {pm.project.objective}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(pm.project.techStack || []).map((tech) => (
                              <span
                                key={tech}
                                className="text-[9px] font-semibold bg-zinc-900 border border-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          {pm.project.targetDeadline && (
                            <span className="block text-[9px] text-zinc-500 font-bold uppercase mt-1">
                              Deadline: {new Date(pm.project.targetDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-zinc-950/40 p-4 border border-dashed border-zinc-850 rounded-xl text-center">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                          No Assigned Work
                        </span>
                        <p className="text-xs text-zinc-600 mt-1 font-medium">
                          Waiting to be assigned to a project
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs gap-1.5 h-9"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text Agent</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 rounded-xl text-xs gap-1.5 h-9 border border-zinc-700/60 hover:bg-zinc-800"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Reallocate task</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-zinc-400 py-8">No employees found.</div>
      )}
    </div>
  );
}
