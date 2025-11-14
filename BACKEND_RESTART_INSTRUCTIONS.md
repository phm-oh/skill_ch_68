# คำแนะนำ Restart Backend Server

## 🔥 สาเหตุที่ต้อง Restart

แก้ไขไฟล์ backend:
1. `backend/routes/assignments.routes.js` - แก้ลำดับ routes
2. `backend/controllers/users.controller.js` - แก้ getByRole ไม่ filter status

---

## ✅ วิธี Restart Backend

### วิธีที่ 1: ถ้ารัน `npm start` หรือ `node server.js`

```bash
cd /home/user/skill_ch_68/backend

# หยุด server เดิม (กด Ctrl+C)
# จากนั้นรันใหม่:
npm start
# หรือ
node server.js
```

### วิธีที่ 2: ถ้าใช้ `nodemon`

```bash
cd /home/user/skill_ch_68/backend

# หยุดแล้วรันใหม่ หรือ
# nodemon จะ auto-restart เอง
npm run dev
```

### วิธีที่ 3: ถ้าใช้ PM2

```bash
# ดู process ที่รันอยู่
pm2 list

# Restart backend process
pm2 restart backend

# หรือถ้าชื่อไม่ใช่ backend
pm2 restart <process-name>

# หรือ restart ทั้งหมด
pm2 restart all
```

### วิธีที่ 4: ถ้าใช้ Docker

```bash
# Restart container
docker-compose restart backend

# หรือ rebuild
docker-compose up -d --build backend
```

---

## 🧪 ทดสอบว่า Backend ทำงานแล้ว

### 1. ตรวจสอบ Backend ทำงานหรือไม่

```bash
# ดูว่า backend รันที่ port ไหน (สมมติ 3000)
curl http://localhost:3000/health
# หรือ
curl http://localhost:3000/api/health
```

### 2. ทดสอบ API Endpoints

```bash
# สมมติ backend รันที่ localhost:3000

# 1. ทดสอบ login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# เก็บ token ที่ได้มา

# 2. ทดสอบ GET /api/assignments
curl http://localhost:3000/api/assignments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. ทดสอบ GET /api/users/role/evaluator
curl http://localhost:3000/api/users/role/evaluator \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. ทดสอบ GET /api/users/role/evaluatee
curl http://localhost:3000/api/users/role/evaluatee \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 สิ่งที่แก้ไขไปแล้ว

### ✅ 1. assignments.routes.js (บรรทัด 15-29)
**ปัญหา:** ลำดับ routes ผิด ทำให้ GET `/` ไม่ทำงาน

**แก้ไข:**
```javascript
// ก่อน (ผิด):
router.get('/mine', ...)  // ✅
router.get('/:id', ...)   // ❌ จับ '/' ก่อน
router.get('/', ...)      // ❌ ไม่เคยทำงาน

// หลัง (ถูก):
router.get('/mine', ...)  // ✅ specific
router.get('/', ...)      // ✅ general
router.get('/:id', ...)   // ✅ dynamic
```

### ✅ 2. users.controller.js (getByRole)
**ปัญหา:** Filter ด้วย `status: 'active'` ทำให้ดึง users ไม่ได้ถ้า column status ไม่มี

**แก้ไข:**
```javascript
// ก่อน:
.where({ role, status: 'active' })

// หลัง:
.where({ role })
```

และเพิ่ม console.log เพื่อ debug

---

## 🎯 ผลลัพธ์ที่คาดหวัง

หลัง Restart Backend:

1. **✅ API `/api/assignments` ทำงาน** - แสดงรายการมอบหมาย
2. **✅ API `/api/users/role/evaluator` ทำงาน** - แสดง list กรรมการ
3. **✅ API `/api/users/role/evaluatee` ทำงาน** - แสดง list ผู้ถูกประเมิน
4. **✅ Frontend แสดง assignments** - เห็นรายการใน table
5. **✅ มอบหมายงานได้** - กด "มอบหมาย" แล้วเลือก dropdown ได้

---

## 🐛 ถ้ายังมีปัญหา

### ดู Backend Logs:

```bash
# ถ้ารันด้วย npm/node
# ดูใน terminal ที่รัน backend

# ถ้าใช้ PM2
pm2 logs backend

# ดู error logs
pm2 logs backend --err
```

### ตรวจสอบ Console Logs ที่ควรเห็น:

```
[Users API] 🔍 Getting users by role: evaluator
[Users API] ✅ Found 3 users with role: evaluator

[Users API] 🔍 Getting users by role: evaluatee
[Users API] ✅ Found 5 users with role: evaluatee
```

---

## 📦 ไฟล์ที่เปลี่ยนแปลง:

```
✅ backend/routes/assignments.routes.js (แก้ลำดับ routes)
✅ backend/controllers/users.controller.js (แก้ getByRole)
```

---

**Restart Backend แล้วลองใช้งานดูนะครับ!** 🚀
