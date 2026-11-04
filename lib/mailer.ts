import nodemailer from 'nodemailer'

export const mailEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

let transport: ReturnType<typeof nodemailer.createTransport> | undefined

export async function sendMail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transport.sendMail({ from: process.env.SMTP_FROM ?? `Redline <${process.env.SMTP_USER}>`, to, subject, text, html })
}

function template(name: string, message: string, label: string, url: string) {
  const safeName = name.replace(/[<>&"]/g, '')
  return {
    text: `Hi ${safeName}, ${message}: ${url}`,
    html: `<div style="background:#0b0b0d;padding:32px;font-family:Arial,sans-serif;color:#fff"><h1 style="margin:0 0 16px;font-style:italic"><span>RED</span><span style="color:#ed1b24">LINE</span></h1><p>Hi ${safeName}, ${message}.</p><p><a href="${url}" style="display:inline-block;background:#ed1b24;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold">${label}</a></p><p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p></div>`,
  }
}

export function verificationEmail(name: string, url: string) {
  return { subject: 'Verify your Redline email', ...template(name, 'confirm your email to start making picks', 'Verify email', url) }
}

export function resetPasswordEmail(name: string, url: string) {
  return { subject: 'Reset your Redline password', ...template(name, 'use this link to choose a new password (valid for 1 hour)', 'Reset password', url) }
}
