import { prisma } from '../../config/database.js'
import { AppError } from '../../lib/AppError.js'

export async function getFields(templateId) {
  return prisma.templateField.findMany({
    where: { templateId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createField(templateId, data) {
  const existing = await prisma.templateField.findUnique({
    where: { templateId_key: { templateId, key: data.key } },
  })
  if (existing) throw new AppError('الحقل موجود بالفعل', 409, 'FIELD_EXISTS')

  return prisma.templateField.create({
    data: { ...data, templateId },
  })
}

export async function updateField(id, data) {
  const field = await prisma.templateField.findUnique({ where: { id } })
  if (!field) throw new AppError('الحقل غير موجود', 404, 'FIELD_NOT_FOUND')

  return prisma.templateField.update({ where: { id }, data })
}

export async function deleteField(id) {
  const field = await prisma.templateField.findUnique({ where: { id } })
  if (!field) throw new AppError('الحقل غير موجود', 404, 'FIELD_NOT_FOUND')

  await prisma.templateField.delete({ where: { id } })
}

export async function reorderFields(templateId, orderedIds) {
  const fields = await prisma.templateField.findMany({ where: { templateId }, select: { id: true } })
  const validIds = new Set(fields.map(f => f.id))
  const unknown = orderedIds.filter(id => !validIds.has(id))
  if (unknown.length > 0) throw new AppError('بعض الحقول غير موجودة', 400, 'INVALID_IDS')

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.templateField.update({ where: { id }, data: { sortOrder: index } })
    )
  )
}
