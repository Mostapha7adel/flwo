import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'
import { prisma } from '../../config/database.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, blacklistToken } from '../../lib/jwt.js'
import { AppError } from '../../lib/AppError.js'
import { sendEmail, WELCOME } from '../../lib/email.js'
import { config } from '../../config/index.js'
import { SAFE_USER_SELECT } from '../../lib/constants.js'

const BCRYPT_ROUNDS = 12
const TIMING_DUMMY_HASH = bcrypt.hashSync('dummy-timing-attack-protection', BCRYPT_ROUNDS)

export function hashToken(token) {
  return createHmac('sha256', config.TOKEN_HASH_SECRET)
    .update(token)
    .digest('hex')
}

function parseExpires(expiresStr) {
  const match = expiresStr.match(/^(\d+)([dhms])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000
  const num = parseInt(match[1])
  const unit = match[2]
  const mul = { d: 86400000, h: 3600000, m: 60000, s: 1000 }
  return num * (mul[unit] || 86400000)
}

async function createTokenPair(userId, role) {
  const accessToken = signAccessToken(userId, role)
  const refreshToken = signRefreshToken(userId)
  const hashedRefresh = hashToken(refreshToken)
  const expiresAt = new Date(Date.now() + parseExpires(config.JWT_REFRESH_EXPIRES))
  await prisma.refreshToken.create({
    data: { token: hashedRefresh, userId, expiresAt }
  })
  return { accessToken, refreshToken }
}

export async function registerUser(data, avatarUrl = null) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
    select: { id: true }
  })
  if (existing) {
    throw new AppError('البيانات المدخلة مستخدمة بالفعل', 409, 'DUPLICATE_ENTRY')
  }
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      passwordHash,
      avatarUrl,
      role: 'CLIENT'
    },
    select: SAFE_USER_SELECT,
  })
  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  sendEmail(data.email, WELCOME(user)).catch(() => {})
  return { user, accessToken, refreshToken }
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...SAFE_USER_SELECT, passwordHash: true }
  })
  const isValid = await bcrypt.compare(password, user?.passwordHash || TIMING_DUMMY_HASH)
  if (!user || !isValid || !user.isActive) {
    throw new AppError('بيانات تسجيل الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
  }
  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  const { passwordHash, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export async function refreshUserToken(oldRefreshToken, expectClient = true) {
  if (!oldRefreshToken) throw new AppError('لم يتم توفير refresh token', 401, 'NO_REFRESH_TOKEN')
  let decoded
  try { decoded = verifyRefreshToken(oldRefreshToken) }
  catch { throw new AppError('Refresh token منتهي أو غير صحيح', 401, 'INVALID_REFRESH_TOKEN') }

  const hashedOld = hashToken(oldRefreshToken)
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashedOld } })
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.deleteMany({ where: { userId: decoded.sub } })
    throw new AppError('Refresh token غير صحيح', 401, 'REFRESH_TOKEN_REUSE')
  }
  await prisma.refreshToken.delete({ where: { token: hashedOld } })

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: SAFE_USER_SELECT,
  })
  if (!user || !user.isActive) {
    throw new AppError('بيانات تسجيل الدخول غير صحيحة', 401, 'INVALID_CREDENTIALS')
  }
  if (expectClient && user.role !== 'CLIENT') {
    throw new AppError('نوع الحساب غير متطابق', 401, 'ROLE_MISMATCH')
  }
  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role)
  const isAdmin = user.role !== 'CLIENT'
  return { user, accessToken, refreshToken, isAdmin }
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true }
  })
  if (!user) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) throw new AppError('كلمة المرور الحالية غير صحيحة', 401, 'INVALID_PASSWORD')
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ])
}

export async function logoutUser(userId, accessToken) {
  if (accessToken) await blacklistToken(accessToken)
  await prisma.refreshToken.deleteMany({ where: { userId } })
}
