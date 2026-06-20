import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { AppError } from '../lib/AppError.js'
import { logger } from '../lib/logger.js'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

const MAGIC_BYTES = {
  'image/jpeg': { header: [0xFF, 0xD8, 0xFF], offset: 0 },
  'image/png': { header: [0x89, 0x50, 0x4E, 0x47], offset: 0 },
  'image/webp': { header: [0x52, 0x49, 0x46, 0x46], offset: 0, tail: [0x57, 0x45, 0x42, 0x50], tailOffset: 8 },
  'video/mp4': { header: [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70], offset: 0 },
  'video/webm': { header: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 },
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PERSISTENT_DIR = '/data/uploads'
const LOCAL_DIR = path.resolve(__dirname, '../../uploads')
const uploadsDir = fs.existsSync('/data') ? PERSISTENT_DIR : LOCAL_DIR

if (uploadsDir === PERSISTENT_DIR && fs.existsSync(LOCAL_DIR)) {
  try {
    const entries = fs.readdirSync(LOCAL_DIR)
    for (const entry of entries) {
      const src = path.join(LOCAL_DIR, entry)
      const dst = path.join(PERSISTENT_DIR, entry)
      if (!fs.existsSync(dst)) {
        fs.cpSync(src, dst, { recursive: true })
      }
    }
      logger.info('Migrated existing uploads to /data/uploads')
    } catch (e) {
      logger.warn(e, 'Could not migrate uploads')
    }
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

logger.info('Uploads directory: %s', uploadsDir)

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_MEDIA_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function checkExtension(filename, allowedExts) {
  const ext = path.extname(filename).toLowerCase()
  if (!allowedExts.includes(ext)) {
    throw new AppError(`امتداد الملف غير مسموح: ${ext}`, 400, 'INVALID_FILE_EXTENSION')
  }
}

function fileFilter(req, file, cb) {
  try {
    checkExtension(file.originalname, ALLOWED_IMAGE_EXTENSIONS)
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError('نوع الملف غير مسموح (فقط JPEG, PNG, WebP)', 400, 'INVALID_FILE_TYPE')
    }
    cb(null, true)
  } catch (err) { cb(err) }
}

function mediaFilter(req, file, cb) {
  try {
    checkExtension(file.originalname, ALLOWED_EXTENSIONS)
    if (!ALLOWED_MEDIA_MIMES.includes(file.mimetype)) {
      throw new AppError('نوع الملف غير مسموح (صور أو فيديو فقط)', 400, 'INVALID_FILE_TYPE')
    }
    cb(null, true)
  } catch (err) { cb(err) }
}

function makeStorage(folder) {
  const dest = path.join(uploadsDir, folder)
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
      cb(null, `${unique}${path.extname(file.originalname)}`)
    }
  })
}

export function validateFileContent(req, res, next) {
  if (!req.file) return next()
  const filePath = req.file.path
  try {
    const def = MAGIC_BYTES[req.file.mimetype]
    if (!def) return next(new AppError('نوع الملف غير معروف', 400, 'INVALID_FILE_TYPE'))

    const headerLen = def.header.length
    const tailLen = def.tail?.length || 0
    const totalLen = Math.max(headerLen, (def.tailOffset || 0) + tailLen)
    const buffer = Buffer.alloc(totalLen)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, buffer, 0, totalLen, 0)
    fs.closeSync(fd)

    const match = def.header.every((byte, i) => byte === 0 || buffer[i] === byte)
    const tailMatch = !def.tail || def.tail.every((byte, i) => byte === 0 || buffer[(def.tailOffset || 0) + i] === byte)
    if (!match || !tailMatch) {
      fs.unlinkSync(filePath)
      return next(new AppError('محتوى الملف لا يتطابق مع نوعه', 400, 'INVALID_FILE_CONTENT'))
    }
    next()
  } catch {
    next(new AppError('خطأ في التحقق من الملف', 500, 'FILE_VALIDATION_ERROR'))
  }
}

export function toPublicUrl(absolutePath) {
  if (!absolutePath) return ''
  const normalized = absolutePath.replace(/\\/g, '/')
  const idx = normalized.indexOf('/uploads/')
  return idx !== -1 ? normalized.slice(idx) : normalized
}

export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('avatar')

export const uploadTemplateImage = multer({
  storage: makeStorage('templates'),
  limits: { fileSize: MAX_FILE_SIZE * 2 },
  fileFilter,
}).single('preview')

export const uploadMedia = multer({
  storage: makeStorage('media'),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: mediaFilter,
}).single('file')

const ALLOWED_SOURCE_EXTS = ['.zip', '.tar.gz', '.gz']
const ALLOWED_MANIFEST_EXTS = ['.json']

function sourceFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === '.zip' || ext === '.gz') return cb(null, true)
  const name = file.originalname.toLowerCase()
  if (name.endsWith('.tar.gz')) return cb(null, true)
  cb(new AppError('امتداد الملف غير مسموح (ZIP فقط)', 400, 'INVALID_FILE_EXTENSION'))
}

export const uploadSource = multer({
  storage: makeStorage('source'),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: sourceFilter,
}).single('source')

export const uploadManifest = multer({
  storage: makeStorage('manifests'),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.json') return cb(null, true)
    cb(new AppError('manifest.json فقط', 400, 'INVALID_FILE_EXTENSION'))
  },
}).single('manifest')
