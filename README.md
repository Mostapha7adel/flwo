# DesignFlow Platform — Master Guide

## الملفات

| الملف | المحتوى |
|-------|---------|
| `PHASE_1_FRONTEND.md` | تصميم وبناء الـ React Frontend كامل — كل صفحة بالتفصيل |
| `PHASE_2_BACKEND.md` | Node.js + Express + PostgreSQL + Redis + Security |
| `PHASE_3_TESTING.md` | Unit + Integration + Load + Security Tests |
| `API_REFERENCE.md` | توثيق كل الـ endpoints بالتفصيل |

## ترتيب التنفيذ

```
PHASE_1  →  PHASE_2  →  ربط Frontend بالـ API  →  PHASE_3
```

## Tech Stack

```
Frontend:  React 18 + Vite + Tailwind + Zustand + DnD Kit
Backend:   Node.js + Express.js
Database:  PostgreSQL + Prisma ORM
Cache:     Redis (ioredis)
Auth:      JWT (Access 15min + Refresh 7d httpOnly cookie)
Realtime:  Socket.IO
Upload:    Cloudinary
Deploy:    PM2 Cluster + Nginx
```

## الصفحات

**عامة:** Landing Page · قائمة القوالب · معاينة قالب  
**Auth:** تسجيل دخول · إنشاء حساب  
**محرر:** Template Customizer (Drag & Drop + Color Pickers)  
**داشبورد العميل:** نظرة عامة · طلباتي · المحادثة · الملف الشخصي  
**لوحة الأدمن (مخفية):** إحصائيات · إدارة الطلبات · القوالب · Landing Editor · المحادثات
