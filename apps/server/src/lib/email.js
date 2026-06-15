export async function sendEmail(to, payload) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Email to ${to}:`, payload.subject)
    return
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Templyn" <${process.env.SMTP_FROM || 'noreply@templyn.com'}>`,
    to,
    subject: payload.subject,
    html: payload.html,
  })
}

export function ORDER_CONFIRMED(order) {
  return {
    subject: `تم تأكيد الطلب #${order.id.slice(0, 8)}`,
    html: `<h1>مرحباً ${order.user.firstName}</h1><p>تم تأكيد طلب القالب "${order.template.title}"</p>`
  }
}

export function ORDER_STATUS_CHANGED(order, newStatus) {
  return {
    subject: `تحديث الطلب #${order.id.slice(0, 8)}`,
    html: `<h1>حالة الطلب</h1><p>تم تحديث حالة الطلب إلى: ${newStatus}</p>`
  }
}

export function WELCOME(user) {
  return {
    subject: 'مرحباً بك في Templyn',
    html: `<h1>مرحباً ${user.firstName}</h1><p>شكراً لانضمامك إلينا!</p>`
  }
}
