import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getDeployment(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const deployment = await prisma.deployment.findUnique({
    where: { orderId },
    include: { server: true },
  })
  return deployment
}

export async function createDeployment(orderId, userId, data) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const existing = await prisma.deployment.findUnique({ where: { orderId } })
  if (existing) throw new AppError('يوجد نشر بالفعل لهذا الطلب', 409, 'DEPLOYMENT_EXISTS')

  const serverId = data.serverId || null
  return prisma.deployment.create({
    data: {
      orderId,
      type: data.type,
      serverId,
      domain: data.domain || null,
      sslEnabled: data.sslEnabled,
      status: 'PENDING',
    },
    include: { server: true },
  })
}

export async function triggerDeploy(id) {
  const deployment = await prisma.deployment.findUnique({ where: { id } })
  if (!deployment) throw new AppError('النشر غير موجود', 404, 'DEPLOYMENT_NOT_FOUND')

  await prisma.deployment.update({
    where: { id },
    data: { status: 'PROCESSING' },
  })

  // simulate deployment — in production this would call an actual engine
  const now = new Date()
  const logEntry = `[${now.toISOString()}] بدء النشر...\n`

  return prisma.deployment.update({
    where: { id },
    data: {
      status: 'SUCCESS',
      log: deployment.log ? deployment.log + logEntry + 'اكتمل النشر بنجاح\n' : logEntry + 'اكتمل النشر بنجاح\n',
      completedAt: new Date(),
      deployedVersion: new Date().toISOString().slice(0, 10),
    },
  })
}

export async function getDeploymentLog(id) {
  const deployment = await prisma.deployment.findUnique({
    where: { id },
    select: { log: true },
  })
  return deployment
}
