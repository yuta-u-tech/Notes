import { NextResponse } from "next/server";
import { loadTasks, saveTasks } from "@/lib/github";
import { Task } from "@/lib/tasks";

export async function GET() {
  try {
    const index = await loadTasks();
    return NextResponse.json(index);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { tasks?: Task[]; actor?: string };

    if (!Array.isArray(body.tasks)) {
      return NextResponse.json({ error: "tasks must be an array" }, { status: 400 });
    }

    const index = await saveTasks(body.tasks, body.actor);
    return NextResponse.json(index);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "GITHUB_CONFLICT" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
