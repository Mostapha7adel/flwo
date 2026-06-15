export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
})

export const USER_ROLE = Object.freeze({
  CLIENT: 'CLIENT',
  SUPPORT: 'SUPPORT',
  ACCOUNTS: 'ACCOUNTS',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
})

export const STAFF_ROLES = Object.freeze(['ADMIN', 'SUPPORT', 'ACCOUNTS', 'SUPER_ADMIN'])

export const LANDING_SECTIONS = Object.freeze([
  'hero', 'heroSettings', 'features', 'steps', 'how_it_works', 'testimonials',
  'footer', 'about', 'aboutPage', 'demoVideo',
])

export const CACHE_TTL = Object.freeze({
  TEMPLATE_LIST: 300,
  TEMPLATE: 600,
  LANDING: 600,
  STATS: 120,
})

export const CACHE_PREFIX = Object.freeze({
  TEMPLATE: (id) => `templates:${id}`,
  TEMPLATE_LIST: (params) => `templates:list:${JSON.stringify(params)}`,
  LANDING: (s) => `landing:${s}`,
  STATS: 'admin:stats',
  BLACKLIST: (token) => `blacklist:${token}`,
  SUSPENDED: (id) => `suspended:${id}`,
})

export const SAFE_USER_SELECT = Object.freeze({
  id: true, firstName: true, lastName: true,
  email: true, phone: true, avatarUrl: true,
  role: true, isActive: true, createdAt: true,
})

export const ROLE_HIERARCHY = Object.freeze({
  SUPPORT: ['CLIENT'],
  ACCOUNTS: ['CLIENT'],
  ADMIN: ['CLIENT', 'SUPPORT', 'ACCOUNTS'],
  SUPER_ADMIN: ['CLIENT', 'SUPPORT', 'ACCOUNTS', 'ADMIN'],
})

export const NOTIFICATION_TYPES = Object.freeze({
  CONTACT_REPLY: 'contact_reply',
  CONTACT_RESOLVED: 'contact_resolved',
  CHAT_MESSAGE: 'chat_message',
  ORDER_UPDATE: 'order_update',
  NEW_ORDER: 'new_order',
  NEW_CONTACT: 'new_contact',
})


