// middleware/auth.global.ts
// @ts-ignore
export default defineNuxtRouteMiddleware((to) => {
  // @ts-ignore
  const auth = useAuthStore()
  // @ts-ignore
  if (process.server) return

  // รายการหน้า/พาธที่ต้องล็อกอินก่อนเข้า
  const protectedRoots = ['/', '/users', '/upload']
  const needAuth = protectedRoots.some(p => to.path === p || to.path.startsWith(p + '/'))

  if (needAuth && !auth.token) {
    // @ts-ignore
    return navigateTo('/login')
  }
})


// frontend/middleware/auth.global.ts
// ✅ Nuxt 3 Global Middleware - ตรวจสอบ JWT ก่อนเข้าหน้าที่ต้อง login
// @ts-ignore
// export default defineNuxtRouteMiddleware((to) => {
//   // 1. โหลด auth store
//   // @ts-ignore
//   const auth = useAuthStore()
  
//   // 2. Skip ถ้าเป็น SSR (Server-Side Rendering)
//   // @ts-ignore
//   if (process.server) return

//   // 3. รายการหน้าที่ต้อง login ก่อนเข้า
//   const protectedRoutes = [
//     '/',           // Dashboard
//     '/users',      // จัดการผู้ใช้
//     '/upload',     // อัปโหลดไฟล์
//     '/admin',      // หน้า admin ทั้งหมด
//     '/evaluatee',  // หน้าผู้รับการประเมิน
//     '/evaluator'   // หน้ากรรมการ
//   ]

//   // 4. เช็คว่าหน้าที่กำลังจะเข้าต้อง login หรือไม่
//   const needAuth = protectedRoutes.some(route => 
//     to.path === route || to.path.startsWith(route + '/')
//   )

//   // 5. ถ้าต้อง login แต่ยังไม่ได้ login → redirect ไป /login
//   if (needAuth && !auth.token) {
//     console.log('[Auth Middleware] ❌ ไม่มี token, redirect ไป /login')
//     // @ts-ignore
//     return navigateTo('/login')
//   }

//   // 6. ผ่านการตรวจสอบแล้ว ให้เข้าหน้าปกติ
//   console.log('[Auth Middleware] ✅ มี token, อนุญาตเข้าหน้า:', to.path)
// })


