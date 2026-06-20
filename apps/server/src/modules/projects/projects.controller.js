import { success, created } from '../../lib/response.js'
import * as projectsService from './projects.service.js'
import path from 'path'
import fs from 'fs'

export async function get(req, res, next) {
  try {
    const project = await projectsService.getProject(req.params.orderId, req.user.id)
    success(res, project)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const project = await projectsService.createProject(req.params.orderId, req.user.id, req.body.templateId)
    created(res, project)
  } catch (err) { next(err) }
}

export async function updateConfig(req, res, next) {
  try {
    const project = await projectsService.updateConfig(req.params.orderId, req.user.id, req.validatedData.config)
    success(res, project)
  } catch (err) { next(err) }
}

export async function updateUrls(req, res, next) {
  try {
    const project = await projectsService.updateUrls(req.params.orderId, req.user.id, req.validatedData)
    success(res, project)
  } catch (err) { next(err) }
}

export async function downloadSource(req, res, next) {
  try {
    const { filePath, templateTitle } = await projectsService.getSourceFile(req.params.orderId, req.user.id)
    const basename = path.basename(filePath)
    const downloadName = `${templateTitle.replace(/\s+/g, '-')}-source${path.extname(basename)}`
    if (!fs.existsSync(filePath)) {
      return success(res, null, 'ملف المصدر غير متاح', 404)
    }
    res.download(filePath, downloadName)
  } catch (err) { next(err) }
}

export async function checkUpdate(req, res, next) {
  try {
    const result = await projectsService.checkForUpdate(req.params.orderId, req.user.id)
    success(res, result)
  } catch (err) { next(err) }
}

export async function applyUpdate(req, res, next) {
  try {
    const project = await projectsService.applyTemplateUpdate(req.params.orderId, req.user.id)
    success(res, project, 'تم تحديث المشروع')
  } catch (err) { next(err) }
}

export async function getPreviewUrl(req, res, next) {
  try {
    const url = await projectsService.generatePreviewUrl(req.params.orderId, req.user.id)
    success(res, { previewUrl: url })
  } catch (err) { next(err) }
}
