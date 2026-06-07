import {
  DocPageHeader,
  DocSection,
  P,
  Callout,
  PropTable,
  DocNavLink,
} from '@/components/docs/docs-components'

export default function TimerDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Features"
        title="Focus Timer"
        description="Flowline's timer tracks deep work sessions with optional Pomodoro-style phases, category tagging, and task linking. Every session is logged and feeds into your analytics."
      />

      <DocSection id="session-types" title="Session types">
        <PropTable
          rows={[
            {
              name: 'Free timer',
              description:
                'Runs without a fixed end time. You stop it manually. Useful for open-ended work blocks.',
            },
            {
              name: 'Session timer',
              description:
                'Has a defined total duration (e.g. 90 minutes). When the time is up, the session ends automatically.',
            },
          ]}
        />
        <P>
          Both types support work/break phases. When work and break durations are set, the timer
          cycles through work → break → work automatically within the session.
        </P>
      </DocSection>

      <DocSection id="configuration" title="Configuring a session">
        <PropTable
          rows={[
            {
              name: 'Session duration',
              description: 'Total length of the session. Leave empty for a free timer.',
            },
            {
              name: 'Work duration',
              description: 'Length of each focused work block within the session (Pomodoro-style).',
            },
            {
              name: 'Break duration',
              description: 'Length of each break between work blocks.',
            },
            {
              name: 'Category',
              description:
                'What you\'re working on (e.g. "Flowline", "Study"). Used in analytics breakdown.',
            },
            {
              name: 'Subcategory',
              description: 'Optional finer-grained label within the category.',
            },
            {
              name: 'Task',
              description:
                'Link the session to a specific task. The task can be marked complete at the end.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="saved-configs" title="Saved configs">
        <P>
          Flowline automatically saves each session configuration so you can reuse it. Saved configs
          appear in the sidebar panel on the timer page, click the play button on any config to
          start immediately with those settings.
        </P>
        <P>
          Each config card shows the session name, category, subcategory, total duration, and
          work/break split. Free timer configs also display their work/break phases if set.
        </P>
        <Callout type="tip">
          You can delete configs you no longer need using the trash icon on the config card.
        </Callout>
      </DocSection>

      <DocSection id="logging" title="Session logging">
        <P>Every completed session is logged with:</P>
        <PropTable
          rows={[
            { name: 'Duration', description: 'Actual elapsed time (not the configured duration).' },
            { name: 'Category & subcategory', description: 'As configured at session start.' },
            { name: 'Task', description: 'Linked task, if any.' },
            { name: 'Rating', description: 'Optional 1–5 quality rating you give at the end.' },
            { name: 'Started at', description: 'Timestamp with your local timezone offset.' },
          ]}
        />
        <P>
          All session data feeds into the Timer Analytics page and the Focus section of your
          dashboard.
        </P>
      </DocSection>

      <DocSection id="analytics-overview" title="Analytics from sessions">
        <P>
          Sessions are aggregated by category and time period. On the dashboard you&apos;ll see:
        </P>
        <PropTable
          rows={[
            { name: 'Today', description: 'Total focus time logged today.' },
            {
              name: 'This week',
              description: 'Total for the current week with a 7-day bar chart.',
            },
            {
              name: 'vs yesterday',
              description: 'Percentage change compared to the same time yesterday.',
            },
            {
              name: 'Top category',
              description: 'Category that accounts for the most time today.',
            },
          ]}
        />
        <Callout type="info">
          The 7-day bars on the dashboard Focus card use your local timezone to determine
          &quot;today&quot;, so the highlighted bar always matches your actual current day.
        </Callout>
        <DocNavLink href="/docs/analytics" label="Analytics — full timer analytics documentation" />
      </DocSection>
    </>
  )
}
