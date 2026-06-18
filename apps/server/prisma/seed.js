import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { logger } from '../src/lib/logger.js'

const prisma = new PrismaClient()

async function main() {
  logger.info('Seeding database...')

  const adminPassword = await bcrypt.hash('Admin@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@templyn.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Templyn',
      email: 'admin@templyn.com',
      phone: '+201000000000',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  logger.info('Admin created: %s', admin.email)

  const templates = [
    {
      title: 'متجر إلكتروني عصري',
      description: 'قالب متجر إلكتروني متكامل مع تصميم عصري ومناسب لجميع المنتجات، يدعم الدفع الإلكتروني وإدارة المخزون.',
      category: 'متاجر',
      price: 1499,
      tags: ['متجر', 'الكتروني', 'تجاري', 'مودرن'],
      defaultColors: { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', text: '#1f2937' },
      components: { sections: [
        { id: 'hero', label: 'الصفحة الرئيسية', draggable: true },
        { id: 'products', label: 'المنتجات', draggable: true },
        { id: 'cart', label: 'سلة التسوق', draggable: false },
      ]},
      sortOrder: 1,
    },
    {
      title: 'شركة محاماة احترافي',
      description: 'قالب احترافي لمكاتب المحاماة والاستشارات القانونية، يعرض التخصصات والفريق والإنجازات.',
      category: 'شركات',
      price: 999,
      tags: ['شركات', 'قانون', 'محاماة', 'احترافي'],
      defaultColors: { primary: '#1e3a5f', secondary: '#0f2440', accent: '#c9a84c', text: '#334155' },
      components: { sections: [
        { id: 'hero', label: 'الرئيسية', draggable: true },
        { id: 'services', label: 'الخدمات', draggable: true },
        { id: 'team', label: 'الفريق', draggable: true },
      ]},
      sortOrder: 2,
    },
    {
      title: 'مطعم ومقهى أنيق',
      description: 'قالب جذاب للمطاعم والمقاهي مع عرض القائمة والحجز المباشر ومعرض الصور.',
      category: 'مطاعم',
      price: 799,
      tags: ['مطاعم', 'مقاهي', 'طعام', 'حجوزات'],
      defaultColors: { primary: '#d97706', secondary: '#92400e', accent: '#fef3c7', text: '#1c1917' },
      components: { sections: [
        { id: 'hero', label: 'الرئيسية', draggable: true },
        { id: 'menu', label: 'القائمة', draggable: true },
        { id: 'reservation', label: 'الحجز', draggable: true },
      ]},
      sortOrder: 3,
    },
    {
      title: 'مدونة شخصية عصرية',
      description: 'قالب مدونة شخصية بتصميم minimalist يناسب الكتاب والمبدعين.',
      category: 'مدونات',
      price: 499,
      tags: ['مدونة', 'شخصية', 'كتابة', 'minimal'],
      defaultColors: { primary: '#6366f1', secondary: '#4338ca', accent: '#f43f5e', text: '#18181b' },
      components: { sections: [
        { id: 'hero', label: 'الرئيسية', draggable: true },
        { id: 'posts', label: 'المقالات', draggable: true },
        { id: 'about', label: 'عني', draggable: true },
      ]},
      sortOrder: 4,
    },
    {
      title: 'موقع عقارات فاخر',
      description: 'قالب فاخر لشركات العقارات يعرض المشاريع والجولات الافتراضية.',
      category: 'عقارات',
      price: 1999,
      tags: ['عقارات', 'فاخر', 'عرض', 'جولات'],
      defaultColors: { primary: '#0f766e', secondary: '#115e59', accent: '#fbbf24', text: '#1e293b' },
      components: { sections: [
        { id: 'hero', label: 'الرئيسية', draggable: true },
        { id: 'properties', label: 'العقارات', draggable: true },
        { id: 'gallery', label: 'معرض الصور', draggable: true },
      ]},
      sortOrder: 5,
    },
    {
      title: 'صالة رياضة ولياقة',
      description: 'قالب ديناميكي لصالات الرياضة مع جدول الفصول والمدربين والأسعار.',
      category: 'رياضة',
      price: 899,
      tags: ['رياضة', 'لياقة', 'جيم', 'صحة'],
      defaultColors: { primary: '#dc2626', secondary: '#991b1b', accent: '#facc15', text: '#27272a' },
      components: { sections: [
        { id: 'hero', label: 'الرئيسية', draggable: true },
        { id: 'classes', label: 'الفصول', draggable: true },
        { id: 'pricing', label: 'الأسعار', draggable: true },
      ]},
      sortOrder: 6,
    },
  ]

  for (const tpl of templates) {
    const existing = await prisma.template.findFirst({ where: { title: tpl.title } })
    if (!existing) {
      await prisma.template.create({
        data: {
          title: tpl.title,
          description: tpl.description,
          category: tpl.category,
          price: tpl.price,
          previewUrl: `/placeholder-${tpl.category}.jpg`,
          tags: tpl.tags,
          defaultColors: tpl.defaultColors,
          components: tpl.components,
          sortOrder: tpl.sortOrder,
          isPublished: true,
        },
      })
      logger.info('Template: %s', tpl.title)
    }
  }

  logger.info('Seeding complete!')
}

main()
  .catch((e) => {
    logger.error(e, 'Seed error')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
