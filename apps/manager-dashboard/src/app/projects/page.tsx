'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderKanban, Search, Plus, X, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'progress' | 'proposed' | 'completed';
  progress: number;
  health: 'on_track' | 'at_risk' | 'review';
  tasksDone: number;
  tasksTotal: number;
  members?: unknown[];
}

interface DBProject {
  id: string;
  name: string;
  category?: string;
  objective: string;
  status: string;
  healthStatus?: string;
  healthScore?: number;
  members?: unknown[];
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'proposed' | 'completed'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newDomain, setNewDomain] = useState('Frontend');
  const [newTechStack, setNewTechStack] = useState('');
  const [modalTasks, setModalTasks] = useState<
    Array<{ title: string; description: string; estimatedHours?: number }>
  >([]);
  const [modalTaskTitle, setModalTaskTitle] = useState('');
  const [modalTaskDesc, setModalTaskDesc] = useState('');
  const [modalTaskHours, setModalTaskHours] = useState('');

  const router = useRouter();

  const handleAddModalTask = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!modalTaskTitle || !modalTaskDesc) return;
    setModalTasks((prev) => [
      ...prev,
      {
        title: modalTaskTitle,
        description: modalTaskDesc,
        estimatedHours: modalTaskHours ? Number(modalTaskHours) : undefined,
      },
    ]);
    setModalTaskTitle('');
    setModalTaskDesc('');
    setModalTaskHours('');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        const errorText = await res.text();
        alert(`Failed to delete project. Status: ${res.status}. Details: ${errorText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Network error during project deletion: ${errorMsg}`);
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/v1/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          // Map the backend DB projects to frontend visual model
          const mapped: Project[] = data.map((p: DBProject) => {
            let status: 'progress' | 'proposed' | 'completed' = 'proposed';
            if (p.status === 'ACTIVE') status = 'progress';
            else if (p.status === 'COMPLETED') status = 'completed';

            let health: 'on_track' | 'at_risk' | 'review' = 'review';
            if (p.healthStatus === 'LOW') health = 'on_track';
            else if (p.healthStatus === 'HIGH') health = 'at_risk';

            return {
              id: p.id,
              name: p.name,
              category: p.category || 'General',
              description: p.objective,
              status,
              progress: p.status === 'ACTIVE' ? 10 : p.status === 'COMPLETED' ? 100 : 0,
              health,
              tasksDone: 0,
              tasksTotal: 0,
              members: p.members || [],
            };
          });
          setProjects(mapped);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          objective: newObjective,
          targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          domain: newDomain,
          techStack: newTechStack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          tasks: modalTasks,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNewName('');
        setNewObjective('');
        setNewDomain('Frontend');
        setNewTechStack('');
        setModalTasks([]);
        // Reload projects
        const fetchProjects = async () => {
          const token = localStorage.getItem('axiom_token');
          if (!token) return;
          const res = await fetch('/api/v1/projects', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: Project[] = data.map((p: DBProject) => {
              let status: 'progress' | 'proposed' | 'completed' = 'proposed';
              if (p.status === 'ACTIVE') status = 'progress';
              else if (p.status === 'COMPLETED') status = 'completed';

              let health: 'on_track' | 'at_risk' | 'review' = 'review';
              if (p.healthStatus === 'LOW') health = 'on_track';
              else if (p.healthStatus === 'HIGH') health = 'at_risk';

              return {
                id: p.id,
                name: p.name,
                category: p.category || 'General',
                description: p.objective,
                status,
                progress: p.status === 'ACTIVE' ? 10 : p.status === 'COMPLETED' ? 100 : 0,
                health,
                tasksDone: 0,
                tasksTotal: 0,
              };
            });
            setProjects(mapped);
          }
        };
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : project.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'on_track':
        return (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            🟢 On Track
          </span>
        );
      case 'at_risk':
        return (
          <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
            🔴 At Risk
          </span>
        );
      case 'review':
      default:
        return (
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            ⚠️ Needs Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Projects Workspace</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Monitor the execution states and goals generated by the planner.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Goal</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900">
        {/* Status Tabs */}
        <div className="flex bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800/80 gap-1 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: 'all', label: 'All Campaigns' },
              { id: 'progress', label: 'In Progress' },
              { id: 'proposed', label: 'Awaiting Review' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3.5 py-2 rounded-xl w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-zinc-400 py-8">Loading campaigns...</div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col h-full hover:border-zinc-700/80 transition-all duration-300"
            >
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">
                      {project.category}
                    </span>
                    <h3 className="font-bold text-lg text-zinc-200 mt-2 hover:text-purple-400 transition-colors">
                      <Link href={`/projects/${project.id}`}>{project.name}</Link>
                    </h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <Badge variant={project.status}>
                      {project.status === 'progress' && 'Active'}
                      {project.status === 'proposed' && 'Proposed'}
                      {project.status === 'completed' && 'Completed'}
                    </Badge>
                    {project.members && project.members.length > 0 ? (
                      <Badge variant="completed">Assigned</Badge>
                    ) : (
                      <Badge variant="proposed">Unassigned</Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed truncate-2-lines min-h-[40px]">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Task Execution</span>
                    <span className="text-zinc-200">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                {getHealthBadge(project.health)}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-850">
                    <span>
                      {project.tasksDone}/{project.tasksTotal} Tasks
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteProject(project.id);
                    }}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-950 border border-red-900/50 hover:border-red-500 text-red-400 transition-all cursor-pointer border-0 flex items-center justify-center"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center text-center py-16">
          <FolderKanban className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-zinc-300 font-semibold text-sm">No campaigns found</h3>
          <p className="text-zinc-500 text-xs mt-1">
            Try modifying your keyword search or filters.
          </p>
        </Card>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-4 border-gray-900 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-800">
              <h2 className="text-lg font-black text-white">Create New Project Goal</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Project Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Project Details
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Q4 Website Redesign"
                      className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase">
                      Objective / Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Describe the ultimate business objective or goal..."
                      className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase">Domain</label>
                    <select
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Fullstack">Fullstack</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="DevOps">DevOps</option>
                      <option value="QA">QA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-300 uppercase">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="e.g. Next.js, TailwindCSS"
                      className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Column 2: Tasks Builder */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 border-zinc-800">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Project Tasks
                  </h3>

                  {/* Local task list */}
                  {modalTasks.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto bg-zinc-950 p-2 border border-zinc-850 rounded">
                      {modalTasks.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start text-xs border-b border-zinc-900 pb-1.5 last:border-0 last:pb-0"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-zinc-200 block truncate">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {t.description}
                            </span>
                          </div>
                          <Badge variant="completed">{t.estimatedHours || 0}h</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500 font-medium bg-zinc-950 p-3 text-center border border-zinc-850 rounded">
                      No tasks added yet. Add tasks below.
                    </p>
                  )}

                  {/* Task Builder Inputs */}
                  <div className="bg-zinc-950/40 p-3 border border-zinc-850 rounded space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={modalTaskTitle}
                        onChange={(e) => setModalTaskTitle(e.target.value)}
                        placeholder="e.g. Setup database schemas"
                        className="w-full bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={modalTaskDesc}
                        onChange={(e) => setModalTaskDesc(e.target.value)}
                        placeholder="Task context details..."
                        className="w-full bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">
                        Estimated Hours
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={modalTaskHours}
                          onChange={(e) => setModalTaskHours(e.target.value)}
                          placeholder="e.g. 8"
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-white outline-none focus:border-purple-500"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddModalTask}
                          className="h-8 text-xs cursor-pointer"
                        >
                          + Add Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Generate Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
