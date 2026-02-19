import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const FROM = process.env.SMTP_FROM ?? 'noreply@peoplewelike.club'
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'

export async function sendRegistrationEmail(opts: { to: string; username: string; pincode: string }) {
  const cardUrl = `${BASE}/more/${opts.username}`
  const loginUrl = `${BASE}/more/${opts.username}/login`
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: 'Your PeopleWeLike digital card is ready',
    text: `Your card is live!\n\nPublic URL: ${cardUrl}\nLogin: ${loginUrl}\nPincode: ${opts.pincode}`,
    html: `<p>Your card is live!</p><p><a href="${cardUrl}">${cardUrl}</a></p><p>Login: <a href="${loginUrl}">${loginUrl}</a></p><p>Pincode: ${opts.pincode}</p>`,
  })
}

export async function sendResetEmail(opts: { to: string; username: string; token: string }) {
  const resetUrl = `${BASE}/more/${opts.username}/reset/${opts.token}`
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: 'Reset your PeopleWeLike card pincode',
    text: `Reset link (expires 30 min): ${resetUrl}`,
    html: `<p>Reset: <a href="${resetUrl}">${resetUrl}</a></p><p>Expires in 30 minutes.</p>`,
  })
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  await transporter.sendMail({
    from: FROM, to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
}
