import {
  DocPageHeader,
  DocSection,
  DocSubSection,
  P,
  Callout,
  PropTable,
} from '@/components/docs/docs-components'

export default function SettingsDocsPage() {
  return (
    <>
      <DocPageHeader
        badge="Account"
        title="Profile & Settings"
        description="Manage your account, timezone, avatar, and integrations from the profile page."
      />

      <DocSection id="profile" title="Profile">
        <PropTable
          rows={[
            {
              name: 'Name',
              description: 'Displayed in the dashboard header greeting and the user dropdown.',
            },
            {
              name: 'Email',
              description: 'Your sign-in email. Cannot be changed after account creation.',
            },
            {
              name: 'Avatar',
              description:
                'Upload a profile photo. Stored via Cloudinary and shown in the header and dropdown.',
            },
            {
              name: 'Timezone',
              description:
                'Used for habit scheduling, focus analytics, the Today view, and calendar events. Defaults to UTC.',
            },
          ]}
        />
        <Callout type="warning" title="Timezone matters">
          Setting the correct timezone is important. An incorrect timezone causes habits to appear
          on the wrong days, today&apos;s tasks to be miscalculated, and focus analytics to show
          data in the wrong time slots.
        </Callout>
      </DocSection>

      <DocSection id="theme" title="Theme">
        <P>
          Flowline supports light, dark, and system-preference themes. Toggle using the moon/sun
          icon in the top navigation. Your preference is stored locally.
        </P>
      </DocSection>

      <DocSection id="google" title="Google Calendar integration">
        <P>
          If you signed up with Google or linked a Google account, you can connect Google Calendar
          from your profile settings. Once connected, all your Google calendars appear in the
          Flowline sidebar and can be toggled individually.
        </P>
        <P>
          To disconnect, go to profile settings → Calendar → Disconnect. This removes the sync
          record but does not affect your Google account.
        </P>
      </DocSection>

      <DocSection id="data" title="Account and data">
        <DocSubSection title="Delete account">
          <P>
            You can permanently delete your Flowline account from the profile settings. This removes
            all your data, tasks, lists, habits, calendar events, and timer sessions. This action is
            irreversible.
          </P>
        </DocSubSection>
      </DocSection>
    </>
  )
}
