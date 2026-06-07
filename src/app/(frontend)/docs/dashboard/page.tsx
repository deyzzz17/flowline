import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
  DocNavLink,
} from '@/components/docs/docs-components'

export default function DashboardDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Dashboard"
        description="The dashboard gives you a real-time read on your day — tasks, habits, focus time, and calendar events in a single view, with personalised insights drawn from your actual data."
      />

      <DocSection id="day-progress" title="Day progress">
        <P>
          The ring in the top-right of the glance section shows an overall day progress score.
          It&apos;s calculated as a weighted average:
        </P>
        <PropTable
          rows={[
            {
              name: 'Tasks',
              description: "40% — ratio of today's tasks completed vs total today tasks.",
            },
            {
              name: 'Habits',
              description: "40% — ratio of today's habits completed vs total scheduled today.",
            },
            { name: 'Focus', description: '20% — progress toward a 4-hour reference target.' },
          ]}
        />
        <P>
          The label below the percentage changes as you progress through the day:
          <em>
            {' '}
            Day just started → Getting started → Building momentum → Halfway there → Almost there →
            Perfect day.
          </em>
        </P>
        <Callout type="info">
          The 4-hour focus reference is indicative only, there is no configurable goal. The
          percentage is capped at 100% even if you exceed 4 hours.
        </Callout>
      </DocSection>

      <DocSection id="glance" title="Today at a glance">
        <P>The four tiles below the heading give a quick read on each pillar:</P>
        <PropTable
          rows={[
            {
              name: 'Tasks',
              description:
                'Remaining and completed tasks for today only (due today + recurring today).',
            },
            {
              name: 'Habits',
              description:
                'Completed vs scheduled for today, with "All done" or the name of the habit most at risk.',
            },
            {
              name: 'Calendar',
              description: 'Number of events today and the next upcoming event with its time.',
            },
            {
              name: 'Focus',
              description: 'Total focus time logged today, or a prompt to start a session.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="priority" title="Top priority task">
        <P>
          The priority card highlights the first active task due today. It includes a direct link to
          the Timer so you can start a focus session on it immediately. The card shows the task
          title, its list, and total focus time logged this week.
        </P>
        <P>If there are no active tasks due today, this card is hidden.</P>
      </DocSection>

      <DocSection id="pillars" title="Pillar cards">
        <DocSubSection title="Tasks today">
          <P>
            Shows remaining, overdue (if any), and completed task counts for today. The completion
            bar reflects the ratio of completed to total today tasks.
          </P>
        </DocSubSection>

        <DocSubSection title="Habits">
          <P>
            Shows your overall weekly completion rate and your best active streak. If any habit is
            not yet completed today, the one with the lowest 30-day rate is flagged as &quot;At
            risk&quot;. If all habits are done, a green confirmation appears.
          </P>
        </DocSubSection>

        <DocSubSection title="Focus">
          <P>
            Shows today&apos;s total focus time and a comparison to yesterday (+/− percentage). A
            7-day bar chart shows daily totals for the current week, today is highlighted. Hover any
            bar for the exact time. At the bottom, the dominant category for today is shown.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="insights" title="Insights">
        <P>
          The &quot;What Flowline noticed&quot; section surfaces up to 4 personalised observations
          drawn from your real data. Insights are generated fresh on each page load and prioritised
          by urgency:
        </P>
        <PropTable
          rows={[
            {
              name: 'Warning (orange)',
              description:
                'Streak at risk today, habit with low completion rate, focus time dropping, overdue tasks.',
            },
            {
              name: 'Good (green)',
              description:
                'Personal record streak, habit at 85%+ completion, focus up vs yesterday or last week, solid deep work session, productive task day.',
            },
            {
              name: 'Neutral (blue)',
              description:
                'Category dominating focus time, no sessions yet today with next task suggestion.',
            },
          ]}
        />
        <P>
          Insights only appear when there is meaningful data. On a brand-new account with no
          history, this section is hidden.
        </P>
      </DocSection>

      <DocSection id="time-breakdown" title="Time breakdown">
        <P>
          The time breakdown card shows how your focus time this week is split across categories. A
          segmented bar and legend display up to 4 categories with their durations and percentages.
        </P>
      </DocSection>

      <DocSection id="today-events" title="Today's events">
        <P>
          A compact list of today&apos;s calendar events (Flowline and Google) in chronological
          order. Up to 4 events are shown, click &quot;View calendar&quot; or the &quot;+N
          more&quot; link if there are additional events.
        </P>
      </DocSection>

      <DocSection id="goals" title="Habit goals">
        <P>
          Active habit goals with measurable progress are shown at the bottom of the dashboard. Each
          goal displays the habit name, current progress, and a bar toward the target.
        </P>
        <DocNavLink href="/docs/habits#goals" label="Habits — goals documentation" />
      </DocSection>
    </>
  )
}
