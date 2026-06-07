import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
  DocNavLink,
} from '@/components/docs/docs-components'

export default function TasksDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Tasks & Lists"
        description="Flowline's task system is built around lists — each list is a focused container for related work. Tasks support subtasks, tags, due dates, recurrence, and cross-references."
      />

      <DocSection id="lists" title="Lists">
        <P>
          Lists are the primary organisational unit. Every task belongs to exactly one list. You can
          create as many lists as you need, each with a name, category label, and colour.
        </P>

        <DocSubSection title="Creating a list">
          <P>
            Click <strong>New list</strong> in the sidebar under Lists. Give it a name (must be
            unique), an optional category name (e.g. &quot;Work&quot;, &quot;Personal&quot;), and
            pick a colour. The colour and category appear in the sidebar and on task badges.
          </P>
          <Callout type="warning" title="Unique names">
            Two lists cannot share the same name. If you try to create or rename a list to an
            existing name, you&apos;ll see an error.
          </Callout>
        </DocSubSection>

        <DocSubSection title="Editing and deleting">
          <P>
            Open any list and click the pencil icon in the header to edit the name, category, or
            colour. Changes appear instantly. Deleting a list permanently deletes all its tasks,
            this cannot be undone.
          </P>
        </DocSubSection>

        <DocSubSection title="Special views">
          <PropTable
            rows={[
              {
                name: 'Today',
                description: 'All tasks due today plus all recurring tasks for the current day.',
                note: 'Read-only — tasks cannot be created here directly.',
              },
              {
                name: 'Recurring',
                description: 'All recurring tasks across all lists.',
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      <DocSection id="tasks" title="Tasks">
        <DocSubSection title="Task types">
          <PropTable
            rows={[
              {
                name: 'Simple',
                description: 'A one-off task. Can have a due date and auto-delete on due date.',
              },
              {
                name: 'Recurring',
                description:
                  'Repeats on a schedule — every day, specific days of the week, or custom. Resets automatically each scheduled day.',
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Task fields">
          <PropTable
            rows={[
              { name: 'Title', description: 'Required. The main identifier for the task.' },
              {
                name: 'Description',
                description: 'Rich text with @mention support for cross-referencing other tasks.',
              },
              {
                name: 'Due date',
                description:
                  'Optional. Shown as a badge on the task card with urgency colouring as the date approaches.',
              },
              {
                name: 'Auto-delete',
                description:
                  'When enabled, the task moves to trash automatically once its due date passes.',
              },
              {
                name: 'Tags',
                description:
                  'System tags (Urgent, Work, Personal, Health, Finance, Learning) plus custom tags with any name and colour.',
              },
              {
                name: 'Subtasks',
                description:
                  'Nested checklist items with their own description, due date, and tags.',
              },
              {
                name: 'List',
                description: 'The list this task belongs to. Can be changed at any time.',
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Completing tasks">
          <P>
            Click the checkbox to toggle a task between active and completed. If a task has
            subtasks, clicking the main checkbox completes all subtasks at once. You can also
            complete subtasks individually, once all are done, the parent completes automatically.
          </P>
          <P>
            Unchecking a completed task that had subtasks resets all subtasks back to incomplete.
          </P>
        </DocSubSection>

        <DocSubSection title="Subtasks">
          <P>
            Add subtasks when creating or editing a task. Each subtask can have a description, due
            date, and tags. A subtask&apos;s due date cannot be set later than the parent
            task&apos;s due date.
          </P>
          <P>
            A progress bar shows how many subtasks are complete. Expand any subtask using the
            chevron to view or edit its details inline.
          </P>
        </DocSubSection>

        <DocSubSection title="Tags">
          <P>
            Tags help filter and categorise tasks across lists. Flowline includes six system tags.
            You can also create custom tags with any name and hex colour, these are shared across
            all your tasks and lists.
          </P>
          <Callout type="info">
            Custom tags can be deleted from the tag editor inside any task form. Deleting a tag
            removes it from all tasks immediately.
          </Callout>
        </DocSubSection>

        <DocSubSection title="@Mentions">
          <P>
            In any description field, type <code>@</code> followed by a task title to create a
            clickable reference to another task. If the referenced task is later deleted, the
            mention turns red as a visual indicator.
          </P>
        </DocSubSection>

        <DocSubSection title="Trash">
          <P>
            Deleted tasks move to the Trash tab of their list. They are kept for 15 days before
            permanent deletion. Each trashed task shows the days remaining. You can restore or
            permanently delete any trashed task at any time.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="urgency" title="Urgency indicators">
        <P>
          Tasks approaching their due date get visual urgency indicators in the sidebar and on task
          cards:
        </P>
        <PropTable
          rows={[
            { name: 'Orange dot', description: 'Due within 48 hours.' },
            { name: 'Red dot', description: 'Due within 24 hours or overdue.' },
          ]}
        />
      </DocSection>

      <DocSection id="next" title="Related">
        <div className="flex flex-col gap-2">
          <DocNavLink
            href="/docs/dashboard"
            label="Dashboard — see your today tasks and priorities"
          />
          <DocNavLink
            href="/docs/analytics"
            label="Analytics — completion rates by tag over time"
          />
        </div>
      </DocSection>
    </>
  )
}
