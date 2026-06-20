import path from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'
import { success, created, paginated } from '../../lib/response.js'
import * as templatesService from './templates.service.js'
import { getPagination } from '../../lib/pagination.js'
import { toPublicUrl } from '../../middleware/upload.js'
import { AppError } from '../../lib/AppError.js'
import { parseManifest, applyManifest } from './manifest.service.js'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

export async function uploadPreviewZip(req, res, next) {
  try {
    if (!req.file) throw new AppError('ملف ZIP مطلوب', 400, 'FILE_REQUIRED')

    const previewDir = path.resolve(__dirname, '../../../uploads/templates-preview', req.params.id)
    if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true })

    const zip = new AdmZip(req.file.path)
    zip.extractAllTo(previewDir, true)

    const expectedPath = path.join(previewDir, 'index.html')
    if (!fs.existsSync(expectedPath)) {
      fs.rmSync(previewDir, { recursive: true, force: true })
      throw new AppError('الملف المضغوط يجب أن يحتوي على index.html في الجذر', 400, 'MISSING_INDEX_HTML')
    }

    const previewUrl = `/uploads/templates-preview/${req.params.id}/index.html`
    await templatesService.updateTemplate(req.params.id, {}, previewUrl)

    fs.unlinkSync(req.file.path)
    success(res, { previewUrl }, 'تم رفع وفك ضغط ملف القالب')
  } catch (err) { next(err) }
}
