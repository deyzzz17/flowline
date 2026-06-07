import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
} from '@/components/docs/docs-components'

export default function CalendarDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Calendar"
        description="Flowline's calendar brings together your events, habits, and schedule in one view. It supports full recurrence rules, drag-and-drop rescheduling, and Google Calendar sync."
      />

      <DocSection id="views" title="Calendar views">
        <PropTable
          rows={[
            { name: 'Month', description: 'Overview of all events across the month.' },
            { name: 'Week', description: 'Detailed hourly view of the current week.' },
            { name: 'Day', description: 'Single-day detail with time slots.' },
          ]}
        />
        <P>
          Switch views using the controls in the top-right of the calendar. Navigate between periods
          using the arrow buttons or click Today to jump back to the current date.
        </P>
      </DocSection>

      <DocSection id="creating-events" title="Creating events">
        <P>
          Click any time slot in the calendar to create an event at that time. You can also use the
          + button in the header. Events require a title and a start/end time (or all-day toggle).
        </P>
        <PropTable
          rows={[
            { name: 'Title', description: 'Required.' },
            { name: 'Description', description: 'Optional free text.' },
            { name: 'Start / end', description: 'Date and time, or all-day toggle.' },
            {
              name: 'Category',
              description: 'Assigns the event to a colour-coded category visible in the sidebar.',
            },
            {
              name: 'Colour',
              description: 'Override the category colour for this event specifically.',
            },
            { name: 'Recurrence', description: 'Repeat rule — see Recurrence section below.' },
          ]}
        />
      </DocSection>

      <DocSection id="recurrence" title="Recurrence">
        <P>Recurring events repeat on a configurable schedule. Flowline supports:</P>
        <PropTable
          rows={[
            { name: 'Daily', description: 'Repeats every N days.' },
            { name: 'Weekly', description: 'Repeats on selected days of the week, every N weeks.' },
            {
              name: 'Monthly',
              description:
                'Repeats on a specific day of the month, or the same weekday (e.g. "first Monday").',
            },
            { name: 'Yearly', description: 'Repeats once per year on the same date.' },
          ]}
        />
        <P>
          End conditions: never (runs indefinitely), on a specific date, or after a set number of
          occurrences.
        </P>

        <DocSubSection title="Editing recurring events">
          <P>
            When you edit or delete a recurring event, Flowline asks which occurrences to affect:
          </P>
          <PropTable
            rows={[
              {
                name: 'This event',
                description: 'Changes this occurrence only. Other occurrences are unaffected.',
              },
              {
                name: 'This and following',
                description: 'Changes this occurrence and all future ones in the series.',
              },
              {
                name: 'All events',
                description: 'Changes the entire series from the original start date.',
              },
            ]}
          />
          <Callout type="info">
            Editing &quot;this event&quot; only creates an override for that specific date — the
            rest of the series continues unchanged.
          </Callout>
        </DocSubSection>
      </DocSection>

      <DocSection id="drag-drop" title="Drag and drop">
        <P>
          Flowline events can be dragged to any time slot to reschedule them. For recurring events,
          dragging an occurrence opens the same scope selector (this / this and following / all).
        </P>
        <Callout type="warning">
          Google Calendar events are read-only in Flowline. They cannot be dragged or edited —
          changes must be made in Google Calendar directly.
        </Callout>
      </DocSection>

      <DocSection id="categories" title="Calendar categories">
        <P>
          Categories are colour-coded labels you assign to events. They appear in the sidebar under
          Calendar where you can toggle each category on or off to filter the view.
        </P>
        <P>
          Default categories (Personal, Work, Health) are created automatically. You can create,
          rename, or delete categories from the sidebar. Deleting a category also deletes all events
          assigned to it.
        </P>
      </DocSection>

      <DocSection id="google" title="Google Calendar sync">
        <DocSubSection title="Connecting">
          <P>
            Go to your profile settings → Calendar and click Connect Google Calendar. You must be
            signed in with Google (or have linked your Google account) for this to work.
          </P>
          <P>
            Once connected, all your Google calendars appear in the sidebar. Each can be toggled
            independently. Flowline fetches up to 500 events per calendar per visible date range.
          </P>
        </DocSubSection>

        <DocSubSection title="Limitations">
          <P>
            Google Calendar events are read-only in Flowline. You can see them alongside your
            Flowline events but cannot create, edit, or delete them from within Flowline.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="habits-in-calendar" title="Habits in the calendar">
        <P>
          Habits with &quot;Show in calendar&quot; enabled appear as events on their scheduled days.
          They use the habit&quot;s colour and show a checkmark when completed. See the{' '}
          <a
            href="/docs/habits#calendar"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Habits documentation
          </a>{' '}
          for configuration options.
        </P>
      </DocSection>
    </>
  )
}
