import 'server-only'
import { sendEmail as sendEmailRaw } from './send-email'
import { PLANS, type Plan } from './stripe'

// Billing emails are a courtesy on top of the webhook's DB update, which is the
// source of truth for subscription state — a Resend outage must never turn into
// a failed webhook response (Stripe would then retry the whole event).
async function sendEmail(args: { to: string; subject: string; html: string }) {
  try {
    await sendEmailRaw(args)
  } catch (e) {
    console.error(`Failed to send billing email "${args.subject}" to ${args.to}:`, e)
  }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
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

export async function sendSubscriptionStartedEmail(to: string, plan: Plan) {
  const planName = PLANS[plan].name
  await sendEmail({
    to,
    subject: `Welcome to Flowline ${planName}`,
    html: wrapEmail(
      heading(`You're on Flowline ${planName}`) +
        paragraph(
          `Thanks for subscribing! Your account has been upgraded to <strong>${planName}</strong> and all the plan's features are unlocked right away.`,
        ) +
        button(`${appUrl()}/billing`, 'View your plan') +
        footer('You can manage or cancel your subscription anytime from your profile.'),
    ),
  })
}

export async function sendPlanChangedEmail(to: string, fromPlan: Plan, toPlan: Plan) {
  const fromName = PLANS[fromPlan].name
  const toName = PLANS[toPlan].name
  const isUpgrade = ['free', 'plus', 'pro'].indexOf(toPlan) > ['free', 'plus', 'pro'].indexOf(fromPlan)
  await sendEmail({
    to,
    subject: `Your Flowline plan changed to ${toName}`,
    html: wrapEmail(
      heading(`You're now on ${toName}`) +
        paragraph(
          `Your subscription changed from <strong>${fromName}</strong> to <strong>${toName}</strong>. ${
            isUpgrade
              ? 'The new features are available immediately.'
              : "You'll keep access to your previous plan's features until any prorated credit is used, per your invoice."
          }`,
        ) +
        button(`${appUrl()}/billing`, 'View your plan') +
        footer('Questions about billing? Just reply to this email.'),
    ),
  })
}

export async function sendCancellationScheduledEmail(to: string, plan: Plan, periodEnd: Date | null) {
  const planName = PLANS[plan].name
  const dateStr = periodEnd
    ? periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'the end of your current billing period'
  await sendEmail({
    to,
    subject: 'Your Flowline subscription is set to end',
    html: wrapEmail(
      heading('Your subscription is ending') +
        paragraph(
          `You've canceled your <strong>${planName}</strong> subscription. You'll keep full access until <strong>${dateStr}</strong> — no refund is issued for the current period, and you won't be charged again after that date. Your account will then switch to the Free plan.`,
        ) +
        button(`${appUrl()}/billing`, 'Changed your mind? Resume subscription') +
        footer("If this wasn't you, please reply to this email right away."),
    ),
  })
}

export async function sendSubscriptionResumedEmail(to: string, plan: Plan) {
  const planName = PLANS[plan].name
  await sendEmail({
    to,
    subject: 'Your Flowline subscription was resumed',
    html: wrapEmail(
      heading('Subscription resumed') +
        paragraph(
          `Good news — your <strong>${planName}</strong> subscription is no longer set to cancel. It will continue to renew as usual.`,
        ) +
        button(`${appUrl()}/billing`, 'View your plan'),
    ),
  })
}

export async function sendSubscriptionEndedEmail(to: string, plan: Plan) {
  const planName = PLANS[plan].name
  await sendEmail({
    to,
    subject: 'Your Flowline subscription has ended',
    html: wrapEmail(
      heading("You're back on the Free plan") +
        paragraph(
          `Your <strong>${planName}</strong> subscription has ended and your account is now on the Free plan. If you had more data than the Free plan allows, nothing was deleted — it's safely archived and will come back automatically if you resubscribe.`,
        ) +
        button(`${appUrl()}/billing`, 'Resubscribe') +
        footer('Thanks for having been a subscriber — we hope to see you again.'),
    ),
  })
}

export async function sendPaymentFailedEmail(to: string, plan: Plan) {
  const planName = PLANS[plan].name
  await sendEmail({
    to,
    subject: 'Payment failed for your Flowline subscription',
    html: wrapEmail(
      heading('We couldn’t process your payment') +
        paragraph(
          `Your last payment for <strong>${planName}</strong> failed. We'll automatically retry, but to avoid any interruption please make sure your payment method is up to date.`,
        ) +
        button(`${appUrl()}/billing`, 'Update payment method') +
        footer("If your payment keeps failing, your subscription may eventually be canceled and you'll move to the Free plan."),
    ),
  })
}

export async function sendTrialEndingSoonEmail(
  to: string,
  plan: Plan,
  trialEnd: Date | null,
  amount: { value: number; currency: string; interval: 'month' | 'year' } | null,
) {
  const planName = PLANS[plan].name
  const dateStr = trialEnd
    ? trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'in a few days'
  const priceStr = amount
    ? `${amount.value.toFixed(2)} ${amount.currency.toUpperCase()} per ${amount.interval}`
    : null
  await sendEmail({
    to,
    subject: `Your Flowline ${planName} trial ends soon`,
    html: wrapEmail(
      heading('Your trial is ending soon') +
        paragraph(
          `Your <strong>${planName}</strong> trial ends on <strong>${dateStr}</strong>. ${
            priceStr
              ? `After that, you'll be automatically charged <strong>${priceStr}</strong> unless you cancel before then.`
              : "After that, you'll be automatically charged unless you cancel before then."
          } No action needed if you'd like to keep your subscription.`,
        ) +
        button(`${appUrl()}/billing`, 'Manage subscription') +
        footer('You can cancel anytime before the trial ends with no charge.'),
    ),
  })
}

export async function sendPaymentReceiptEmail(
  to: string,
  plan: Plan,
  amount: { value: number; currency: string },
  invoiceUrl: string | null,
) {
  const planName = PLANS[plan].name
  const amountStr = `${amount.value.toFixed(2)} ${amount.currency.toUpperCase()}`
  await sendEmail({
    to,
    subject: `Your Flowline receipt — ${amountStr}`,
    html: wrapEmail(
      heading('Payment received') +
        paragraph(
          `We've received your payment of <strong>${amountStr}</strong> for your <strong>${planName}</strong> subscription. Thanks!`,
        ) +
        (invoiceUrl ? button(invoiceUrl, 'View & download invoice') : '') +
        footer(
          "You can find all your past invoices anytime from your subscription's billing portal.",
        ),
    ),
  })
}

export async function sendPaymentMethodUpdatedEmail(
  to: string,
  cardBrand: string | null,
  last4: string | null,
) {
  const cardLabel =
    cardBrand && last4
      ? `${cardBrand.charAt(0).toUpperCase()}${cardBrand.slice(1)} ending in ${last4}`
      : 'a new card'
  await sendEmail({
    to,
    subject: 'Your Flowline payment method was updated',
    html: wrapEmail(
      heading('Payment method updated') +
        paragraph(
          `${cardLabel} has been added to your Flowline account and will be used for future charges.`,
        ) +
        button(`${appUrl()}/billing`, 'Manage billing') +
        footer("If you didn't make this change, please reply to this email right away."),
    ),
  })
}
