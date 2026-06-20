import { success, created } from '../../lib/response.js'
import * as projectsService from './projects.service.js'

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
