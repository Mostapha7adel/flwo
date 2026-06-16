import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { chatLimiter } from '../../middleware/rateLimiter.js'
import { sendMessageSchema } from './chat.schema.js'
import * as ctrl from './chat.controller.js'

const router = Router()

const getConversationSchema = z.object({ orderId: z.string().min(1) })

router.use(authenticate)
router.get('/conversation', validate(getConversationSchema, 'query'), ctrl.getConversation)
router.get('/direct/:clientId', ctrl.getDirectConversation)
router.post('/direct', validate(z.object({ clientId: z.string().min(1), title: z.string().optional() })), ctrl.createDirectConversation)
router.get('/my', ctrl.getClientConversations)
router.get('/conversation/:conversationId/messages', ctrl.getMessages)
router.post('/conversation/:conversationId/messages', chatLimiter, validate(sendMessageSchema), ctrl.sendMessage)

export default router
