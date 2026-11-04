import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { mailEnabled, sendMail, resetPasswordEmail, verificationEmail } from '@/lib/mailer'

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true, requireEmailVerification: mailEnabled,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({ to: user.email, ...resetPasswordEmail(user.name, url) })
    },
  },
  emailVerification: {
    sendOnSignUp: mailEnabled,
    sendOnSignIn: mailEnabled,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({ to: user.email, ...verificationEmail(user.name, url) })
    },
  },
  trustedOrigins: [...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []), ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []), ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : [])],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
