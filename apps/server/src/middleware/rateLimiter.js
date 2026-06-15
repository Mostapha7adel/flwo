import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../config/redis.js'

function createStore(prefix) {
  if (process.env.NODE_ENV === 'production' && redis?.status === 'ready') {
    try { return new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args) => redis.call(...args) }) }
    catch { return undefined }
  }
  return undefined
}

function makeLimit({ prefix, windowMs, max, skipSuccess = false, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccess,
    message: { error: message, code: prefix.toUpperCase() + '_RATE_LIMIT' },
    store: createStore(prefix),
  })
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'عدد كبير جداً من الطلبات، حاول بعد 15 دقيقة', code: 'RATE_LIMIT_EXCEEDED' }
})

export const loginLimiter = makeLimit({
  prefix: 'login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccess: true,
  message: 'تجاوزت الحد المسموح، حاول بعد 15 دقيقة',
})

export const adminLoginLimiter = makeLimit({
  prefix: 'admin-login',
  windowMs: 30 * 60 * 1000,
  max: 5,
  skipSuccess: false,
  message: 'تجاوزت حد محاولات دخول الأدمن، حاول بعد 30 دقيقة',
})

export const registerLimiter = makeLimit({
  prefix: 'register',
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 3 : 50,
  message: 'حد التسجيل، حاول بعد ساعة',
})

export const uploadLimiter = makeLimit({
  prefix: 'upload',
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'حد الرفع، حاول بعد ساعة',
})

export const refreshLimiter = makeLimit({
  prefix: 'refresh',
  windowMs: 60 * 1000,
  max: 10,
  message: 'عدد كبير جداً من طلبات التحديث',
})

export const passwordChangeLimiter = makeLimit({
  prefix: 'pwd-change',
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipSuccess: false,
  message: 'تجاوزت حد تغيير كلمة المرور، حاول بعد ساعة',
})

export const contactLimiter = makeLimit({
  prefix: 'contact',
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'تجاوزت الحد المسموح للرسائل، حاول بعد ساعة',
})

export const orderLimiter = makeLimit({
  prefix: 'order',
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'تجاوزت الحد المسموح لإنشاء الطلبات، حاول بعد ساعة',
})

export const chatLimiter = makeLimit({
  prefix: 'chat',
  windowMs: 60 * 1000,
  max: 30,
  message: 'تجاوزت الحد المسموح لإرسال الرسائل',
})
