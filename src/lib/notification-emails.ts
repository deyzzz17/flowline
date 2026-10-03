import 'server-only'
import { sendEmail as sendEmailRaw } from './send-email'

// These emails are a courtesy on top of the in-app notification, which stays
// the source of truth — a Resend outage or a bad recipient address must
// never fail the underlying action (sending a request, inviting a member,
// assigning a task).
async function sendEmail(args: { to: string; subject: string; html: string }) {
  try {
    await sendEmailRaw(args)
  } catch (e) {
    console.error(`Failed to send notification email "${args.subject}" to ${args.to}:`, e)
  }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://preview-flowline.vercel.app'
}

function wrapEmail(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #111;">Flowline</span>
      </div>
      ${bodyHtml}
    </div>
  `
}

function heading(text: string): string {
  return `<h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.5;">${text}</p>`
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display: inline-block; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; text-decoration: none;">${label}</a>`
}

function footer(text: string): string {
  return `<p style="font-size: 13px; color: #999; margin: 24px 0 0; line-height: 1.5;">${text}</p>`
}

const loginUrl = () => `${appUrl()}/sign-in`

export async function sendConnectionRequestEmail(to: string, requesterName: string) {
  await sendEmail({
    to,
    subject: `${requesterName} wants to connect with you on Flowline`,
    html: wrapEmail(
      heading('New connection request') +
        paragraph(
          `<strong>${requesterName}</strong> sent you a connection request on Flowline.`,
        ) +
        button(loginUrl(), 'Log in to respond') +
        footer('You can accept or decline this request from your notifications once logged in.'),
    ),
  })
}

export async function sendListInviteEmail(to: string, listName: string, inviterName: string) {
  await sendEmail({
    to,
    subject: `${inviterName} invited you to collaborate on "${listName}"`,
    html: wrapEmail(
      heading('You were invited to a shared list') +
        paragraph(
          `<strong>${inviterName}</strong> invited you to collaborate on <strong>${listName}</strong> on Flowline.`,
        ) +
        button(loginUrl(), 'Log in to view') +
        footer('You can accept or decline this invite from your notifications once logged in.'),
    ),
  })
}

export async function sendWorkspaceInviteEmail(
  to: string,
  workspaceName: string,
  inviterName: string | null,
  roleLabel: string,
) {
  const who = inviterName ? `<strong>${inviterName}</strong>` : 'Someone'
  await sendEmail({
    to,
    subject: `${inviterName ?? 'Someone'} invited you to join "${workspaceName}" on Flowline`,
    html: wrapEmail(
      heading('Workspace invitation') +
        paragraph(
          `${who} invited you to join <strong>${workspaceName}</strong> as <strong>${roleLabel}</strong> on Flowline.`,
        ) +
        button(loginUrl(), 'Log in to respond') +
        footer('You can accept or decline this invite from your notifications once logged in.'),
    ),
  })
}

export async function sendTaskAssignmentEmail(to: string, taskTitle: string, listName: string) {
  await sendEmail({
    to,
    subject: `You were assigned a task: ${taskTitle}`,
    html: wrapEmail(
      heading('New task assigned to you') +
        paragraph(
          `You were assigned to <strong>${taskTitle}</strong> on the shared list <strong>${listName}</strong>.`,
        ) +
        button(loginUrl(), 'Log in to view') +
        footer("You're receiving this because you're a member of this shared list."),
    ),
  })
}

export async function sendCommentMentionEmail(
  to: string,
  authorName: string,
  taskTitle: string,
) {
  await sendEmail({
    to,
    subject: `${authorName} mentioned you in a comment`,
    html: wrapEmail(
      heading('You were mentioned in a comment') +
        paragraph(
          `<strong>${authorName}</strong> mentioned you in a comment on <strong>${taskTitle}</strong>.`,
        ) +
        button(loginUrl(), 'Log in to view') +
        footer("You're receiving this because you're a member of this shared list."),
    ),
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** A meeting invitation from the Workspace Calendar's scheduler, dated in the recipient's timezone. */
function formatMeetingWhen(start: Date, end: Date, timezone: string): string {
  try {
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(start)
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
    })
    return `${day}, ${time.format(start)} – ${time.format(end)}`
  } catch {
    return `${start.toUTCString()} (UTC)`
  }
}

export async function sendEventInvitationEmail(
  to: string,
  args: { title: string; inviterName: string | null; start: Date; end: Date; timezone: string },
) {
  const when = formatMeetingWhen(args.start, args.end, args.timezone)
  const who = args.inviterName ? `<strong>${escapeHtml(args.inviterName)}</strong>` : 'Someone'
  await sendEmail({
    to,
    subject: `${args.inviterName ?? 'Someone'} invited you to "${args.title}"`,
    html: wrapEmail(
      heading('Meeting invitation') +
        paragraph(
          `${who} invited you to <strong>${escapeHtml(args.title)}</strong> on ${escapeHtml(when)}.`,
        ) +
        button(loginUrl(), 'Log in to respond') +
        footer('You can accept or decline this invitation from your notifications once logged in.'),
    ),
  })
}

/** A meeting the recipient is invited to was changed by its organizer. */
export async function sendEventUpdatedEmail(
  to: string,
  args: {
    title: string
    organizerName: string | null
    start: Date
    end: Date
    timezone: string
    summary: string
    /** The time changed: the recipient is asked to answer again. */
    needsResponse: boolean
  },
) {
  const when = formatMeetingWhen(args.start, args.end, args.timezone)
  const who = args.organizerName ? `<strong>${escapeHtml(args.organizerName)}</strong>` : 'The organizer'
  await sendEmail({
    to,
    subject: `Meeting updated: "${args.title}"`,
    html: wrapEmail(
      heading('Meeting updated') +
        paragraph(
          `${who} updated <strong>${escapeHtml(args.title)}</strong> (${escapeHtml(args.summary)}). It now takes place on ${escapeHtml(when)}.`,
        ) +
        button(loginUrl(), args.needsResponse ? 'Log in to respond' : 'Open Flowline') +
        footer(
          args.needsResponse
            ? 'The time changed, so please accept or decline again from your notifications.'
            : 'No action needed — this is just to keep you informed.',
        ),
    ),
  })
}

/** A meeting the recipient was invited to was canceled (deleted). */
export async function sendEventCanceledEmail(
  to: string,
  args: { title: string; organizerName: string | null; start: Date; end: Date; timezone: string },
) {
  const when = formatMeetingWhen(args.start, args.end, args.timezone)
  const who = args.organizerName ? `<strong>${escapeHtml(args.organizerName)}</strong>` : 'The organizer'
  await sendEmail({
    to,
    subject: `Meeting canceled: "${args.title}"`,
    html: wrapEmail(
      heading('Meeting canceled') +
        paragraph(
          `${who} canceled <strong>${escapeHtml(args.title)}</strong>, which was planned on ${escapeHtml(when)}.`,
        ) +
        footer('It has been removed from your calendar.'),
    ),
  })
}
