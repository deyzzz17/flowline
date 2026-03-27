import { Task } from "@/payload-types";

export type RecurrenceDay = NonNullable<NonNullable<Task['recurrence']>['days']>[number]