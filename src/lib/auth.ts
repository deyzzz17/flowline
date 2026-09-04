import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from 'better-auth/plugins/organization/access'
import { Pool } from 'pg'
import { sendEmail } from './send-email'

// Custom 4th role: a hard read-only ceiling. Reuses the exact same
// owner/admin/member access-control objects Better Auth ships by default —
// passing a `roles` option at all REPLACES the plugin's internal default
// role map rather than merging into it, so all 3 must be re-declared
// alongside "viewer" or owner/admin would silently lose their permissions.
const workspaceAc = createAccessControl(defaultStatements)
const viewerAc = workspaceAc.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: [],
})

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Flowline password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 20px; font-weight: 700; color: #111;">Flowline</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">
              Reset your password
            </h1>
            <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.5;">
              We received a request to reset the password for your Flowline account.
              Click the button below to choose a new password.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${url}"
              style="display: inline-block; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
              Reset password
            </a>
            <p style="font-size: 13px; color: #999; margin: 24px 0 0; line-height: 1.5;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will not be changed.<br/>
              This link will expire in 1 hour.
            </p>
          </div>
        `,
      })
    },
  },
  emailVerification: {
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Flowline email address',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 20px; font-weight: 700; color: #111;">Flowline</span>
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">
              Verify your email address
            </h1>
            <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.5;">
              Click the button below to verify your email address for your Flowline account.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${url}"
              style="display: inline-block; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
              Verify email address
            </a>
            <p style="font-size: 13px; color: #999; margin: 24px 0 0; line-height: 1.5;">
              If you didn't request this, you can safely ignore this email.<br/>
              This link will expire in 1 hour.
            </p>
          </div>
        `,
      })
    },
    autoSignInAfterVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'UTC',
      },
      stripeCustomerId: {
        type: 'string',
        required: false,
        input: false,
      },
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'free',
        input: false,
      },
      subscriptionStatus: {
        type: 'string',
        required: false,
        input: false,
      },
      subscriptionId: {
        type: 'string',
        required: false,
        input: false,
      },
      trialEndsAt: {
        type: 'date',
        required: false,
        input: false,
      },
      hadPlusTrial: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      hadProTrial: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      prompt: 'consent',
      accessType: 'offline',
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
    },
  },
  plugins: [
    // Non-Personal workspaces are Better Auth organizations — Personal itself
    // is not an organization (it's implicit: no active organization means
    // Personal). owner/admin/member are Better Auth's defaults; viewer is a
    // custom read-only role. Passing `roles` here REPLACES Better Auth's
    // internal default role map rather than merging into it, so owner/admin/
    // member must be re-declared alongside viewer or they'd lose their ACs.
    organization({
      schema: {
        member: {
          additionalFields: {
            // A per-workspace display-name override — a member can set their
            // own, distinct from their global account name. Self-editable
            // only (enforced in updateMyWorkspaceNickname, not by Better Auth
            // itself — it has no concept of this field beyond storing it).
            nickname: { type: 'string', required: false },
          },
        },
      },
      roles: {
        owner: ownerAc,
        admin: adminAc,
        member: memberAc,
        viewer: viewerAc,
      },
    }),
    // Must be last: forwards Set-Cookie headers from direct `auth.api.*()`
    // calls (e.g. in server actions) into Next.js's real cookies() API —
    // without it, mutations like setActiveOrganization update the DB but
    // never actually reach the browser's session cookie.
    nextCookies(),
  ],
})
