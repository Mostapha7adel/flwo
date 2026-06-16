/**
 * AI Service — Chatbot reply generator
 *
 * بتحضير البنية لربط API ذكاء اصطناعي خارجي (OpenAI, etc.)
 * دلوقتي شغال بردود تلقائية ثابتة.
 * عشان تربط API حقيقي، غير محتوى الفنكشن generateReply.
 */

const BOT_REPLIES = [
  'شكراً لتواصلك مع فريق الدعم! تم استلام رسالتك وسيتم الرد عليك في أقرب وقت ممكن.',
  'نقوم بمراجعة طلبك حالياً، أحد ممثلي الدعم سيتواصل معك قريباً.',
  'شكراً لصبرك! فريقنا يتابع استفسارك وسنعود إليك قريباً.',
  'تم إشعار فريق الدعم برسالتك. في حالة وجود استفسار إضافي، يمكنك كتابته هنا.',
  'نقدر تواصلك! أحد أعضاء الفريق سيرد عليك خلال 24 ساعة كحد أقصى.',
]

/**
 * يولد رد تلقائي بناءً على سياق المحادثة
 * @param {Object} context - { messageHistory, clientName, orderInfo }
 * @returns {Promise<string>}
 */
export async function generateReply(context) {
  // -------------------------------------------------------
  // TODO: استبدل ده بـ API حقيقي زي OpenAI
  // example:
  //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  //   const res = await openai.chat.completions.create({
  //     model: 'gpt-4',
  //     messages: [{ role: 'system', content: 'أنت مساعد دعم...' }, ...context.messageHistory],
  //   })
  //   return res.choices[0].message.content
  // -------------------------------------------------------

  return BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]
}
