export interface IProject {
  id: string;
  organization_id: string;
  manager_id?: string | null;
  name: string;
  objective: string;
  status: string;
  target_deadline: Date;
  created_at: Date;
  deleted_at?: Date | null;
}

export interface IProjectCreateDto {
  name: string;
  objective: string;
  target_deadline: string; // ISO Date String
}

export interface IProjectUpdateDto {
  name?: string;
  objective?: string;
  target_deadline?: string;
  status?: string;
}

export interface IMilestone {
  id: string;
  project_id: string;
  name: string;
  created_at: Date;
  deleted_at?: Date | null;
}

export interface IMilestoneCreateDto {
  name: string;
}

export interface ITask {
  id: string;
  organization_id: string;
  project_id: string;
  milestone_id?: string | null;
  title: string;
  description: string;
  status: string; // PROPOSED, PENDING, IN_PROGRESS, BLOCKED, COMPLETED
  estimated_hours: number;
  created_by_ai: boolean;
  created_at: Date;
  deleted_at?: Date | null;
}

export interface ITaskCreateDto {
  project_id: string;
  milestone_id?: string;
  title: string;
  description: string;
  estimated_hours: number;
  created_by_ai?: boolean;
}

export interface ITaskUpdateDto {
  title?: string;
  description?: string;
  status?: string;
  estimated_hours?: number;
  milestone_id?: string | null;
}

export interface IAssignment {
  id: string;
  task_id: string;
  user_id: string;
  created_at: Date;
}
