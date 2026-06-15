import { ORDER_STATUS } from './constants.js'

const COLOR_MAP = {
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
}

const DOT_MAP = {
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  accent: 'bg-indigo-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
}

export const ORDER_STATUS_CONFIG = Object.fromEntries(
  Object.entries(ORDER_STATUS).map(([key, val]) => [
    key,
    { label: val.label, color: val.color, bgClass: COLOR_MAP[val.color] || COLOR_MAP.info, dot: DOT_MAP[val.color] || DOT_MAP.info }
  ])
)

export const STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, c]) => ({
  value, label: c.label,
}))


