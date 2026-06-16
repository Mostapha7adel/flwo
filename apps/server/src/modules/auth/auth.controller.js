import * as authService from './auth.service.js'
import { config } from '../../config/index.js'
import { toPublicUrl } from '../../middleware/upload.js'

function parseExpires(expiresStr) {
  const match = expiresStr.match(/^(\d+)([dhms])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const num = parseInt(match[1])
  const unit = match[2]
  const mul = { d: 86400000, h: 3600000, m: 60000, s: 1000 }
  return num * (mul[unit] || 86400000)
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: parseExpires(config.JWT_REFRESH_EXPIRES),
  path: '/api/auth/refresh'
}

export async function register(req, res, next) {
  try {
    const avatarUrl = toPublicUrl(req.file?.path) || null
    const { user, accessToken, refreshToken } = await authService.registerUser(req.validatedData, avatarUrl)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.status(201).json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedData
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function refresh(req, res, next) {
  try {
    const oldToken = req.cookies.refresh_token
    const { user, accessToken, refreshToken } = await authService.refreshUserToken(oldToken)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ user, accessToken })
  } catch (err) { next(err) }
}

export async function logout(req, res, next) {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1]
    await authService.logoutUser(req.user.id, accessToken)
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
    res.json({ message: 'تم تسجيل الخروج بنجاح' })
  } catch (err) { next(err) }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validatedData
    await authService.changeUserPassword(req.user.id, currentPassword, newPassword)
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' })
  } catch (err) { next(err) }
}

export async function getMe(req, res) {
  res.json({ user: req.user })
}
