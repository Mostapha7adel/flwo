import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getVersions(templateId, page = 1, limit = 20) {
  const [versions, total] = await Promise.all([
    prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.templateVersion.count({ where: { templateId } }),
  ])
  return { versions, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getVersion(id) {
  const version = await prisma.templateVersion.findUnique({ where: { id } })
  if (!version) throw new AppError('الإصدار غير موجود', 404, 'VERSION_NOT_FOUND')
  return version
}

export async function createVersion(templateId, data) {
  if (data.isCurrent) {
    await prisma.templateVersion.updateMany({
      where: { templateId, isCurrent: true },
      data: { isCurrent: false },
    })
  }
  const version = await prisma.templateVersion.create({
    data: { ...data, templateId },
  })
  return version
}

export async function setCurrentVersion(id, templateId) {
  const version = await prisma.templateVersion.findUnique({ where: { id } })
  if (!version) throw new AppError('الإصدار غير موجود', 404, 'VERSION_NOT_FOUND')

  await prisma.templateVersion.updateMany({
    where: { templateId, isCurrent: true },
    data: { isCurrent: false },
  })
  return prisma.templateVersion.update({
    where: { id },
    data: { isCurrent: true },
  })
}

export async function deleteVersion(id) {
  const version = await prisma.templateVersion.findUnique({
    where: { id },
    select: { id: true, templateId: true },
  })
  if (!version) throw new AppError('الإصدار غير موجود', 404, 'VERSION_NOT_FOUND')

  const count = await prisma.templateVersion.count({
    where: { templateId: version.templateId },
  })
  if (count <= 1) throw new AppError('لا يمكن حذف الإصدار الوحيد', 400, 'LAST_VERSION')

  await prisma.templateVersion.delete({ where: { id } })
}
