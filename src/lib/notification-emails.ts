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
