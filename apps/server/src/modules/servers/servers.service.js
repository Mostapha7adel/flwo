import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getUserServers(userId) {
  return prisma.server.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getServer(id, userId) {
  const server = await prisma.server.findFirst({
    where: { id, userId },
  })
  if (!server) throw new AppError('السيرفر غير موجود', 404, 'SERVER_NOT_FOUND')
  return server
}

export async function createServer(userId, data) {
  return prisma.server.create({
    data: { ...data, userId },
  })
}

export async function updateServer(id, userId, data) {
  const server = await prisma.server.findFirst({ where: { id, userId } })
  if (!server) throw new AppError('السيرفر غير موجود', 404, 'SERVER_NOT_FOUND')

  return prisma.server.update({
    where: { id },
    data,
  })
}

export async function deleteServer(id, userId) {
  const server = await prisma.server.findFirst({ where: { id, userId } })
  if (!server) throw new AppError('السيرفر غير موجود', 404, 'SERVER_NOT_FOUND')

  await prisma.server.delete({ where: { id } })
}
