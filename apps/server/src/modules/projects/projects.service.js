import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getProject(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    include: { template: { select: { id: true, title: true, previewUrl: true } } },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')
  return project
}

export async function createProject(orderId, userId, templateId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')
  if (order.status !== 'COMPLETED') throw new AppError('الطلب لم يكتمل بعد', 400, 'ORDER_NOT_COMPLETED')

  const existing = await prisma.customerProject.findUnique({ where: { orderId } })
  if (existing) throw new AppError('المشروع موجود بالفعل', 409, 'PROJECT_EXISTS')

  return prisma.customerProject.create({
    data: { orderId, userId, templateId, config: {} },
    include: { template: { select: { id: true, title: true, previewUrl: true } } },
  })
}

export async function updateConfig(orderId, userId, config) {
  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    select: { id: true, userId: true },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')
  if (project.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  return prisma.customerProject.update({
    where: { id: project.id },
    data: { config },
    include: { template: { select: { id: true, title: true, previewUrl: true } } },
  })
}

export async function updateUrls(orderId, userId, data) {
  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    select: { id: true, userId: true },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')
  if (project.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  return prisma.customerProject.update({
    where: { id: project.id },
    data,
    include: { template: { select: { id: true, title: true, previewUrl: true } } },
  })
}
