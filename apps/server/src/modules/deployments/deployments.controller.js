import { success, created } from '../../lib/response.js'
import * as deploymentsService from './deployments.service.js'

export async function getStatus(req, res, next) {
  try {
    const deployment = await deploymentsService.getDeployment(req.params.orderId, req.user.id)
    success(res, deployment)
  } catch (err) { next(err) }
}

export async function create(req, res, next) {
  try {
    const deployment = await deploymentsService.createDeployment(req.params.orderId, req.user.id, req.validatedData)
    created(res, deployment)
  } catch (err) { next(err) }
}

export async function trigger(req, res, next) {
  try {
    const deployment = await deploymentsService.getDeployment(req.params.orderId, req.user.id)
    const result = await deploymentsService.triggerDeploy(deployment.id)
    success(res, result)
  } catch (err) { next(err) }
}

export async function getLog(req, res, next) {
  try {
    const deployment = await deploymentsService.getDeployment(req.params.orderId, req.user.id)
    success(res, { log: deployment?.log })
  } catch (err) { next(err) }
}
