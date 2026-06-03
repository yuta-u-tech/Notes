import { Task, TaskIndex, emptyTaskIndex, indexPath, markdownPathForTask, taskToMarkdown } from "@/lib/tasks";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  tasksPath: string;
};

type GitHubContent = {
  content?: string;
  sha?: string;
};

const apiBase = "https://api.github.com";

const getConfig = (): GitHubConfig => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub environment. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.");
  }

  return {
    token,
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH || "main",
    tasksPath: process.env.GITHUB_TASKS_PATH || "tasks"
  };
};

const githubFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const config = getConfig();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GITHUB_NOT_FOUND");
    }

    if (response.status === 409) {
      throw new Error("GITHUB_CONFLICT");
    }

    const text = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
};

const decodeBase64 = (value: string) => Buffer.from(value, "base64").toString("utf8");
const encodeBase64 = (value: string) => Buffer.from(value, "utf8").toString("base64");

const getContent = async (path: string): Promise<GitHubContent | null> => {
  const config = getConfig();

  try {
    return await githubFetch<GitHubContent>(
      `/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}?ref=${config.branch}`
    );
  } catch (error) {
    if (error instanceof Error && error.message === "GITHUB_NOT_FOUND") {
      return null;
    }

    throw error;
  }
};

const putContent = async (path: string, content: string, message: string, sha?: string) => {
  const config = getConfig();

  return githubFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch: config.branch,
      sha
    })
  });
};

const deleteContent = async (path: string, message: string, sha: string) => {
  const config = getConfig();

  return githubFetch(`/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}`, {
    method: "DELETE",
    body: JSON.stringify({
      message,
      branch: config.branch,
      sha
    })
  });
};

export const loadTasks = async (): Promise<TaskIndex> => {
  const config = getConfig();
  const content = await getContent(indexPath(config.tasksPath));

  if (!content?.content) {
    return emptyTaskIndex();
  }

  return JSON.parse(decodeBase64(content.content.replaceAll("\n", ""))) as TaskIndex;
};

export const saveTasks = async (tasks: Task[], actor = "web-app") => {
  const config = getConfig();
  const now = new Date().toISOString();
  const indexFile = await getContent(indexPath(config.tasksPath));
  const previousIndex = indexFile?.content
    ? (JSON.parse(decodeBase64(indexFile.content.replaceAll("\n", ""))) as TaskIndex)
    : emptyTaskIndex();
  const updatedTasks = tasks.map((task) => ({
    ...task,
    updatedAt: task.updatedAt || now,
    updatedBy: task.updatedBy || actor
  }));
  const index: TaskIndex = {
    version: 1,
    updatedAt: now,
    tasks: updatedTasks
  };

  const currentIds = new Set(updatedTasks.map((task) => task.id));
  const deletedTasks = previousIndex.tasks.filter((task) => !currentIds.has(task.id));

  await Promise.all(
    updatedTasks.map(async (task) => {
      const path = markdownPathForTask(config.tasksPath, task.id);
      const existing = await getContent(path);
      await putContent(path, taskToMarkdown(task), `Update task: ${task.title}`, existing?.sha);
    })
  );

  await Promise.all(
    deletedTasks.map(async (task) => {
      const path = markdownPathForTask(config.tasksPath, task.id);
      const existing = await getContent(path);

      if (existing?.sha) {
        await deleteContent(path, `Delete task: ${task.title}`, existing.sha);
      }
    })
  );

  await putContent(
    indexPath(config.tasksPath),
    `${JSON.stringify(index, null, 2)}\n`,
    `Update task index (${updatedTasks.length} tasks)`,
    indexFile?.sha
  );

  return index;
};
