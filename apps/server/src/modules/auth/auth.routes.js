import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/auth.js'
import { uploadAvatar, validateFileContent } from '../../middleware/upload.js'
import { loginLimiter, registerLimiter, refreshLimiter, passwordChangeLimiter } from '../../middleware/rateLimiter.js'
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schema.js'
import * as ctrl from './auth.controller.js'

const router = Router()

router.post('/register', registerLimiter, uploadAvatar, validateFileContent, validate(registerSchema), ctrl.register)
router.post('/login', loginLimiter, validate(loginSchema), ctrl.login)
router.post('/refresh', refreshLimiter, ctrl.refresh)
router.post('/logout', authenticate, ctrl.logout)
router.get('/me', authenticate, ctrl.getMe)
router.put('/change-password', authenticate, passwordChangeLimiter, validate(changePasswordSchema), ctrl.changePassword)

export default router
