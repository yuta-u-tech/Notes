"use client";

import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Columns3,
  GitBranch,
  LayoutGrid,
  ListFilter,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Task, TaskPriority, TaskStatus, emptyTaskIndex, newTask } from "@/lib/tasks";

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done"
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle size={15} />,
  doing: <Clock3 size={15} />,
  done: <Check size={15} />
};

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-700"
};

type ViewMode = "table" | "board";

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const joinCsv = (items: string[]) => items.join(", ");

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [view, setView] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [syncState, setSyncState] = useState<"idle" | "loading" | "saving" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("Not synced");

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? tasks[0];

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesQuery =
        !normalized ||
        [task.title, task.notes, task.status, task.priority, ...task.tags, ...task.assignees]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, tasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      doing: tasks.filter((task) => task.status === "doing").length,
      done: tasks.filter((task) => task.status === "done").length
    }),
    [tasks]
  );

  const load = async () => {
    setSyncState("loading");
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const data = response.ok ? await response.json() : emptyTaskIndex();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load tasks");
      }

      setTasks(data.tasks);
      setSelectedId(data.tasks[0]?.id ?? "");
      setSyncMessage(`Loaded ${data.tasks.length} tasks`);
      setSyncState("idle");
    } catch (error) {
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Failed to load tasks");
    }
  };

  const save = async () => {
    setSyncState("saving");
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, actor: "web-app" })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save tasks");
      }

      setTasks(data.tasks);
      setSyncMessage(`Saved ${data.tasks.length} tasks`);
      setSyncState("idle");
    } catch (error) {
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Failed to save tasks");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateTask = (id: string, patch: Partial<Task>) => {
    const now = new Date().toISOString();
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch, updatedAt: now, updatedBy: "web-app" } : task))
    );
  };

  const createTask = () => {
    const task = newTask();
    setTasks((current) => [task, ...current]);
    setSelectedId(task.id);
  };

  const deleteTask = (id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (selectedId === id) {
      setSelectedId("");
    }
  };

  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="grid min-h-screen grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-r border-line bg-panel px-3 py-4">
          <div className="mb-5 flex items-center gap-2 px-2">
            <div className="grid size-8 place-items-center rounded-md bg-ink text-white">
              <GitBranch size={17} />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-5">GitHub Tasks</h1>
              <p className="text-xs text-muted">Private workspace</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { value: "all", label: "All tasks", count: counts.all },
              { value: "todo", label: "Todo", count: counts.todo },
              { value: "doing", label: "Doing", count: counts.doing },
              { value: "done", label: "Done", count: counts.done }
            ].map((item) => (
              <button
                key={item.value}
                className={`flex h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm ${
                  statusFilter === item.value ? "bg-white shadow-sm" : "text-slate-700 hover:bg-white/70"
                }`}
                onClick={() => setStatusFilter(item.value as TaskStatus | "all")}
                type="button"
              >
                <span className="flex items-center gap-2">
                  {item.value === "all" ? <ListFilter size={15} /> : statusIcons[item.value as TaskStatus]}
                  {item.label}
                </span>
                <span className="text-xs text-muted">{item.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-line px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative w-[320px] max-w-[42vw]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-accent"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search tasks"
                  value={query}
                />
              </div>
              <div className="flex rounded-md border border-line p-0.5">
                <button
                  aria-label="Table view"
                  className={`grid size-8 place-items-center rounded ${view === "table" ? "bg-slate-100" : ""}`}
                  onClick={() => setView("table")}
                  title="Table view"
                  type="button"
                >
                  <Columns3 size={16} />
                </button>
                <button
                  aria-label="Board view"
                  className={`grid size-8 place-items-center rounded ${view === "board" ? "bg-slate-100" : ""}`}
                  onClick={() => setView("board")}
                  title="Board view"
                  type="button"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`max-w-[220px] truncate text-xs ${syncState === "error" ? "text-rose-600" : "text-muted"}`}>
                {syncMessage}
              </span>
              <button className="grid size-9 place-items-center rounded-md border border-line" onClick={load} title="Sync" type="button">
                {syncState === "loading" ? <Loader2 className="animate-spin" size={16} /> : <GitBranch size={16} />}
              </button>
              <button className="grid size-9 place-items-center rounded-md border border-line" onClick={save} title="Save" type="button">
                {syncState === "saving" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
              <button className="grid size-9 place-items-center rounded-md bg-ink text-white" onClick={createTask} title="New task" type="button">
                <Plus size={17} />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 overflow-auto">
              {view === "table" ? (
                <TaskTable
                  onDelete={deleteTask}
                  onSelect={setSelectedId}
                  onUpdate={updateTask}
                  selectedId={selectedTask?.id}
                  tasks={filteredTasks}
                />
              ) : (
                <TaskBoard onSelect={setSelectedId} onUpdate={updateTask} selectedId={selectedTask?.id} tasks={filteredTasks} />
              )}
            </div>

            <TaskDetail onDelete={deleteTask} onUpdate={updateTask} task={selectedTask} />
          </div>
        </section>
      </div>
    </main>
  );
}

function TaskTable({
  tasks,
  selectedId,
  onSelect,
  onUpdate,
  onDelete
}: {
  tasks: Task[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="text-left text-xs font-medium uppercase text-muted">
          <th className="border-b border-line px-4 py-3">Task</th>
          <th className="w-32 border-b border-line px-3 py-3">Status</th>
          <th className="w-32 border-b border-line px-3 py-3">Priority</th>
          <th className="w-36 border-b border-line px-3 py-3">Due</th>
          <th className="w-52 border-b border-line px-3 py-3">Tags</th>
          <th className="w-12 border-b border-line px-3 py-3" />
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr
            className={`cursor-pointer ${selectedId === task.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
            key={task.id}
            onClick={() => onSelect(task.id)}
          >
            <td className="border-b border-line px-4 py-2">
              <input
                className="w-full bg-transparent font-medium outline-none"
                onChange={(event) => onUpdate(task.id, { title: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                value={task.title}
              />
            </td>
            <td className="border-b border-line px-3 py-2">
              <StatusSelect onChange={(status) => onUpdate(task.id, { status })} value={task.status} />
            </td>
            <td className="border-b border-line px-3 py-2">
              <PrioritySelect onChange={(priority) => onUpdate(task.id, { priority })} value={task.priority} />
            </td>
            <td className="border-b border-line px-3 py-2">
              <input
                className="w-full bg-transparent outline-none"
                onChange={(event) => onUpdate(task.id, { dueDate: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                type="date"
                value={task.dueDate}
              />
            </td>
            <td className="border-b border-line px-3 py-2 text-xs text-muted">{joinCsv(task.tags) || "-"}</td>
            <td className="border-b border-line px-3 py-2">
              <button
                className="grid size-7 place-items-center rounded hover:bg-rose-50 hover:text-rose-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(task.id);
                }}
                title="Delete"
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TaskBoard({
  tasks,
  selectedId,
  onSelect,
  onUpdate
}: {
  tasks: Task[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
}) {
  return (
    <div className="grid min-w-[900px] grid-cols-3 gap-3 p-4">
      {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
        <section className="min-h-[calc(100vh-96px)] rounded-md border border-line bg-panel" key={status}>
          <header className="flex h-10 items-center justify-between border-b border-line px-3 text-sm font-medium">
            <span className="flex items-center gap-2">
              {statusIcons[status]}
              {statusLabels[status]}
            </span>
            <span className="text-xs text-muted">{tasks.filter((task) => task.status === status).length}</span>
          </header>
          <div className="space-y-2 p-2">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <button
                  className={`w-full rounded-md border bg-white p-3 text-left shadow-sm ${
                    selectedId === task.id ? "border-accent" : "border-line"
                  }`}
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  type="button"
                >
                  <div className="mb-2 line-clamp-2 text-sm font-medium">{task.title}</div>
                  <div className="mb-3 flex flex-wrap gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${priorityClasses[task.priority]}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    {task.tags.slice(0, 2).map((tag) => (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {task.dueDate || "-"}
                    </span>
                    <select
                      className="rounded border border-line bg-white px-1 py-0.5"
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => onUpdate(task.id, { status: event.target.value as TaskStatus })}
                      value={task.status}
                    >
                      {(Object.keys(statusLabels) as TaskStatus[]).map((item) => (
                        <option key={item} value={item}>
                          {statusLabels[item]}
                        </option>
                      ))}
                    </select>
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskDetail({
  task,
  onUpdate,
  onDelete
}: {
  task?: Task;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  if (!task) {
    return <aside className="border-l border-line bg-white p-5 text-sm text-muted">No task selected</aside>;
  }

  return (
    <aside className="min-w-0 border-l border-line bg-white">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        <span className="text-sm font-medium">Task detail</span>
        <button
          className="grid size-8 place-items-center rounded-md hover:bg-rose-50 hover:text-rose-600"
          onClick={() => onDelete(task.id)}
          title="Delete"
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="space-y-4 p-4">
        <textarea
          className="min-h-20 w-full resize-none rounded-md border border-transparent bg-transparent p-0 text-2xl font-semibold leading-tight outline-none focus:border-line focus:p-2"
          onChange={(event) => onUpdate(task.id, { title: event.target.value })}
          value={task.title}
        />

        <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">
          <FieldLabel icon={<Circle size={15} />} label="Status" />
          <StatusSelect onChange={(status) => onUpdate(task.id, { status })} value={task.status} />

          <FieldLabel icon={<ListFilter size={15} />} label="Priority" />
          <PrioritySelect onChange={(priority) => onUpdate(task.id, { priority })} value={task.priority} />

          <FieldLabel icon={<CalendarDays size={15} />} label="Due" />
          <input
            className="h-9 rounded-md border border-line px-2 outline-none focus:border-accent"
            onChange={(event) => onUpdate(task.id, { dueDate: event.target.value })}
            type="date"
            value={task.dueDate}
          />

          <FieldLabel icon={<UserRound size={15} />} label="Assignees" />
          <input
            className="h-9 rounded-md border border-line px-2 outline-none focus:border-accent"
            onChange={(event) => onUpdate(task.id, { assignees: splitCsv(event.target.value) })}
            value={joinCsv(task.assignees)}
          />

          <FieldLabel icon={<ListFilter size={15} />} label="Tags" />
          <input
            className="h-9 rounded-md border border-line px-2 outline-none focus:border-accent"
            onChange={(event) => onUpdate(task.id, { tags: splitCsv(event.target.value) })}
            value={joinCsv(task.tags)}
          />
        </div>

        <textarea
          className="h-[calc(100vh-430px)] min-h-56 w-full resize-none rounded-md border border-line p-3 text-sm leading-6 outline-none focus:border-accent"
          onChange={(event) => onUpdate(task.id, { notes: event.target.value })}
          placeholder="Markdown notes"
          value={task.notes}
        />

        <div className="truncate text-xs text-muted">Updated {new Date(task.updatedAt).toLocaleString()}</div>
      </div>
    </aside>
  );
}

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted">
      {icon}
      {label}
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: TaskStatus; onChange: (status: TaskStatus) => void }) {
  return (
    <select
      className="h-8 w-full rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-accent"
      onChange={(event) => onChange(event.target.value as TaskStatus)}
      value={value}
    >
      {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}

function PrioritySelect({ value, onChange }: { value: TaskPriority; onChange: (priority: TaskPriority) => void }) {
  return (
    <select
      className="h-8 w-full rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-accent"
      onChange={(event) => onChange(event.target.value as TaskPriority)}
      value={value}
    >
      {(Object.keys(priorityLabels) as TaskPriority[]).map((priority) => (
        <option key={priority} value={priority}>
          {priorityLabels[priority]}
        </option>
      ))}
    </select>
  );
}
