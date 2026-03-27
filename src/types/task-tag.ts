import { Task } from "@/payload-types";

export type TaskTag = NonNullable<Task['tags']>[number]
