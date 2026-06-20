import { success, created, paginated } from '../../lib/response.js'
import { getPagination } from '../../lib/pagination.js'
import * as service from './serverPlans.service.js'

export async function listActivePlans(req, res, next) {
  try {
    const plans = await service.getActivePlans()
    success(res, plans)
  } catch (err) { next(err) }
}

export async function getAllPlans(req, res, next) {
  try {
    const plans = await service.getAllPlans()
    success(res, plans)
  } catch (err) { next(err) }
}

export async function getPlanById(req, res, next) {
  try {
    const plan = await service.getPlanById(req.params.id)
    success(res, plan)
  } catch (err) { next(err) }
}

export async function createPlan(req, res, next) {
  try {
    const plan = await service.createPlan(req.validatedData)
    created(res, plan)
  } catch (err) { next(err) }
}

export async function updatePlan(req, res, next) {
  try {
    const plan = await service.updatePlan(req.params.id, req.validatedData)
    success(res, plan)
  } catch (err) { next(err) }
}

export async function deletePlan(req, res, next) {
  try {
    await service.deletePlan(req.params.id)
    success(res, null, 'تم حذف الباقة')
  } catch (err) { next(err) }
}

export async function listUserSubscriptions(req, res, next) {
  try {
    const subs = await service.getUserSubscriptions(req.user.id)
    success(res, subs)
  } catch (err) { next(err) }
}

export async function createSubscription(req, res, next) {
  try {
    const sub = await service.createSubscription(req.user.id, req.validatedData)
    created(res, sub)
  } catch (err) { next(err) }
}

export async function getAllSubscriptions(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await service.getAllSubscriptions({ page, limit })
    paginated(res, result.subscriptions, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function updateSubscription(req, res, next) {
  try {
    const sub = await service.updateSubscription(req.params.id, req.validatedData)
    success(res, sub)
  } catch (err) { next(err) }
}
