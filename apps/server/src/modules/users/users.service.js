import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function updateProfile(userId, data, avatarUrl) {
  const updateData = { ...data }
  if (avatarUrl) updateData.avatarUrl = avatarUrl

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatarUrl: true }
  })

  return user
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true }
  })
  if (!user) throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND')
  return user
}
