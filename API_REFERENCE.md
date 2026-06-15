# DesignFlow — API Reference الكامل

> Base URL: `https://api.designflow.com/api`  
> كل الـ responses بتكون `Content-Type: application/json`  
> كل الـ timestamps بتكون ISO 8601: `"2025-06-01T10:30:00.000Z"`  
> الأخطاء دايماً بتكون: `{ "error": "...", "code": "..." }`

---

## Authentication

الـ API بيستخدم **JWT Bearer Tokens** للـ authentication.

```
Authorization: Bearer <access_token>
```

- **Access Token:** عمره 15 دقيقة — يتبعت في الـ response body
- **Refresh Token:** عمره 7 أيام — يتخزن في `HttpOnly Cookie` تلقائياً (مش بتشوفه في الـ JavaScript)
- الـ cookie اسمه `refresh_token` وبيتبعت تلقائياً مع كل request لـ `/api/auth/refresh`

---

## Response Format الموحد

### Success Response
```json
{
  "data": { ... },   // أو الـ object مباشرة حسب الـ endpoint
  "message": "..."   // اختياري
}
```

### Error Response
```json
{
  "error": "رسالة خطأ واضحة",
  "code":  "ERROR_CODE_IN_CAPS",
  "details": { ... }   // موجود فقط في الـ validation errors
}
```

### Validation Error Response
```json
{
  "error":   "بيانات غير صحيحة",
  "code":    "VALIDATION_ERROR",
  "details": {
    "email":    ["بريد إلكتروني غير صحيح"],
    "password": ["كلمة المرور 8 أحرف على الأقل"]
  }
}
```

### Error Codes المحتملة

| Code | HTTP | المعنى |
|------|------|--------|
| `VALIDATION_ERROR` | 400 | بيانات مدخلة غير صحيحة |
| `INVALID_CREDENTIALS` | 401 | بيانات تسجيل الدخول غلط |
| `NO_TOKEN` | 401 | لم يتم إرسال access token |
| `TOKEN_REVOKED` | 401 | الـ token اتعمله logout |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token منتهي أو غير صحيح |
| `REFRESH_TOKEN_REUSE` | 401 | محاولة إعادة استخدام refresh token قديم |
| `UNAUTHORIZED` | 401 | غير مسجل دخول |
| `FORBIDDEN` | 403 | ليس لديك صلاحية |
| `ACCOUNT_SUSPENDED` | 403 | الحساب موقوف |
| `NOT_FOUND` | 404 | العنصر غير موجود |
| `TEMPLATE_NOT_FOUND` | 404 | القالب غير موجود |
| `ORDER_NOT_FOUND` | 404 | الطلب غير موجود |
| `DUPLICATE_ENTRY` | 409 | البريد أو الهاتف مستخدم بالفعل |
| `RATE_LIMIT_EXCEEDED` | 429 | عدد كبير من الطلبات |
| `TOO_MANY_LOGIN_ATTEMPTS` | 429 | محاولات دخول كثيرة |
| `INTERNAL_ERROR` | 500 | خطأ داخلي في الخادم |

---

## Pagination

الـ endpoints التي تدعم الـ pagination بتقبل:

| Query Param | Default | Description |
|-------------|---------|-------------|
| `page` | 1 | رقم الصفحة |
| `limit` | 10 أو 12 | عدد العناصر في الصفحة |

وبترجع:

```json
{
  "data":       [...],
  "total":      45,
  "page":       1,
  "totalPages": 5
}
```

---

# AUTH ENDPOINTS

---

## `POST /auth/register`

تسجيل عميل جديد.

**Rate Limit:** 3 requests/hour per IP

**Request:** `multipart/form-data` (بسبب رفع الصورة)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `firstName` | string | ✅ | 2-50 حرف، حروف فقط |
| `lastName` | string | ✅ | 2-50 حرف، حروف فقط |
| `phone` | string | ✅ | format: `+201234567890` |
| `email` | string | ✅ | valid email |
| `password` | string | ✅ | 8+ chars، uppercase + رقم + رمز خاص |
| `confirmPassword` | string | ✅ | يطابق `password` |
| `avatar` | file | ❌ | JPEG/PNG/WebP، max 5MB |

**Response `201 Created`:**
```json
{
  "user": {
    "id":        "clx1234abcd",
    "firstName": "Ahmed",
    "lastName":  "Mohamed",
    "email":     "ahmed@example.com",
    "phone":     "+201234567890",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "role":      "CLIENT",
    "createdAt": "2025-06-01T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

*+ Sets `refresh_token` HttpOnly Cookie*

**Errors:**
- `400 VALIDATION_ERROR` — بيانات غير صحيحة
- `409 DUPLICATE_ENTRY` — البريد أو الهاتف موجود
- `429 TOO_MANY_REGISTRATIONS` — تجاوز حد التسجيل

---

## `POST /auth/login`

تسجيل الدخول.

**Rate Limit:** 5 requests/15min per IP (فاشلين فقط)

**Request:** `application/json`

```json
{
  "email":    "ahmed@example.com",
  "password": "MyPass@123"
}
```

**Response `200 OK`:**
```json
{
  "user": {
    "id":        "clx1234abcd",
    "firstName": "Ahmed",
    "lastName":  "Mohamed",
    "email":     "ahmed@example.com",
    "role":      "CLIENT",
    "avatarUrl": "https://..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

*+ Sets `refresh_token` HttpOnly Cookie*

**Errors:**
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS` — نفس الـ message للـ user غير الموجود وكلمة المرور الغلط (security)
- `403 ACCOUNT_SUSPENDED`
- `429 TOO_MANY_LOGIN_ATTEMPTS`

---

## `POST /auth/refresh`

تجديد الـ access token باستخدام الـ refresh token cookie.

**Request:** لا يحتاج body — الـ cookie يتبعت تلقائياً

**Response `200 OK`:**
```json
{
  "user":        { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

*+ Sets new `refresh_token` HttpOnly Cookie (rotation)*
*+ Deletes old refresh token from DB*

**Errors:**
- `401 NO_REFRESH_TOKEN` — مفيش cookie
- `401 INVALID_REFRESH_TOKEN` — منتهي أو غير صحيح
- `401 REFRESH_TOKEN_REUSE` — إعادة استخدام token قديم (security breach — يُعمل revoke لكل tokens)

---

## `POST /auth/logout`

**Requires:** `Authorization: Bearer <token>`

تسجيل الخروج — بيحذف الـ refresh token وبيـblacklist الـ access token.

**Response `200 OK`:**
```json
{
  "message": "تم تسجيل الخروج بنجاح"
}
```

*+ Clears `refresh_token` cookie*
*+ Blacklists current access token in Redis*

---

## `GET /auth/me`

**Requires:** Authentication

بيانات المستخدم الحالي.

**Response `200 OK`:**
```json
{
  "id":        "clx1234abcd",
  "firstName": "Ahmed",
  "lastName":  "Mohamed",
  "email":     "ahmed@example.com",
  "phone":     "+201234567890",
  "role":      "CLIENT",
  "avatarUrl": "https://..."
}
```

---

# USER ENDPOINTS

---

## `GET /users/profile`

**Requires:** Authentication

**Response `200 OK`:**
```json
{
  "id":        "clx1234abcd",
  "firstName": "Ahmed",
  "lastName":  "Mohamed",
  "email":     "ahmed@example.com",
  "phone":     "+201234567890",
  "avatarUrl": "https://...",
  "createdAt": "2025-06-01T10:00:00.000Z",
  "_count": {
    "orders": 5
  }
}
```

---

## `PUT /users/profile`

**Requires:** Authentication

تعديل الاسم والهاتف.

**Request:** `application/json`

```json
{
  "firstName": "Ahmed",
  "lastName":  "Ali",
  "phone":     "+201234567891"
}
```

**Response `200 OK`:** نفس شكل `GET /users/profile`

**Errors:**
- `400 VALIDATION_ERROR`
- `409 DUPLICATE_ENTRY` — رقم الهاتف موجود عند شخص آخر

---

## `PUT /users/profile/avatar`

**Requires:** Authentication  
**Request:** `multipart/form-data`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `avatar` | file | ✅ | JPEG/PNG/WebP، max 5MB |

**Response `200 OK`:**
```json
{
  "avatarUrl": "https://res.cloudinary.com/.../new-avatar.jpg"
}
```

---

## `PUT /users/password`

**Requires:** Authentication

**Request:** `application/json`

```json
{
  "currentPassword": "OldPass@123",
  "newPassword":     "NewPass@456"
}
```

**Response `200 OK`:**
```json
{
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS` — كلمة المرور الحالية غلط

---

# TEMPLATES ENDPOINTS

---

## `GET /templates`

قائمة القوالب المنشورة. **لا يحتاج authentication.**

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | رقم الصفحة |
| `limit` | number | 12 | عدد القوالب في الصفحة (max: 50) |
| `category` | string | — | فلتر بالفئة |
| `search` | string | — | بحث في العنوان والوصف |
| `sort` | string | `newest` | `newest` \| `price_asc` \| `price_desc` |

**Response `200 OK`:**
```json
{
  "templates": [
    {
      "id":           "clx5678efgh",
      "title":        "E-Commerce Pro",
      "description":  "قالب احترافي للمتاجر الإلكترونية...",
      "category":     "تجارة",
      "price":        "149.00",
      "previewUrl":   "https://res.cloudinary.com/.../preview.jpg",
      "tags":         ["متجر", "عربي", "RTL"],
      "defaultColors": {
        "primary":   "#2563EB",
        "secondary": "#F8FAFC",
        "accent":    "#7C3AED",
        "text":      "#0F172A"
      }
    }
  ],
  "total":      24,
  "page":       1,
  "totalPages": 2
}
```

> **Note:** `components` مش موجودة في القائمة — موجودة في الـ detail endpoint فقط.

**Cached:** ✅ Redis — 5 دقائق

---

## `GET /templates/:id`

**لا يحتاج authentication.**

**Response `200 OK`:**
```json
{
  "id":           "clx5678efgh",
  "title":        "E-Commerce Pro",
  "description":  "قالب احترافي...",
  "category":     "تجارة",
  "price":        "149.00",
  "previewUrl":   "https://res.cloudinary.com/.../preview.jpg",
  "demoUrl":      "https://demo.designflow.com/ecom-pro",
  "tags":         ["متجر", "عربي", "RTL"],
  "defaultColors": {
    "primary":   "#2563EB",
    "secondary": "#F8FAFC",
    "accent":    "#7C3AED",
    "text":      "#0F172A"
  },
  "components": {
    "sections": [
      {
        "id":          "hero",
        "label":       "القسم الرئيسي",
        "draggable":   true,
        "colorBindings": {
          "background": "primary",
          "heading":    "text",
          "button":     "accent"
        }
      },
      {
        "id":        "features",
        "label":     "المميزات",
        "draggable": true,
        "colorBindings": { "background": "secondary" }
      }
    ]
  }
}
```

**Errors:**
- `404 TEMPLATE_NOT_FOUND` — غير موجود أو غير منشور

---

# ORDERS ENDPOINTS

---

## `POST /orders`

**Requires:** Authentication (CLIENT)

إنشاء طلب جديد بعد الشراء والتخصيص.

**Request:** `application/json`

```json
{
  "templateId": "clx5678efgh",
  "customization": {
    "colorTokens": {
      "primary":   "#E11D48",
      "secondary": "#FFF1F2",
      "accent":    "#9333EA",
      "text":      "#0F172A"
    },
    "sections": [
      { "id": "hero",     "label": "القسم الرئيسي", "draggable": true },
      { "id": "features", "label": "المميزات",      "draggable": true },
      { "id": "footer",   "label": "التذييل",       "draggable": true }
    ]
  },
  "notes": "عايز اللون الأحمر في الـ hero button بالظبط"
}
```

| Field | Required | Validation |
|-------|----------|------------|
| `templateId` | ✅ | يجب أن يكون موجوداً ومنشوراً |
| `customization` | ✅ | object يحتوي على `colorTokens` و `sections` |
| `customization.colorTokens` | ✅ | object بأربع keys: primary, secondary, accent, text |
| `customization.colorTokens.*` | ✅ | valid hex color `#RRGGBB` |
| `customization.sections` | ✅ | array من الأقسام |
| `notes` | ❌ | string, max 500 chars |

**Response `201 Created`:**
```json
{
  "id":          "clxorder123",
  "orderNumber": "ORD-1717200000-A3B2C1",
  "userId":      "clx1234abcd",
  "templateId":  "clx5678efgh",
  "status":      "PENDING",
  "customization": { ... },
  "totalAmount": "149.00",
  "notes":       "عايز اللون...",
  "createdAt":   "2025-06-01T10:30:00.000Z",
  "template": {
    "title":      "E-Commerce Pro",
    "previewUrl": "https://..."
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `404 TEMPLATE_NOT_FOUND`

---

## `GET /orders`

**Requires:** Authentication (CLIENT)

طلبات العميل الحالي.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 10 |
| `status` | string | `PENDING` \| `ACCEPTED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |

**Response `200 OK`:**
```json
{
  "orders": [
    {
      "id":          "clxorder123",
      "orderNumber": "ORD-1717200000-A3B2C1",
      "status":      "PENDING",
      "totalAmount": "149.00",
      "createdAt":   "2025-06-01T10:30:00.000Z",
      "template": {
        "title":      "E-Commerce Pro",
        "previewUrl": "https://...",
        "category":   "تجارة"
      },
      "conversation": {
        "id":     "clxconv456",
        "isOpen": true
      }
    }
  ],
  "total":      5,
  "page":       1,
  "totalPages": 1
}
```

> `conversation` بيكون `null` لو مفيش محادثة مفتوحة.

---

## `GET /orders/:id`

**Requires:** Authentication (CLIENT — يشوف طلباته بس)

**Response `200 OK`:**
```json
{
  "id":          "clxorder123",
  "orderNumber": "ORD-1717200000-A3B2C1",
  "status":      "ACCEPTED",
  "totalAmount": "149.00",
  "notes":       "...",
  "createdAt":   "2025-06-01T10:30:00.000Z",
  "updatedAt":   "2025-06-02T08:00:00.000Z",
  "customization": {
    "colorTokens": { "primary": "#E11D48", ... },
    "sections":    [ ... ]
  },
  "template": {
    "id":       "clx5678efgh",
    "title":    "E-Commerce Pro",
    "category": "تجارة",
    "previewUrl": "https://..."
  },
  "conversation": {
    "id":     "clxconv456",
    "isOpen": true
  }
}
```

**Errors:**
- `403 FORBIDDEN` — لو العميل بيحاول يشوف طلب شخص آخر
- `404 ORDER_NOT_FOUND`

---

# CHAT ENDPOINTS

---

## `GET /chat/conversations`

**Requires:** Authentication (CLIENT)

محادثات العميل الحالي (بس المفتوحة).

**Response `200 OK`:**
```json
{
  "conversations": [
    {
      "id":     "clxconv456",
      "isOpen": true,
      "unreadCount": 2,
      "lastMessage": {
        "content":   "سيتم البدء في التنفيذ خلال 24 ساعة",
        "createdAt": "2025-06-02T09:00:00.000Z",
        "senderRole": "ADMIN"
      },
      "order": {
        "id":          "clxorder123",
        "orderNumber": "ORD-1717200000-A3B2C1",
        "template": {
          "title":      "E-Commerce Pro",
          "previewUrl": "https://..."
        }
      }
    }
  ]
}
```

---

## `GET /chat/conversations/:id/messages`

**Requires:** Authentication (CLIENT — يشوف محادثاته بس)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cursor` | string | ID آخر رسالة شوفتها (للـ pagination) |
| `limit` | number | Default: 20 |

**Response `200 OK`:**
```json
{
  "messages": [
    {
      "id":        "clxmsg789",
      "content":   "مرحباً! تم قبول طلبك وسيتواصل معك فريقنا قريباً 🎉",
      "isRead":    true,
      "createdAt": "2025-06-02T08:00:00.000Z",
      "sender": {
        "firstName": "Support",
        "lastName":  "Team",
        "avatarUrl": "https://...",
        "role":      "ADMIN"
      }
    },
    {
      "id":        "clxmsg790",
      "content":   "شكراً، متى سيتم البدء؟",
      "isRead":    true,
      "createdAt": "2025-06-02T08:05:00.000Z",
      "sender": {
        "firstName": "Ahmed",
        "lastName":  "Mohamed",
        "avatarUrl": "https://...",
        "role":      "CLIENT"
      }
    }
  ],
  "nextCursor": "clxmsg770"
}
```

> `nextCursor` بيكون `null` لو مفيش رسائل قديمة أكثر.

**Errors:**
- `403 FORBIDDEN` — محاولة الوصول لمحادثة شخص آخر
- `404 CONVERSATION_NOT_FOUND`

---

# LANDING PAGE ENDPOINTS

---

## `GET /landing`

**لا يحتاج authentication.**

محتوى الـ landing page الكامل.

**Response `200 OK`:**
```json
{
  "hero": {
    "headline":        "قوالب جاهزة تُطلقك في دقائق لا أيام",
    "subheadline":     "اكتشف مئات القوالب الاحترافية...",
    "ctaPrimaryText":  "استعرض القوالب",
    "ctaSecondaryText":"شاهد كيف يعمل",
    "trustBadges":     ["100+ قالب", "تخصيص كامل", "دعم فوري"]
  },
  "features": [
    { "icon": "paint", "title": "تخصيص بالسحب", "description": "..." },
    { "icon": "zap",   "title": "تسليم سريع",    "description": "..." }
  ],
  "howItWorks": [
    { "step": 1, "title": "اختر قالبك",  "description": "..." },
    { "step": 2, "title": "خصص ألوانه",  "description": "..." },
    { "step": 3, "title": "احصل على موقعك", "description": "..." }
  ],
  "testimonials": [
    { "name": "محمد أحمد", "role": "صاحب متجر", "text": "...", "avatar": "https://..." }
  ],
  "footer": {
    "companyDescription": "منصة تصميم احترافية...",
    "socialLinks": { "facebook": "https://...", "twitter": "https://..." },
    "email": "support@designflow.com"
  }
}
```

**Cached:** ✅ Redis — 10 دقائق

---

# ADMIN ENDPOINTS

> كل الـ admin endpoints تحت `/api/admin`  
> تحتاج: `Authorization: Bearer <admin_token>` + role: `ADMIN` أو `SUPPORT`

---

## `GET /admin/stats`

**Requires:** ADMIN

نظرة عامة على المنصة.

**Response `200 OK`:**
```json
{
  "totalOrders":     45,
  "pendingOrders":   8,
  "totalClients":    120,
  "totalRevenue":    "9500.00",
  "monthlyRevenue":  "2300.00",
  "recentOrders": [
    {
      "id":          "clxorder123",
      "orderNumber": "ORD-1717200000-A3B2C1",
      "status":      "PENDING",
      "totalAmount": "149.00",
      "createdAt":   "2025-06-01T10:30:00.000Z",
      "user": {
        "firstName": "Ahmed",
        "lastName":  "Mohamed",
        "avatarUrl": "https://..."
      },
      "template": { "title": "E-Commerce Pro" }
    }
  ],
  "ordersPerMonth": [
    { "month": "يناير", "count": 5,  "revenue": "650.00" },
    { "month": "فبراير","count": 8,  "revenue": "1100.00" },
    { "month": "مارس",  "count": 12, "revenue": "1600.00" }
  ]
}
```

---

## `GET /admin/orders`

**Requires:** ADMIN or SUPPORT

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |
| `status` | string | فلتر بالحالة |
| `search` | string | بحث باسم العميل أو رقم الطلب |
| `from` | string | تاريخ البداية ISO date |
| `to` | string | تاريخ النهاية ISO date |

**Response `200 OK`:**
```json
{
  "orders": [
    {
      "id":          "clxorder123",
      "orderNumber": "ORD-1717200000-A3B2C1",
      "status":      "PENDING",
      "totalAmount": "149.00",
      "notes":       "...",
      "createdAt":   "2025-06-01T10:30:00.000Z",
      "user": {
        "id":        "clx1234abcd",
        "firstName": "Ahmed",
        "lastName":  "Mohamed",
        "email":     "ahmed@example.com",
        "phone":     "+201234567890",
        "avatarUrl": "https://..."
      },
      "template": {
        "title":      "E-Commerce Pro",
        "previewUrl": "https://...",
        "category":   "تجارة"
      },
      "conversation": {
        "id":     "clxconv456",
        "isOpen": true
      }
    }
  ],
  "total":      45,
  "page":       1,
  "totalPages": 3
}
```

---

## `GET /admin/orders/:id`

**Requires:** ADMIN or SUPPORT

**Response `200 OK`:**
```json
{
  "id":          "clxorder123",
  "orderNumber": "ORD-1717200000-A3B2C1",
  "status":      "ACCEPTED",
  "totalAmount": "149.00",
  "notes":       "...",
  "createdAt":   "2025-06-01T10:30:00.000Z",
  "updatedAt":   "2025-06-02T08:00:00.000Z",
  "customization": {
    "colorTokens": { "primary": "#E11D48", "secondary": "#FFF1F2", "accent": "#9333EA", "text": "#0F172A" },
    "sections": [ { "id": "hero", "label": "القسم الرئيسي" }, ... ]
  },
  "user": {
    "id":        "clx1234abcd",
    "firstName": "Ahmed",
    "lastName":  "Mohamed",
    "email":     "ahmed@example.com",
    "phone":     "+201234567890",
    "avatarUrl": "https://...",
    "_count": { "orders": 3 }
  },
  "template": {
    "id":         "clx5678efgh",
    "title":      "E-Commerce Pro",
    "category":   "تجارة",
    "price":      "149.00",
    "previewUrl": "https://..."
  },
  "conversation": {
    "id":        "clxconv456",
    "isOpen":    true,
    "createdAt": "2025-06-02T08:00:00.000Z"
  }
}
```

---

## `PATCH /admin/orders/:id/status`

**Requires:** ADMIN or SUPPORT

**Request:** `application/json`

```json
{
  "status": "ACCEPTED"
}
```

| Value | Description |
|-------|-------------|
| `PENDING` | قيد الانتظار |
| `ACCEPTED` | مقبول (بيعمل auto-conversation تلقائياً) |
| `IN_PROGRESS` | جاري التنفيذ |
| `COMPLETED` | مكتمل |
| `CANCELLED` | ملغي |

**Response `200 OK`:**
```json
{
  "id":     "clxorder123",
  "status": "ACCEPTED",
  "updatedAt": "2025-06-02T08:00:00.000Z",
  "conversation": {
    "id":     "clxconv456",
    "isOpen": true
  }
}
```

> **Note:** لما الحالة تبقى `ACCEPTED` → بيتعمل conversation تلقائياً (لو مش موجودة) + رسالة ترحيبية تلقائية للعميل.

---

## `POST /admin/orders/:id/conversation`

**Requires:** ADMIN or SUPPORT

فتح محادثة مع العميل يدوياً (من غير تغيير الحالة).

**Request:** `application/json` — لا يحتاج body

**Response `201 Created` (جديدة) أو `200 OK` (موجودة):**
```json
{
  "id":        "clxconv456",
  "orderId":   "clxorder123",
  "isOpen":    true,
  "createdAt": "2025-06-02T08:00:00.000Z",
  "messages": [
    {
      "id":        "clxmsg789",
      "content":   "مرحباً! تم قبول طلبك وسيتواصل معك فريقنا قريباً 🎉",
      "createdAt": "2025-06-02T08:00:00.000Z",
      "sender": { "firstName": "Admin", "role": "ADMIN" }
    }
  ]
}
```

---

## `GET /admin/templates`

**Requires:** ADMIN

جميع القوالب (منشورة وغير منشورة).

**Response `200 OK`:**
```json
{
  "templates": [
    {
      "id":          "clx5678efgh",
      "title":       "E-Commerce Pro",
      "category":    "تجارة",
      "price":       "149.00",
      "isPublished": true,
      "previewUrl":  "https://...",
      "tags":        ["متجر", "RTL"],
      "createdAt":   "2025-05-01T10:00:00.000Z",
      "_count": { "orders": 12 }
    }
  ],
  "total": 15
}
```

---

## `POST /admin/templates`

**Requires:** ADMIN  
**Request:** `multipart/form-data`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | ✅ | 3-100 chars |
| `description` | string | ✅ | 10-2000 chars |
| `category` | string | ✅ | |
| `price` | number | ✅ | > 0 |
| `preview` | file | ✅ | JPEG/PNG/WebP, max 10MB |
| `demoUrl` | string | ❌ | valid URL |
| `tags` | string (JSON array) | ❌ | `'["tag1","tag2"]'` |
| `defaultColors` | string (JSON) | ✅ | `'{"primary":"#...","secondary":"#...","accent":"#...","text":"#..."}'` |
| `components` | string (JSON) | ✅ | `'{"sections":[...]}'` |
| `isPublished` | boolean | ❌ | Default: false |

**Response `201 Created`:**
```json
{
  "id":          "clxnewtemplate",
  "title":       "New Template",
  "isPublished": false,
  "createdAt":   "2025-06-01T10:00:00.000Z"
}
```

---

## `PUT /admin/templates/:id`

**Requires:** ADMIN  
**Request:** `multipart/form-data` (نفس حقول POST، كلها اختيارية)

**Response `200 OK`:** بيانات القالب المحدثة

> **Note:** بعد التحديث بيتعمل cache invalidation تلقائياً لهذا القالب وقائمة القوالب.

---

## `DELETE /admin/templates/:id`

**Requires:** ADMIN

**Response `200 OK`:**
```json
{
  "message": "تم حذف القالب بنجاح"
}
```

**Errors:**
- `400 TEMPLATE_HAS_ORDERS` — لا يمكن حذف قالب عنده طلبات

---

## `PATCH /admin/templates/:id/publish`

**Requires:** ADMIN

نشر/إخفاء قالب.

**Request:** `application/json`

```json
{
  "isPublished": true
}
```

**Response `200 OK`:**
```json
{
  "id":          "clx5678efgh",
  "isPublished": true,
  "updatedAt":   "2025-06-01T10:00:00.000Z"
}
```

---

## `GET /admin/landing`

**Requires:** ADMIN

محتوى الـ landing page كاملاً.

**Response:** نفس شكل `GET /landing` — راجع الـ Landing endpoints.

---

## `PUT /admin/landing/:section`

**Requires:** ADMIN

تعديل section معين في الـ landing page.

**Path Params:**

| Section | Description |
|---------|-------------|
| `hero` | الـ Hero section |
| `features` | المميزات |
| `how_it_works` | كيف يعمل |
| `testimonials` | آراء العملاء |
| `footer` | التذييل |

**Request:** `application/json` — بيانات الـ section (flexible JSON)

```json
{
  "headline":        "قوالب جاهزة تُطلقك في دقائق",
  "subheadline":     "وصف جديد...",
  "ctaPrimaryText":  "ابدأ الآن",
  "trustBadges":     ["200+ قالب", "تخصيص كامل", "دعم 24/7"]
}
```

**Response `200 OK`:**
```json
{
  "section":   "hero",
  "content":   { ... },
  "updatedAt": "2025-06-01T10:00:00.000Z"
}
```

> **Note:** بعد التحديث بيتعمل Redis cache invalidation فوراً.

---

## `GET /admin/conversations`

**Requires:** ADMIN or SUPPORT

كل المحادثات.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |
| `isOpen` | boolean | فلتر بالحالة |

**Response `200 OK`:**
```json
{
  "conversations": [
    {
      "id":        "clxconv456",
      "isOpen":    true,
      "createdAt": "2025-06-02T08:00:00.000Z",
      "unreadCount": 3,
      "lastMessage": {
        "content":   "متى سيتم البدء؟",
        "createdAt": "2025-06-02T09:00:00.000Z",
        "senderRole": "CLIENT"
      },
      "order": {
        "orderNumber": "ORD-1717200000-A3B2C1",
        "template": { "title": "E-Commerce Pro" },
        "user": {
          "firstName": "Ahmed",
          "lastName":  "Mohamed",
          "avatarUrl": "https://..."
        }
      }
    }
  ],
  "total": 8
}
```

---

## `GET /admin/users`

**Requires:** ADMIN

**Query Parameters:** `page`, `limit`, `search` (بالاسم أو البريد)

**Response `200 OK`:**
```json
{
  "users": [
    {
      "id":        "clx1234abcd",
      "firstName": "Ahmed",
      "lastName":  "Mohamed",
      "email":     "ahmed@example.com",
      "phone":     "+201234567890",
      "avatarUrl": "https://...",
      "isActive":  true,
      "createdAt": "2025-05-01T10:00:00.000Z",
      "_count": { "orders": 3 }
    }
  ],
  "total":      120,
  "page":       1,
  "totalPages": 12
}
```

---

# SOCKET.IO EVENTS

> Connection URL: `wss://api.designflow.com`  
> Auth: `{ auth: { token: "<access_token>" } }` في الـ handshake

## Client → Server Events

### `join_conversation`
الانضمام لـ room محادثة معينة.
```javascript
socket.emit('join_conversation', 'clxconv456')
```

### `send_message`
إرسال رسالة.
```javascript
socket.emit('send_message', {
  conversationId: 'clxconv456',
  content:        'مرحباً، متى سيتم البدء؟'
})
```

| Field | Validation |
|-------|-----------|
| `conversationId` | مطلوب، يجب أن يكون لديك صلاحية |
| `content` | مطلوب، max 2000 chars |

### `mark_read`
تعليم الرسائل كمقروءة.
```javascript
socket.emit('mark_read', { conversationId: 'clxconv456' })
```

---

## Server → Client Events

### `new_message`
رسالة جديدة وصلت في الـ room.
```javascript
socket.on('new_message', (message) => {
  // message shape:
  // {
  //   id: "clxmsg789",
  //   conversationId: "clxconv456",
  //   content: "...",
  //   createdAt: "2025-06-02T09:00:00.000Z",
  //   sender: { firstName, lastName, avatarUrl, role }
  // }
})
```

### `message_notification`
إشعار برسالة جديدة (للـ user حتى لو مش في الـ room).
```javascript
socket.on('message_notification', (data) => {
  // data: { conversationId, senderName, preview }
})
```

### `messages_read`
الطرف الآخر قرأ الرسائل.
```javascript
socket.on('messages_read', (data) => {
  // data: { conversationId, readBy: "user-id" }
})
```

### `joined_conversation`
تأكيد الانضمام للـ room.
```javascript
socket.on('joined_conversation', (data) => {
  // data: { conversationId }
})
```

### `error`
خطأ في أي event.
```javascript
socket.on('error', (data) => {
  // data: { message: "..." }
})
```

---

## `GET /health`

**لا يحتاج authentication.**

**Response `200 OK`:**
```json
{
  "status":    "ok",
  "timestamp": "2025-06-01T10:00:00.000Z"
}
```

---

## Frontend Integration Examples

### Axios Instance مع Auto Refresh

```javascript
// lib/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // مهم للـ refresh token cookie
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let queue = []

api.interceptors.response.use(null, async (error) => {
  const original = error.config
  if (error.response?.status === 401 && !original._retry) {
    if (isRefreshing) {
      return new Promise((res, rej) => queue.push({ res, rej }))
        .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original) })
    }
    original._retry = true
    isRefreshing = true
    try {
      const { data } = await api.post('/auth/refresh')
      useAuthStore.getState().setTokens(data.user, data.accessToken)
      queue.forEach(p => p.res(data.accessToken))
      queue = []
      isRefreshing = false
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      queue.forEach(p => p.rej(error))
      queue = []
      isRefreshing = false
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }
  }
  return Promise.reject(error)
})
```

### Socket.IO Client

```javascript
// features/chat/socketClient.js
import { io } from 'socket.io-client'
import { useAuthStore } from '../../store/authStore'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      auth: { token: useAuthStore.getState().accessToken },
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  // Update token before connecting (قد يكون اتجدد)
  s.auth.token = useAuthStore.getState().accessToken
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}
```

---

*API Reference v1.0 — DesignFlow Platform*
