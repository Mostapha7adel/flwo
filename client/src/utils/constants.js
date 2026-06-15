export const ORDER_STATUS = {
  PENDING: { label: 'قيد الانتظار', color: 'warning' },
  ACCEPTED: { label: 'مقبول', color: 'info' },
  IN_PROGRESS: { label: 'جاري التنفيذ', color: 'accent' },
  COMPLETED: { label: 'مكتمل', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'danger' },
}

export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'الكل' },
  { value: 'متاجر', label: 'تجارة إلكترونية' },
  { value: 'شركات', label: 'شركات' },
  { value: 'مطاعم', label: 'مطاعم' },
  { value: 'مدونات', label: 'مدونة' },
  { value: 'عقارات', label: 'عقارات' },
  { value: 'رياضة', label: 'رياضة' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل' },
  { value: 'price_desc', label: 'السعر: من الأعلى' },
  { value: 'popular', label: 'الأكثر شهرة' },
]
