import { prisma } from '../../config/database.js'
import { logger } from '../../lib/logger.js'

const FIELD_TYPE_MAP = {
  text: 'text',
  color: 'color',
  image: 'image',
  boolean: 'boolean',
  select: 'select',
  number: 'text',
  email: 'text',
  url: 'text',
  textarea: 'text',
}

export function parseManifest(content) {
  let parsed
  if (typeof content === 'string') {
    try { parsed = JSON.parse(content) } catch { throw new Error('manifest.json contains invalid JSON') }
  } else {
    parsed = content
  }

  if (!parsed.name && !parsed.version) {
    throw new Error('manifest.json must contain "name" and "version"')
  }

  return {
    name: parsed.name || '',
    version: parsed.version || '1.0.0',
    type: parsed.type || null,
    framework: parsed.framework || null,
    deployment: parsed.deployment || null,
    customizable: parsed.customizable !== false,
    fields: Array.isArray(parsed.fields) ? parsed.fields : [],
  }
}

export async function applyManifest(templateId, manifest) {
  const { type, framework, deployment, fields } = manifest

  const updateData = {}
  if (type) updateData.templateType = type
  if (framework) updateData.framework = framework
  if (deployment) updateData.deploymentType = deployment

  if (Object.keys(updateData).length > 0) {
    await prisma.template.update({ where: { id: templateId }, data: updateData })
  }

  const existing = await prisma.templateField.findMany({ where: { templateId }, select: { key: true } })
  const existingKeys = new Set(existing.map(f => f.key))

  if (fields.length > 0) {
    const toCreate = fields
      .filter(f => !existingKeys.has(f.key || f.name))
      .map((f, i) => ({
        templateId,
        key: f.key || f.name,
        label: f.label || f.name || f.key,
        type: FIELD_TYPE_MAP[f.type] || 'text',
        required: f.required === true,
        defaultValue: f.defaultValue != null ? String(f.defaultValue) : null,
        options: Array.isArray(f.options) ? f.options : [],
        sortOrder: i,
      }))

    if (toCreate.length > 0) {
      await prisma.templateField.createMany({ data: toCreate, skipDuplicates: true })
      logger.info('Created %d fields from manifest for template %s', toCreate.length, templateId)
    }
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { manifest },
  })

  return manifest
}
