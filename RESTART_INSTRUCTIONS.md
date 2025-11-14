# คำแนะนำ Restart Frontend และแก้ปัญหา

## 🔥 ปัญหาที่พบ
1. **ปุ่ม 🏠 ไม่แสดง** - Frontend ยังไม่ได้ rebuild
2. **ยังเด้งออกจากระบบบ่อย** - Auth middleware ต้อง restart

---

## ✅ วิธีแก้ไข

### 1. Restart Frontend Development Server

```bash
cd /home/user/skill_ch_68/frontend

# หยุด dev server เดิม (กด Ctrl+C)
# จากนั้นรันใหม่
npm run dev
```

หรือถ้ารันด้วย PM2:
```bash
pm2 restart frontend
# หรือ
pm2 delete frontend && pm2 start npm --name "frontend" -- run dev
```

---

### 2. Clear Browser Cache

#### Chrome/Edge:
1. กด `Ctrl + Shift + Delete`
2. เลือก "Cached images and files"
3. กด "Clear data"
4. **หรือ** กด `Ctrl + Shift + R` (Hard Reload)

#### Firefox:
1. กด `Ctrl + Shift + Delete`
2. เลือก "Cache"
3. กด "Clear Now"

---

### 3. ตรวจสอบว่า Middleware ทำงาน

1. เปิด Browser Console (F12)
2. Login เข้าระบบ
3. ดูใน Console ควรเห็น:

```
[Auth Plugin] 🚀 Starting auth initialization...
[Auth Plugin] 🔍 Checking localStorage...
[Auth Plugin] 🔑 Token exists: true
[Auth Plugin] 👤 User exists: true
[Auth Plugin] 💾 After hydration - Store token: true
[Auth Plugin] ✅ Auth initialization completed

[Auth Middleware] 🔍 Checking route: /
[Auth Middleware] 📦 Current token: ✅ EXISTS
[Auth Middleware] 🛡️ Need auth: true
[Auth Middleware] 🔐 Has token: true
[Auth Middleware] ✅ Access granted to: /
```

---

### 4. ถ้ายังเด้งออกอยู่

ลอง Clear localStorage แล้ว Login ใหม่:

```javascript
// เปิด Console (F12) แล้วรัน:
localStorage.clear()
location.reload()
```

จากนั้น Login ใหม่อีกครั้ง

---

### 5. ตรวจสอบว่ามีปุ่ม 🏠 แล้ว

หลังจาก Restart Frontend:
- ไปที่หน้า `/admin/periods` → ควรเห็นปุ่ม 🏠 ด้านซ้ายบน
- ไปที่หน้า `/admin/assignments` → ควรเห็นปุ่ม 🏠 ด้านซ้ายบน
- ไปที่หน้า `/evaluator/tasks` → ควรเห็นปุ่ม 🏠 ด้านซ้ายบน

---

## 📝 สิ่งที่แก้ไขไปแล้ว

### ✅ Middleware (`frontend/middleware/auth.global.ts`)
- เพิ่ม logging เพื่อ debug
- ปรับปรุงการ hydrate token จาก localStorage
- แก้ไข timing issue

### ✅ Plugin (`frontend/plugins/auth-init.client.js`)
- เพิ่ม logging เพื่อดูว่า plugin ทำงานถูกต้อง
- ปรับปรุงการ hydrate ให้แข็งแรงกว่าเดิม

### ✅ ปุ่ม Home ทุกหน้า
- `/admin/periods`, `/admin/topics`, `/admin/indicators`, `/admin/reports`, `/admin/assignments`
- `/evaluator/tasks`, `/evaluator/signature`, `/evaluator/evaluate/[id]`
- `/evaluatee/dashboard`

---

## 🐛 Debug Tips

### ดู localStorage Token:
```javascript
// เปิด Console (F12)
console.log('Token:', localStorage.getItem('auth_token'))
console.log('User:', localStorage.getItem('auth_user'))
```

### ดู Pinia Store:
```javascript
// เปิด Vue DevTools -> Pinia
// ดู auth store -> token, user
```

---

## 📞 ถ้ายังมีปัญหา

1. ตรวจสอบ Console logs ว่ามี error อะไร
2. ดูว่า API response ส่งอะไรกลับมา
3. ตรวจสอบว่า backend ทำงานปกติ
4. ลอง Login ด้วย user ใหม่

---

**Last Updated:** 2025-11-14
**Branch:** `claude/vue3-evaluation-system-frontend-01Btn2fY51fN34iUdTL5twZh`
