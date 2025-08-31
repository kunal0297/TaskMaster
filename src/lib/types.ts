export type TaskStatus = "pending" | "completed";
export type TaskEffort = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  estimatedEffort?: TaskEffort;
  prioritizationReason?: string;
}
