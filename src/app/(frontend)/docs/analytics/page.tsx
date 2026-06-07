import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
} from '@/components/docs/docs-components'

export default function AnalyticsDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Analytics"
        description="Flowline tracks your productivity across tasks, habits, and focus time. Analytics pages let you explore trends, spot patterns, and understand where your time and effort goes."
      />

      <DocSection id="lists-analytics" title="List analytics">
        <P>
          Found under Lists → Analytics. Shows how many tasks you complete, broken down by tag,
          across any time period.
        </P>

        <DocSubSection title="KPI cards">
          <PropTable
            rows={[
              {
                name: 'Completed (7d)',
                description: 'Total tasks completed in the last 7 days (rolling window).',
              },
              {
                name: 'Tags active',
                description: 'Number of distinct tags on completed tasks, with the top tag shown.',
              },
              {
                name: 'Avg per day',
                description: 'Average completions per day in the selected period.',
              },
              {
                name: 'Best day',
                description: 'Day with the highest number of completions and its date.',
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection title="Completion by tag (donut chart)">
          <P>
            A donut chart showing the split of completed tasks by tag over the last 7 days. Hover
            any segment to see the exact count for that tag. The legend is also interactive.
          </P>
        </DocSubSection>

        <DocSubSection title="Completions over time (series chart)">
          <P>
            A bar or line chart showing completions per day (day view), per day in the week (week
            view), or per day in the month (month view), stacked by tag. Use the period selector to
            switch between day, week, and month, and the navigation arrows to look at past periods.
          </P>
          <Callout type="tip">
            Switch to the line chart mode for a cleaner view of trends when you have many tags.
          </Callout>
        </DocSubSection>

        <DocSubSection title="Tag breakdown">
          <P>
            A ranked list of all active tags with their completion counts and a proportional
            progress bar. Useful for seeing at a glance which types of work you complete most.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="habits-analytics" title="Habit analytics">
        <P>Found under Habits → Analytics. Provides a long-term view of habit consistency.</P>

        <DocSubSection title="Yearly heatmap">
          <P>
            A GitHub-style heatmap showing combined habit completion density across all your habits
            for the selected year. Each cell represents one day darker cells mean more habits were
            completed that day relative to the total scheduled.
          </P>
        </DocSubSection>

        <DocSubSection title="Per-habit stats">
          <P>
            Below the heatmap, each habit shows its current streak, longest streak, 30-day
            completion rate, and (if tracking fields are enabled) a chart of cumulative logged
            values over time.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="timer-analytics" title="Timer analytics">
        <P>
          Found under Timer → Analytics. Shows your focus time across any period, broken down by
          category.
        </P>

        <DocSubSection title="Period controls">
          <P>
            Switch between day, week, and month views. Use the navigation arrows to explore past
            periods. The current period always shows your most recent sessions.
          </P>
        </DocSubSection>

        <DocSubSection title="Category breakdown">
          <P>
            A stacked bar chart shows how focus time is divided across categories. A segmented bar
            at the top gives an at-a-glance split. The legend lists each category with its total
            duration and percentage.
          </P>
        </DocSubSection>

        <DocSubSection title="Session list">
          <P>
            Individual sessions are listed with their start time, duration, category, subcategory,
            linked task (if any), and rating. You can review specific sessions to understand how
            your time was actually spent.
          </P>
        </DocSubSection>
      </DocSection>

      <DocSection id="dashboard-analytics" title="Analytics on the dashboard">
        <P>
          The dashboard surfaces a condensed view of your most important metrics in real time,
          today&apos;s task and habit progress, focus time with a 7-day chart, and personalised
          insights. See the{' '}
          <a
            href="/docs/dashboard"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Dashboard documentation
          </a>{' '}
          for full details.
        </P>
      </DocSection>
    </>
  )
}
