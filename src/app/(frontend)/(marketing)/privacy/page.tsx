import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Flowline',
  description: 'Learn how Flowline collects, uses, and protects your personal data.',
}

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: (
      <p>
        Flowline is a personal productivity app that helps you organize your tasks, lists,
        subtasks, timers, and calendar events. This Privacy Policy describes how we collect, use,
        store, and protect your personal data when you use Flowline, in compliance with the General
        Data Protection Regulation (GDPR) and applicable data protection laws.
      </p>
    ),
  },
  {
    id: 'controller',
    title: '2. Data Controller',
    content: (
      <p>
        Flowline is the data controller responsible for processing your personal data. For any
        questions regarding this policy or to exercise your rights, contact us at{' '}
        <a
          href="mailto:support@flowlineworkspace.com"
          className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
        >
          support@flowlineworkspace.com
        </a>
        .
      </p>
    ),
  },
  {
    id: 'data-collected',
    title: '3. Data We Collect',
    content: (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">3.1 Data you provide directly</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Account information: email address, password (hashed), timezone</li>
            <li>App content: tasks, lists, subtasks, mentions, tags, calendar events, categories, timers, and work sessions</li>
            <li>Media files: images or attachments you upload (stored via Cloudinary)</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">3.2 Data collected automatically</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Session data: session ID, authentication cookies, login timestamps</li>
            <li>Technical data: IP address, browser type, operating system, pages visited</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">3.3 Data from third-party services</h3>
          <p className="text-muted-foreground">
            If you sign in with Google: email address, name, and profile picture via OAuth 2.0. If
            you enable the Google Calendar integration: calendar events (title, description, dates),
            OAuth access token and refresh token stored securely. Google Calendar events are fetched
            in <strong className="text-foreground">read-only</strong> mode and are{' '}
            <strong className="text-foreground">not permanently stored</strong> in our database.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'legal-basis',
    title: '4. Purposes and Legal Basis',
    content: (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-foreground">Purpose</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Legal basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {[
              ['Account creation and management', 'Performance of a contract'],
              ['Providing app features (tasks, calendar, timers, etc.)', 'Performance of a contract'],
              ['Authentication and account security', 'Legitimate interest / Performance of a contract'],
              ['Google Calendar synchronization', 'Explicit consent'],
              ['App improvement and usage analytics', 'Legitimate interest'],
              ['Transactional emails', 'Performance of a contract'],
              ['Account deletion upon request', 'Legal obligation / Performance of a contract'],
            ].map(([purpose, basis]) => (
              <tr key={purpose} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                <td className="px-4 py-3 text-muted-foreground">{basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'sharing',
    title: '5. Data Sharing',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          We never sell your data. It may be shared only with the technical sub-processors necessary
          to operate Flowline:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: 'Vercel', role: 'Hosting and deployment', country: 'United States' },
            { name: 'Neon / PostgreSQL', role: 'Database', country: 'Cloud' },
            { name: 'Cloudinary', role: 'Media storage', country: 'United States' },
            { name: 'Resend', role: 'Transactional emails', country: 'United States' },
            { name: 'Inngest', role: 'Background job processing', country: 'United States' },
            { name: 'Google', role: 'OAuth & Calendar API', country: 'If used' },
          ].map((provider) => (
            <div
              key={provider.name}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">
                  {provider.role} · {provider.country}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          These sub-processors only have access to data strictly necessary for their services and
          are bound by contractual confidentiality obligations.
        </p>
      </div>
    ),
  },
  {
    id: 'transfers',
    title: '6. International Data Transfers',
    content: (
      <p className="text-muted-foreground">
        Some of our sub-processors are established outside the European Economic Area (EEA),
        particularly in the United States. These transfers are governed by appropriate safeguards,
        including Standard Contractual Clauses (SCCs) approved by the European Commission.
      </p>
    ),
  },
  {
    id: 'retention',
    title: '7. Data Retention',
    content: (
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-foreground">Data type</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Retention period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {[
              ['Account data (email, profile)', 'Until account deletion'],
              ['App content (tasks, events, timers)', 'Until account deletion'],
              ['Google OAuth tokens', 'Until Google disconnection or account deletion'],
              ['Session data', '5 minutes (cache) then automatic expiry'],
              ['Technical logs', 'Maximum 90 days'],
            ].map(([type, retention]) => (
              <tr key={type} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{type}</td>
                <td className="px-4 py-3 text-muted-foreground">{retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'security',
    title: '8. Data Security',
    content: (
      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
        <li>Passwords stored as hashes, never in plain text</li>
        <li>OAuth tokens accessible server-side only</li>
        <li>All communications encrypted via HTTPS/TLS</li>
        <li>Secure sessions with httpOnly cookies</li>
        <li>Data access restricted on a least-privilege basis</li>
        <li>Secure infrastructure via Vercel and Neon</li>
      </ul>
    ),
  },
  {
    id: 'rights',
    title: '9. Your Rights',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { right: 'Access', desc: 'Obtain a copy of your personal data' },
            { right: 'Rectification', desc: 'Correct inaccurate or incomplete data' },
            { right: 'Erasure', desc: 'Delete your account from the app settings' },
            { right: 'Portability', desc: 'Receive your data in a structured format' },
            { right: 'Objection', desc: 'Object to processing based on our legitimate interest' },
            { right: 'Restriction', desc: 'Request restriction of processing in certain cases' },
            { right: 'Withdraw consent', desc: 'Disconnect Google Calendar at any time' },
          ].map((item) => (
            <div
              key={item.right}
              className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
            >
              <p className="text-sm font-medium text-foreground">Right to {item.right.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          To exercise your rights, contact us at{' '}
          <a
            href="mailto:support@flowlineworkspace.com"
            className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
          >
            support@flowlineworkspace.com
          </a>
          . We will respond within 30 days. You also have the right to lodge a complaint with your
          national data protection authority (in France:{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
          >
            CNIL
          </a>
          ).
        </p>
      </div>
    ),
  },
  {
    id: 'cookies',
    title: '10. Cookies',
    content: (
      <p className="text-muted-foreground">
        Flowline only uses strictly necessary cookies to operate the application (maintaining your
        authentication session). We do not use any advertising, tracking, or third-party analytics
        cookies.
      </p>
    ),
  },
  {
    id: 'google-calendar',
    title: '11. Google Calendar Integration',
    content: (
      <div className="space-y-2 text-muted-foreground">
        <p>When you enable the Google Calendar integration:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Flowline requests <strong className="text-foreground">read-only</strong> access to your
            calendars via scopes{' '}
            <code className="text-xs bg-muted rounded px-1 py-0.5">calendar.readonly</code> and{' '}
            <code className="text-xs bg-muted rounded px-1 py-0.5">calendar.events.readonly</code>
          </li>
          <li>
            Flowline <strong className="text-foreground">cannot</strong> create, modify, or delete
            events in your Google Calendar
          </li>
          <li>
            Events are fetched on demand and{' '}
            <strong className="text-foreground">not permanently stored</strong> in our database
          </li>
          <li>Your OAuth token is stored securely on the server side only</li>
          <li>
            Revocable at any time from the app or directly from{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
            >
              myaccount.google.com/permissions
            </a>
          </li>
          <li>
            Disconnecting immediately removes the sync record and hides your Google events from
            Flowline
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'account-deletion',
    title: '12. Account Deletion',
    content: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          You can delete your account at any time from the app settings. Deletion will result in:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Permanent deletion of all your personal data (profile, tasks, events, timers)</li>
          <li>Revocation of all associated OAuth tokens</li>
          <li>Deletion of all Google Calendar sync data</li>
        </ul>
        <p className="text-sm font-medium text-foreground">This action is irreversible.</p>
      </div>
    ),
  },
  {
    id: 'minors',
    title: '13. Minors',
    content: (
      <p className="text-muted-foreground">
        Flowline is not intended for persons under the age of 16. If you become aware that a minor
        has provided us with personal data, please contact us at{' '}
        <a
          href="mailto:support@flowlineworkspace.com"
          className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
        >
          support@flowlineworkspace.com
        </a>
        .
      </p>
    ),
  },
  {
    id: 'changes',
    title: '14. Changes to This Policy',
    content: (
      <p className="text-muted-foreground">
        We may update this Privacy Policy from time to time. In the event of a material change, we
        will notify you by email or via an in-app notification before the changes take effect. The
        date of the last update is shown at the top of this page.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '15. Contact',
    content: (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
        <p className="text-sm font-medium text-foreground mb-1">Questions about your data?</p>
        <p className="text-sm text-muted-foreground">
          Contact us at{' '}
          <a
            href="mailto:support@flowlineworkspace.com"
            className="text-violet-600 dark:text-violet-400 underline underline-offset-2 font-medium"
          >
            support@flowlineworkspace.com
          </a>
          . We respond within 30 business days.
        </p>
      </div>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Last updated: May 25, 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            At Flowline, protecting your personal data is a priority. This policy transparently
            explains how we handle your information.
          </p>
        </div>

        <nav className="mb-12 rounded-2xl border border-border/60 bg-muted/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Table of contents
          </p>
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border/40">
                {section.title}
              </h2>
              <div className="text-sm leading-relaxed">{section.content}</div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Flowline. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}