"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Activity,
  Play
} from "lucide-react";
import { Button, Card, Badge } from "@useaxiom/ui";

interface Task {
  id: string;
  name: string;
  assignee: string;
  status: "completed" | "progress" | "blocked" | "pending" | "proposed";
  blockerDescription?: string;
  duration: string;
}

interface Milestone {
  id: string;
  title: string;
  status: "completed" | "progress" | "pending";
  tasks: Task[];
}

interface ProjectDetails {
  id: string;
  name: string;
  category: string;
  health: "on_track" | "at_risk" | "review";
  progress: number;
  description: string;
  milestones: Milestone[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, mRes, tRes] = await Promise.all([
        fetch(`http://localhost:3000/api/v1/projects/${id}`, { headers }),
        fetch(`http://localhost:3000/api/v1/projects/${id}/milestones`, { headers }),
        fetch(`http://localhost:3000/api/v1/projects/${id}/tasks`, { headers })
      ]);

      if (pRes.status === 401 || mRes.status === 401 || tRes.status === 401) {
        localStorage.removeItem('axiom_token');
        router.push('/login');
        return;
      }

      setProject(await pRes.json());
      setMilestones(await mRes.json());
      setTasks(await tRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router]);

  const handleResolveBlocker = (taskId: string) => {
    // Implement API call if needed
    fetchData();
  };

  const handleApprovePlan = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`http://localhost:3000/api/v1/projects/${id}/approve`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-zinc-400 p-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-rose-400 p-8">Project not found</div>;
  }

  const getTaskStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="completed">Done</Badge>;
      case "progress":
        return <Badge variant="progress">In Progress</Badge>;
      case "blocked":
        return <Badge variant="blocked">Blocked</Badge>;
      case "pending":
        return <Badge variant="pending">Awaiting Start</Badge>;
      case "proposed":
      default:
        return <Badge variant="proposed">Proposed</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumb back navigation */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Campaign Details Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-zinc-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2.5 py-0.5 rounded border border-purple-500/10">
              {project.status || 'PROJECT'}
            </span>
            <Badge variant={project.status === "ACTIVE" ? "progress" : project.status === "COMPLETED" ? "completed" : "proposed"}>
              {project.status === "ACTIVE" ? "In Progress" : project.status === "COMPLETED" ? "Done" : "Awaiting Review"}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">{project.name}</h1>
          <p className="text-zinc-400 text-sm max-w-2xl">{project.objective}</p>
        </div>

        {/* Progress Bar Widget */}
        <div className="w-full lg:w-72 bg-zinc-900 p-4 rounded-2xl border border-zinc-850 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-zinc-500 uppercase tracking-wider">Campaign Progress</span>
            <span className="text-zinc-200">{project.status === 'ACTIVE' ? 10 : 0}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${project.status === 'ACTIVE' ? 10 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center gap-4 bg-zinc-900/15 p-4 rounded-xl border border-zinc-900">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-300">Campaign Execution Log</span>
        </div>
        <div className="flex gap-2">
          {tasks.some(t => t.status === "PROPOSED") && (
            <Button variant="primary" size="sm" onClick={handleApprovePlan} className="rounded-xl">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
              <span>Approve Proposed Plan</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl">
            <Plus className="w-3.5 h-3.5" />
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
                <ChevronRight className="w-4 h-4 text-zinc-500" />
                <h3 className="font-bold text-zinc-200 text-sm">All Tasks</h3>
              </div>
            </div>

            {/* Task list inside card */}
            <Card className="divide-y divide-zinc-800/60 p-0 overflow-hidden">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-900/15 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200">{task.title}</span>
                      {getTaskStatusBadge(task.status.toLowerCase())}
                    </div>
                    {task.description && (
                      <span className="text-xs text-zinc-400 font-medium block max-w-xl">
                        {task.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Task Metadata */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="font-semibold bg-zinc-950 px-2.5 py-1 rounded border border-zinc-850">
                        {task.estimatedHours || 1} hrs
                      </span>
                    </div>

                    {/* Interactive Resolves */}
                    {task.status === "BLOCKED" && (
                      <Button variant="danger" size="sm" onClick={() => handleResolveBlocker(task.id)} className="h-8 text-[11px] rounded-lg">
                        Resolve Blocker
                      </Button>
                    )}
                    <button className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <div className="text-zinc-500 text-sm py-4">No tasks found for this project yet.</div>
        )}
      </div>
    </div>
  );
}
