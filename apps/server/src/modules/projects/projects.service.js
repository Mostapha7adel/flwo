import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'
import { config } from '../../config/index.js'

export async function getProject(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    include: {
      template: {
        select: {
          id: true, title: true, previewUrl: true, sourceUrl: true,
          sourceFile: true, manifest: true,
          versions: { where: { isCurrent: true }, take: 1, select: { version: true } },
        },
      },
    },
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

  const currentVersion = await prisma.templateVersion.findFirst({
    where: { templateId, isCurrent: true },
    select: { version: true },
  })

  return prisma.customerProject.create({
    data: {
      orderId, userId, templateId, config: {},
      currentVersion: currentVersion?.version || null,
    },
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
    include: { template: { select: { id: true, title: true, previewUrl: true, manifest: true } } },
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

export async function getSourceFile(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    include: { template: { select: { id: true, title: true, sourceFile: true, sourceUrl: true } } },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')

  const template = project.template
  if (!template.sourceFile) throw new AppError('ملف المصدر غير متاح', 404, 'SOURCE_NOT_FOUND')

  return { filePath: template.sourceFile, templateTitle: template.title }
}

export async function checkForUpdate(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    select: { currentVersion: true },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')

  const orderWithTemplate = await prisma.order.findUnique({
    where: { id: orderId },
    select: { templateId: true },
  })

  const latest = await prisma.templateVersion.findFirst({
    where: { templateId: orderWithTemplate.templateId, channel: 'stable' },
    orderBy: { createdAt: 'desc' },
    select: { version: true, changelog: true, createdAt: true },
  })

  if (!latest) return { updateAvailable: false, currentVersion: project.currentVersion, latestVersion: null }

  const updateAvailable = project.currentVersion !== latest.version

  return {
    updateAvailable,
    currentVersion: project.currentVersion,
    latestVersion: latest.version,
    changelog: latest.changelog,
    releasedAt: latest.createdAt,
  }
}

export async function applyTemplateUpdate(orderId, userId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, templateId: true },
  })
  if (!order) throw new AppError('الطلب غير موجود', 404, 'ORDER_NOT_FOUND')
  if (order.userId !== userId) throw new AppError('ليس لديك صلاحية', 403, 'FORBIDDEN')

  const latest = await prisma.templateVersion.findFirst({
    where: { templateId: order.templateId, channel: 'stable' },
    orderBy: { createdAt: 'desc' },
    select: { version: true },
  })
  if (!latest) throw new AppError('لا توجد إصدارات متاحة', 404, 'NO_VERSIONS')

  const project = await prisma.customerProject.findUnique({
    where: { orderId },
    select: { id: true, currentVersion: true },
  })
  if (!project) throw new AppError('المشروع غير موجود', 404, 'PROJECT_NOT_FOUND')
  if (project.currentVersion === latest.version) throw new AppError('المشروع بالفعل على أحدث إصدار', 400, 'ALREADY_UPDATED')

  return prisma.customerProject.update({
    where: { id: project.id },
    data: { currentVersion: latest.version, updateStatus: 'up_to_date', availableVersion: null },
    include: { template: { select: { id: true, title: true } } },
  })
}

export async function generatePreviewUrl(orderId, userId) {
  const project = await getProject(orderId, userId)
  const baseUrl = config.FRONTEND_URL || ''
  const params = new URLSearchParams({ config: JSON.stringify(project.config) })
  return `${baseUrl}/api/preview/${project.templateId}?${params.toString()}`
}
