import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getAssets(templateId, type) {
  return prisma.templateAsset.findMany({
    where: { templateId, ...(type && { type }) },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createAsset(templateId, data) {
  return prisma.templateAsset.create({ data: { ...data, templateId } })
}

export async function deleteAsset(id) {
  const asset = await prisma.templateAsset.findUnique({ where: { id } })
  if (!asset) throw new AppError('الأصل غير موجود', 404, 'ASSET_NOT_FOUND')

  await prisma.templateAsset.delete({ where: { id } })
}
