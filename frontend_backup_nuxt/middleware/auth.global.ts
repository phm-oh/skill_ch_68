// middleware/auth.global.ts
// ✅ Global Middleware สำหรับตรวจสอบ Authentication
// @ts-ignore
export default defineNuxtRouteMiddleware((to) => {
  // Skip ถ้าเป็น Server-Side Rendering
  // @ts-ignore
  if (process.server) return

  // ⭐ สำคัญ: รอให้ client-side plugin ทำงานก่อน
  // @ts-ignore
  if (!process.client) return

  // @ts-ignore
  const auth = useAuthStore()

  console.log('[Auth Middleware] 🔍 Checking route:', to.path)
  console.log('[Auth Middleware] 📦 Current token:', auth.token ? '✅ EXISTS' : '❌ NOT FOUND')

  // ⭐ FIX: ถ้า store ยังไม่มี token ให้ลอง hydrate จาก localStorage ก่อน
  if (!auth.token && typeof localStorage !== 'undefined') {
    const storedToken = localStorage.getItem('auth_token')
    console.log('[Auth Middleware] 🔑 Checking localStorage token:', storedToken ? '✅ FOUND' : '❌ NOT FOUND')

    if (storedToken) {
      console.log('[Auth Middleware] 🔄 Hydrating from localStorage...')
      auth.hydrateFromStorage()
      console.log('[Auth Middleware] 💾 After hydrate - token:', auth.token ? '✅ SUCCESS' : '❌ FAILED')
    }
  }

  // รายการหน้า/พาธที่ต้องล็อกอินก่อนเข้า
  const protectedRoots = ['/', '/users', '/upload', '/admin', '/evaluatee', '/evaluator']
  const needAuth = protectedRoots.some(p => to.path === p || to.path.startsWith(p + '/'))

  console.log('[Auth Middleware] 🛡️ Need auth:', needAuth)
  console.log('[Auth Middleware] 🔐 Has token:', !!auth.token)

  // ถ้าเป็นหน้า login ให้ผ่านเสมอ
  if (to.path === '/login') {
    console.log('[Auth Middleware] ➡️ Login page - allowing access')
    return
  }

  if (needAuth && !auth.token) {
    console.log('[Auth Middleware] ❌ NO TOKEN - Redirecting to /login')
    // @ts-ignore
    return navigateTo('/login')
  }

  console.log('[Auth Middleware] ✅ Access granted to:', to.path)
})
