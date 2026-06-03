export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: string[];
  assignees: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
};

export type TaskIndex = {
  version: 1;
  updatedAt: string;
  tasks: Task[];
};

export const emptyTaskIndex = (): TaskIndex => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  tasks: []
});

export const newTask = (): Task => {
  const now = new Date();
  const stamp = now.toISOString();
  const date = stamp.slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 10);

  return {
    id: `task_${date}_${suffix}`,
    title: "Untitled task",
    status: "todo",
    priority: "medium",
    dueDate: "",
    tags: [],
    assignees: [],
    notes: "",
    createdAt: stamp,
    updatedAt: stamp
  };
};

const yamlList = (items: string[]) => {
  if (items.length === 0) {
    return "[]";
  }

  return `\n${items.map((item) => `  - ${item}`).join("\n")}`;
};

export const taskToMarkdown = (task: Task) => {
  return `---\nid: ${task.id}\ntitle: ${task.title}\nstatus: ${task.status}\npriority: ${task.priority}\ndueDate: ${task.dueDate}\ntags:${yamlList(task.tags)}\nassignees:${yamlList(task.assignees)}\ncreatedAt: ${task.createdAt}\nupdatedAt: ${task.updatedAt}\nupdatedBy: ${task.updatedBy ?? ""}\n---\n\n${task.notes.trim()}\n`;
};

export const markdownPathForTask = (basePath: string, taskId: string) => {
  const cleanBase = basePath.replace(/^\/+|\/+$/g, "");
  return `${cleanBase}/${taskId}.md`;
};

export const indexPath = (basePath: string) => {
  const cleanBase = basePath.replace(/^\/+|\/+$/g, "");
  return `${cleanBase}/index.json`;
};
