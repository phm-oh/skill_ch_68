# 🔧 Hotfix: แก้ไขปัญหาข้อมูลไม่แสดงหลัง refresh

## 🔍 ปัญหา
- Login เข้าไปแล้วเด้งออกมาหน้า login ซ้ำๆ
- กด F5 refresh หน้าแล้วเด้งออกไปหน้า login
- ไม่มีข้อมูลแสดงในทุกหน้า
- API error: "email, password, name_th required"

## 🎯 สาเหตุ
**Plugin Load Order ไม่ถูกต้อง:**
- Nuxt 3 โหลด plugins ตาม alphabetical order
- `axios.client.js` (a) โหลดก่อน `piniaPersist.client.js` (p)
- ทำให้ axios setup เสร็จก่อน auth store จะ hydrate
- เลย token ไม่ถูกส่งไปกับ API request

## ✅ วิธีแก้ไข (ทำบนเครื่อง Windows ของคุณ)

### ขั้นตอนที่ 1: ตรวจสอบ Branch
```bash
cd D:\kro_oh\skill_ch_68\skill_ch_68
git status
git branch
```

ต้องอยู่ที่ branch: `claude/rebuild-evaluation-frontend-vue3-01EGigWtuypFxMSJ73pTWwMa`

ถ้าไม่ใช่ ให้:
```bash
git checkout claude/rebuild-evaluation-frontend-vue3-01EGigWtuypFxMSJ73pTWwMa
git pull origin claude/rebuild-evaluation-frontend-vue3-01EGigWtuypFxMSJ73pTWwMa
```

### ขั้นตอนที่ 2: ลบไฟล์เก่า
```bash
cd frontend\plugins
del axios.client.js
del piniaPersist.client.js
```

### ขั้นตอนที่ 3: สร้างไฟล์ใหม่

#### 📄 `frontend/plugins/01.piniaPersist.client.js`
```javascript
// plugins/piniaPersist.client.js
// ✅ Auto-persist all Pinia stores to localStorage
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia || nuxtApp.pinia

  if (!pinia) {
    console.error('[PiniaPersist] Pinia not found')
    return
  }

  pinia.use(({ store }) => {
    const key = `pinia-${store.$id}`

    // ✅ Restore state from localStorage (ทำงานทันทีตอน store initialize)
    if (process.client) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          store.$patch(parsed)
          console.log(`[PiniaPersist] Restored store "${store.$id}" from localStorage`)
        } catch (e) {
          console.error(`[PiniaPersist] Failed to restore "${store.$id}":`, e)
          // ลบ corrupted data ออก
          localStorage.removeItem(key)
        }
      }
    }

    // ✅ Subscribe to changes and save to localStorage
    store.$subscribe((_mutation, state) => {
      if (process.client) {
        try {
          localStorage.setItem(key, JSON.stringify(state))
          console.log(`[PiniaPersist] Saved store "${store.$id}" to localStorage`)
        } catch (e) {
          console.error(`[PiniaPersist] Failed to save "${store.$id}":`, e)
        }
      }
    }, { detached: true })
  })
})
```

#### 📄 `frontend/plugins/02.axios.client.js`
```javascript
// plugins/axios.client.js
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const router = useRouter()

  const api = axios.create({
    baseURL: config.public.apiBase || 'http://localhost:7000',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false
  })

  // ✅ แนบ token ทุกครั้งที่ request
  api.interceptors.request.use((req) => {
    // ดึง token จาก store ก่อน ถ้าไม่มีให้อ่านจาก localStorage
    let token = auth.token

    // Fallback: ถ้า store ยังไม่มี token (ยังไม่ hydrate) ให้อ่านจาก localStorage
    if (!token) {
      try {
        const stored = localStorage.getItem('pinia-auth')
        if (stored) {
          const parsed = JSON.parse(stored)
          token = parsed.token
        }
      } catch (e) {
        console.error('[Axios] Error reading token from localStorage:', e)
      }
    }

    if (token) {
      req.headers = req.headers || {}
      req.headers.Authorization = `Bearer ${token}`
      console.log('[Axios] ส่ง token:', token.slice(0, 15) + '...')
    } else {
      console.warn('[Axios] ไม่มี token จะส่ง')
    }

    return req
  })

  // ✅ Auto logout เมื่อได้ 401 Unauthorized
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        console.warn('[Axios] 401 Unauthorized - Auto logout')
        auth.logout()
        router.push('/login')
      }
      return Promise.reject(err)
    }
  )

  nuxtApp.provide('api', api)
})
```

### ขั้นตอนที่ 4: ตรวจสอบไฟล์
```bash
dir frontend\plugins
```

ควรเห็น:
```
01.piniaPersist.client.js
02.axios.client.js
vuetify.ts
```

### ขั้นตอนที่ 5: Clear localStorage และทดสอบ

1. เปิด browser (Chrome/Edge)
2. กด F12 → Console
3. พิมพ์: `localStorage.clear()`
4. กด Enter
5. ปิด browser ทั้งหมด

### ขั้นตอนที่ 6: รัน frontend ใหม่
```bash
cd frontend
npm run dev
```

### ขั้นตอนที่ 7: ทดสอบ

1. เปิด http://localhost:3000
2. Login เข้าระบบ
3. เปิด Console (F12) ควรเห็น:
   ```
   [PiniaPersist] Restored store "auth" from localStorage
   [Axios] ส่ง token: eyJhbGci...
   ```
4. ตรวจสอบ:
   - ✅ ข้อมูล users แสดงในตาราง
   - ✅ เห็นชื่อผู้ใช้และ role บน app bar
   - ✅ กด F5 refresh ไม่เด้งออกไปหน้า login
   - ✅ สามารถ CRUD users ได้

## 🔍 วิธีตรวจสอบว่ามีปัญหาหรือไม่

เปิด Browser Console (F12) แล้วดู:

### ✅ ถูกต้อง (ควรเห็น):
```
[PiniaPersist] Restored store "auth" from localStorage
[Axios] ส่ง token: eyJhbGciOiJIUz...
```

### ❌ ผิดพลาด (ถ้าเห็นนี่แสดงว่ายังมีปัญหา):
```
[Axios] ไม่มี token จะส่ง
[Axios] 401 Unauthorized
```

## 📋 Checklist

- [ ] อยู่ branch ถูกต้อง: `claude/rebuild-evaluation-frontend-vue3-01EGigWtuypFxMSJ73pTWwMa`
- [ ] ลบไฟล์เก่า: `axios.client.js`, `piniaPersist.client.js`
- [ ] สร้างไฟล์ใหม่: `01.piniaPersist.client.js`, `02.axios.client.js`
- [ ] Clear localStorage
- [ ] รัน frontend ใหม่
- [ ] Login สำเร็จ ข้อมูลแสดง
- [ ] กด F5 ไม่เด้งออกไปหน้า login
- [ ] เห็น logs ถูกต้องใน console

## 🆘 ถ้ายังมีปัญหา

ส่ง screenshot ของ:
1. Browser Console (F12)
2. Network tab → Headers ของ API request
3. ไฟล์ที่อยู่ใน `frontend/plugins/`

---

**หมายเหตุ:** ไฟล์ต้องชื่อ `01.` และ `02.` นำหน้า เพื่อให้ Nuxt โหลดตาม order ที่ถูกต้อง
