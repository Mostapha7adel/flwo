import nodemailer from 'nodemailer'
import { config } from '../config/index.js'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    console.warn('⚠️ SMTP not configured - email sending disabled')
    return null
  }
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  })
  return transporter
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter()
  if (!t) return false
  try {
    await t.sendMail({ from: config.MAIL_FROM, to, subject, html })
    return true
  } catch (err) {
    console.error('❌ Email send failed:', err.message)
    return false
  }
}

export function sendContactReplyEmail(to, name, replyContent, originalSubject) {
  return sendEmail({
    to,
    subject: `تم الرد على رسالتك - ${originalSubject}`,
    html: `
      <div style="font-family: 'Cairo', sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #f59e0b); padding: 2px; border-radius: 16px;">
          <div style="background: #fff; border-radius: 14px; padding: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px;">مرحباً ${name} 👋</h2>
            <p style="color: #6b7280; line-height: 1.8;">تم الرد على رسالتك بخصوص "${originalSubject}"</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <p style="color: #374151; margin: 0; line-height: 1.8;">${replyContent}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">يمكنك متابعة حالة رسالتك من لوحة التحكم الخاصة بك.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">فريق DesignFlow</p>
          </div>
        </div>
      </div>
    `
  })
}

export function sendChatNotificationEmail(to, clientName, messageContent, orderNumber) {
  return sendEmail({
    to,
    subject: `رسالة جديدة من الدعم الفني - طلب #${orderNumber}`,
    html: `
      <div style="font-family: 'Cairo', sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #f59e0b); padding: 2px; border-radius: 16px;">
          <div style="background: #fff; border-radius: 14px; padding: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px;">مرحباً ${clientName} 👋</h2>
            <p style="color: #6b7280; line-height: 1.8;">لديك رسالة جديدة من فريق الدعم الفني بخصوص طلبك #${orderNumber}</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <p style="color: #374151; margin: 0; line-height: 1.8;">${messageContent}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">يمكنك الرد مباشرة من صفحة المحادثة في لوحة التحكم.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">فريق DesignFlow</p>
          </div>
        </div>
      </div>
    `
  })
}
