import { success, created, paginated } from '../../lib/response.js'
import * as templatesService from './templates.service.js'
import { getPagination } from '../../lib/pagination.js'
import { toPublicUrl } from '../../middleware/upload.js'
import { parseManifest, applyManifest } from './manifest.service.js'
import fs from 'fs'

export async function listPublished(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await templatesService.getPublishedTemplates({
      category: req.query.category,
      search: req.query.search,
      sort: req.query.sort,
      page,
      limit
    })
    paginated(res, { templates: result.templates, page: result.page, totalPages: result.totalPages }, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const template = await templatesService.getTemplateById(req.params.id)
    success(res, template)
  } catch (err) { next(err) }
}

export async function getPreview(req, res, next) {
  try {
    const template = await templatesService.getTemplateForPreview(req.params.id)
    success(res, template)
  } catch (err) { next(err) }
}

export async function adminGetById(req, res, next) {
  try {
    const template = await templatesService.getTemplateById(req.params.id)
    success(res, template)
  } catch (err) { next(err) }
}

export async function adminList(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await templatesService.getAllTemplates({ page, limit })
    paginated(res, { templates: result.templates, page: result.page, totalPages: result.totalPages }, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const previewUrl = toPublicUrl(req.file?.path)
    const template = await templatesService.createTemplate(req.validatedData, previewUrl)
    if (template) created(res, template)
  } catch (err) { next(err) }
}

export async function update(req, res, next) {
  try {
    const previewUrl = toPublicUrl(req.file?.path) || null
    const template = await templatesService.updateTemplate(req.params.id, req.validatedData, previewUrl)
    success(res, template)
  } catch (err) { next(err) }
}

export async function remove(req, res, next) {
  try {
    await templatesService.deleteTemplate(req.params.id)
    success(res, null, 'تم حذف القالب بنجاح')
  } catch (err) { next(err) }
}

export async function publish(req, res, next) {
  try {
    const template = await templatesService.togglePublish(req.params.id)
    success(res, template)
  } catch (err) { next(err) }
}

export async function uploadManifestFile(req, res, next) {
  try {
    if (!req.file) throw new AppError('manifest.json مطلوب', 400, 'FILE_REQUIRED')
    const content = fs.readFileSync(req.file.path, 'utf-8')
    const manifest = parseManifest(content)
    const result = await applyManifest(req.params.id, manifest)
    fs.unlinkSync(req.file.path)
    success(res, {
      manifest: result,
      templateType: manifest.type,
      framework: manifest.framework,
      deploymentType: manifest.deployment,
      fieldsCount: manifest.fields.length,
    }, 'تم رفع وتطبيق manifest.json')
  } catch (err) { next(err) }
}

export async function uploadSourceCode(req, res, next) {
  try {
    if (!req.file) throw new AppError('ملف المصدر مطلوب', 400, 'FILE_REQUIRED')
    const sourcePath = req.file.path
    await templatesService.updateTemplate(req.params.id, {}, null, sourcePath)
    success(res, { sourceFile: toPublicUrl(sourcePath) }, 'تم رفع الكود المصدري')
  } catch (err) { next(err) }
}
