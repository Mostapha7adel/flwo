import Tokens from 'csrf'
import { AppError } from '../lib/AppError.js'

const tokens = new Tokens()

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const CSRF_COOKIE = 'csrf-token'

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next()

  const secret = req.cookies?.[CSRF_COOKIE]
  const token = req.headers['x-csrf-token'] || req.body?._csrf

  if (!secret || !token) {
    return next(new AppError('طلب غير مصرح به (CSRF)', 403, 'CSRF_MISSING'))
  }

  if (!tokens.verify(secret, token)) {
    return next(new AppError('طلب غير مصرح به (CSRF)', 403, 'CSRF_INVALID'))
  }

  next()
}

export function csrfTokenMiddleware(req, res) {
  const existing = req.cookies?.[CSRF_COOKIE]
  if (existing && tokens.verify(existing, req.cookies?.[CSRF_COOKIE] || '')) {
    return res.json({ csrfToken: tokens.create(existing) })
  }
  const secret = tokens.secretSync()
  res.cookie(CSRF_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  })
  res.json({ csrfToken: tokens.create(secret) })
}
