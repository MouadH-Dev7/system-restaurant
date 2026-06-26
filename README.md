# Restaurant Platform

Production-ready modular monolith foundation for restaurant operations.

## Apps

- `apps/customer-app` - QR ordering
- `apps/pos-app` - POS
- `apps/kitchen-app` - Kitchen display
- `apps/admin-dashboard` - Administration
- `backend` - NestJS API, WebSocket gateway, Prisma

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

## Infrastructure (Docker)

**Prerequisites:** Docker Desktop. Stop any local `pnpm dev` on ports 3001–3004 and 4000 before starting Docker.

### تشغيل المشروع بالكامل (Docker)

من جذر المشروع:

```powershell
docker compose up --build
```

للعمل من الهاتف عبر نفس الشبكة المحلية أثناء استخدام Docker، أنشئ ملف `.env` في جذر المشروع وضع عنوان جهازك الحقيقي:

```env
CUSTOMER_APP_URL=http://192.168.1.10
NEXT_PUBLIC_SOCKET_URL=http://192.168.1.10
CORS_ORIGIN=http://192.168.1.10,http://192.168.1.10:3001,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost
```

استبدل `192.168.1.10` بعنوان `IPv4` الخاص بجهازك من `ipconfig`، ثم أعد البناء:

```powershell
docker compose up --build
```

عند أول تشغيل (أو بعد إعادة بناء الـ backend)، الحاوية تقوم تلقائياً بـ:

1. `prisma migrate deploy` — تطبيق migrations (جدول `menus` وربط `menu_items`)
2. تشغيل API على المنفذ 4000

`prisma db seed` لم يعد يعمل تلقائياً عند كل تشغيل، حتى لا تُمسح القوائم التي تضيفها بنفسك.
إذا احتجت بيانات demo من جديد، شغّله يدويًا فقط:

```powershell
docker compose exec backend sh -c "pnpm --dir backend prisma db seed"
```

انتظر حتى يصبح `backend` **healthy** ثم افتح تطبيق العميل.

### Docker URLs

| Service                          | URL                   |
| -------------------------------- | --------------------- |
| Customer app (direct)            | http://localhost:3001 |
| Customer via Nginx (recommended) | http://localhost      |
| POS                              | http://localhost:3002 |
| Kitchen                          | http://localhost:3003 |
| Admin                            | http://localhost:3004 |
| Backend API                      | http://localhost:4000 |

### رابط تجربة QR (بعد الـ seed)

```
http://localhost/?restaurantId=a1111111-1111-4111-8111-111111111111&tableId=b2222222-2222-4222-8222-222222222222
```

**مسار التطبيق:** اختيار اللغة → قائمة المنيوات (محلي / فرنسي / مشروبات) → الضغط على منيو → أصناف ذلك المنيو.

### أوامر مفيدة (Docker)

```powershell
docker compose down
docker compose down -v
docker compose up --build backend
docker compose logs -f backend
docker compose exec backend sh -c "pnpm --dir backend prisma migrate deploy"
docker compose exec backend sh -c "pnpm --dir backend prisma db seed"
```

| الأمر                            | الاستخدام                                |
| -------------------------------- | ---------------------------------------- |
| `docker compose down`            | إيقاف الحاويات                           |
| `docker compose down -v`         | إيقاف + حذف قاعدة البيانات (بداية نظيفة) |
| `docker compose up --build`      | بعد تعديل الكود أو schema                |
| `docker compose logs -f backend` | متابعة migration / seed / أخطاء API      |

**بعد تعديل قاعدة البيانات أو الـ backend:** أعد البناء ثم التشغيل:

```powershell
docker compose up --build backend customer-app
```

أو كل الخدمات:

```powershell
docker compose up --build
```

### Nginx subdomains (optional)

Add to `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 customer.localhost api.localhost pos.localhost kitchen.localhost admin.localhost
```

Then use http://customer.localhost, http://api.localhost, etc.
