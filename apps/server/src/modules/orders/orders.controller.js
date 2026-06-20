import { success, created, paginated } from '../../lib/response.js'
import * as ordersService from './orders.service.js'
import { getPagination } from '../../lib/pagination.js'

export async function create(req, res, next) {
  try {
    const order = await ordersService.createOrder(req.user.id, req.validatedData)
    created(res, order)
  } catch (err) { next(err) }
}

export async function list(req, res, next) {
  try {
    const { page, limit } = getPagination(req.query)
    const result = await ordersService.getUserOrders(req.user.id, { page, limit })
    paginated(res, { orders: result.orders, page: result.page, totalPages: result.totalPages }, result.total, result.page, limit)
  } catch (err) { next(err) }
}

export async function getById(req, res, next) {
  try {
    const order = await ordersService.getOrderById(req.params.id, req.user.id)
    success(res, order)
  } catch (err) { next(err) }
}

export async function cancel(req, res, next) {
  try {
    const order = await ordersService.cancelOrder(req.params.id, req.user.id)
    success(res, order)
  } catch (err) { next(err) }
}
