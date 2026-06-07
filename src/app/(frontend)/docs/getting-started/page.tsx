import {
  DocPageHeader,
  DocSection,
  P,
  Callout,
  Steps,
  Step,
  DocNavLink,
} from '@/components/docs/docs-components'

export default function GettingStartedPage() {
  return (
    <>
      <DocPageHeader
        badge="Getting started"
        title="Set up Flowline"
        description="From account creation to your first productive day — everything you need to get going in under 10 minutes."
      />

      <DocSection id="account" title="Create your account">
        <P>
          Flowline supports two sign-in methods: email and password, or Google OAuth. We recommend
          Google sign-in if you plan to use Google Calendar sync, it saves an extra step later.
        </P>
        <Steps>
          <Step number={1} title="Sign up">
            Go to the sign-up page and enter your email and a password, or click &quot;Continue with
            Google&quot;. No email verification is required.
          </Step>
          <Step number={2} title="Set your timezone">
            After signing in, open your profile settings and confirm your timezone. This affects
            habit scheduling, focus analytics, and the Today view, it&apos;s important to get right.
          </Step>
          <Step number={3} title="Your default list is ready">
            Flowline automatically creates a &quot;Todo&quot; list for you. You can rename it or
            create new lists at any time.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="first-task" title="Create your first task">
        <P>
          Navigate to any list from the sidebar and click <strong>Add a new task</strong>. Give it a
          title, that&apos;s the minimum. You can add a description, due date, tags, and subtasks at
          any time by clicking the edit icon on the task card.
        </P>
        <Callout type="info" title="Mentions">
          In any description field, type <code>@</code> followed by a task name to create a
          cross-reference link between tasks. Useful for grouping related work.
        </Callout>
      </DocSection>

      <DocSection id="first-habit" title="Create your first habit">
        <Steps>
          <Step number={1} title="Open Habits">
            Click Habits in the sidebar, then navigate to the Habits view.
          </Step>
          <Step number={2} title="Add a habit">
            Click the add button and give your habit a name, a frequency (daily, specific days,
            times per week, or every X days), and optionally a colour and category tag.
          </Step>
          <Step number={3} title="Complete it today">
            Back in the habits view, click the circle next to the habit to mark it as done. Your
            streak starts from day one.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="first-event" title="Add a calendar event">
        <P>
          Open the Calendar from the sidebar. Click any time slot or use the + button to create an
          event. You can assign it to a category (colour-coded), set a recurrence rule, and make it
          all-day if needed.
        </P>
        <P>
          To connect Google Calendar, go to your profile settings → Calendar → Connect Google
          Calendar. Your existing Google events will appear alongside Flowline events automatically.
        </P>
      </DocSection>

      <DocSection id="first-session" title="Start a focus session">
        <P>
          Navigate to Timer in the sidebar. Choose a category and optionally link the session to a
          task. Click Start, you&apos;re in a free timer session. To use a fixed-duration session
          with work/break phases, set the session duration and work/break times before starting.
        </P>
        <Callout type="tip" title="Save configs">
          Once you find a setup you like, Flowline automatically saves it as a config. You can
          reload any saved config from the sidebar panel on the Timer page with one click.
        </Callout>
      </DocSection>

      <DocSection id="next" title="What's next?">
        <P>
          Now that you have the basics set up, explore the individual feature guides for deeper
          functionality.
        </P>
        <div className="flex flex-col gap-2">
          <DocNavLink href="/docs/tasks" label="Tasks & Lists — subtasks, tags, recurring tasks" />
          <DocNavLink href="/docs/habits" label="Habits — streaks, goals, tracking fields" />
          <DocNavLink
            href="/docs/calendar"
            label="Calendar — recurrence, Google sync, drag & drop"
          />
          <DocNavLink href="/docs/timer" label="Focus Timer — phases, sessions, categories" />
          <DocNavLink
            href="/docs/dashboard"
            label="Dashboard — insights, day progress, priorities"
          />
        </div>
      </DocSection>
    </>
  )
}
