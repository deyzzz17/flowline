import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
  DocNavLink,
} from '@/components/docs/docs-components'

export default function HabitsDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Habits"
        description="Habit tracking in Flowline is built around streaks, flexible scheduling, and measurable goals. Track simple check-ins or complex quantitative targets."
      />

      <DocSection id="creating" title="Creating a habit">
        <P>
          Go to Habits → Habits view and click the add button. At minimum, give the habit a name and
          a frequency. Everything else is optional.
        </P>
        <PropTable
          rows={[
            {
              name: 'Name',
              description: 'Required. Displayed on the habit card and in the calendar.',
            },
            {
              name: 'Colour',
              description: 'Used on the habit card, heatmap, and calendar events.',
            },
            { name: 'Category tag', description: 'Optional label for grouping habits.' },
            {
              name: 'Frequency',
              description: 'How often the habit should be completed. See frequency options below.',
            },
            {
              name: 'Start date',
              description:
                'Optional. Affects streak calculation — completions before the start date are ignored.',
            },
            {
              name: 'Show in calendar',
              description: 'Displays the habit as an event in the Calendar view.',
            },
            {
              name: 'Tracking fields',
              description: 'Custom fields (number, text, boolean) logged with each completion.',
            },
            { name: 'Goals', description: 'Manual or field-based targets to work toward.' },
          ]}
        />
      </DocSection>

      <DocSection id="frequency" title="Frequency options">
        <PropTable
          rows={[
            {
              name: 'Daily',
              description: 'Must be completed every day. Missing one day breaks the streak.',
            },
            {
              name: 'Days of week',
              description:
                'Only scheduled on specific days (e.g. Mon, Wed, Fri). Streak counts consecutive scheduled days completed.',
            },
            {
              name: 'Times per week',
              description:
                'Target a number of completions within each week (Mon–Sun). Streak counts consecutive weeks where the target was met.',
            },
            {
              name: 'Every X days',
              description:
                'Scheduled every N days from the start date. Flexible for habits like "every 3 days".',
            },
          ]}
        />
      </DocSection>

      <DocSection id="streaks" title="Streaks">
        <P>
          A streak counts consecutive periods where you completed the habit on every scheduled
          occurrence. The calculation depends on your frequency setting:
        </P>
        <PropTable
          rows={[
            {
              name: 'Daily',
              description:
                'Each day counts. Missing today does not break the streak until the day ends.',
            },
            {
              name: 'Days of week',
              description: 'Each scheduled day counts. Non-scheduled days are ignored.',
            },
            {
              name: 'Times per week',
              description: 'Each full week where you hit the target counts.',
            },
            { name: 'Every X days', description: 'Each scheduled interval counts.' },
          ]}
        />
        <Callout type="info">
          The current streak and longest streak are both tracked separately. Your longest streak is
          never overwritten, it&quot;s a permanent personal record.
        </Callout>
      </DocSection>

      <DocSection id="completion-rate" title="Completion rate">
        <P>
          The 30-day completion rate shows what percentage of scheduled occurrences you completed in
          the last 30 days. For habits with field-based goals, the rate reflects progress toward the
          goal target instead.
        </P>
      </DocSection>

      <DocSection id="tracking-fields" title="Tracking fields">
        <P>
          Tracking fields let you log quantitative data with each completion, for example, distance
          run, pages read, or minutes meditated. Each field has a type:
        </P>
        <PropTable
          rows={[
            { name: 'Number', description: 'Numeric value logged per completion (e.g. 5.2 km).' },
            { name: 'Text', description: 'Free text note per completion.' },
            { name: 'Boolean', description: 'Yes/no toggle per completion.' },
          ]}
        />
        <P>
          When you mark a habit as complete, a form appears for each enabled tracking field. Logged
          values are used by field-based goals and appear in habit analytics.
        </P>
      </DocSection>

      <DocSection id="goals" title="Goals">
        <DocSubSection title="Manual goals">
          <P>
            A free-text description of something you want to achieve. You mark it as complete
            yourself when you feel you&quot;ve reached it. Useful for qualitative targets like
            &quot;meditate for 30 consecutive days&quot;.
          </P>
        </DocSubSection>

        <DocSubSection title="Field-based goals">
          <P>
            Tied to one or more tracking fields with a numeric target. Flowline automatically tracks
            cumulative progress. When the target is reached, a trophy icon appears on the habit card
            and you can claim it.
          </P>
          <Callout type="tip" title="End on reach">
            Enable &quot;End on reach&quot; on a field-based goal to make the completion rate
            reflect progress toward the goal total rather than the daily schedule.
          </Callout>
        </DocSubSection>
      </DocSection>

      <DocSection id="calendar" title="Habits in the Calendar">
        <P>
          Enable &quot;Show in calendar&quot; on any habit to display it as a calendar event. You
          can choose:
        </P>
        <PropTable
          rows={[
            {
              name: 'Fixed time',
              description: 'The habit appears at a specific time each scheduled day.',
            },
            {
              name: 'Relative position',
              description: 'Position the habit before or after a specific calendar event.',
            },
          ]}
        />
        <P>
          Completed habits show a checkmark in the calendar. Incomplete scheduled habits show as
          unfilled. The habit colour is used for the calendar event.
        </P>
      </DocSection>

      <DocSection id="analytics" title="Habit analytics">
        <P>
          The Habits → Analytics page shows a yearly heatmap of all your habits combined, plus
          per-habit breakdown with completion rate, streak history, and (if tracking fields are
          enabled) a chart of logged values over time.
        </P>
        <DocNavLink href="/docs/analytics" label="Analytics — full analytics documentation" />
      </DocSection>
    </>
  )
}
