// ~/plugins/auth-init.client.js
// ✅ Plugin สำหรับ hydrate token จาก localStorage เมื่อ reload หน้า
export default defineNuxtPlugin(() => {
  console.log('[Auth Plugin] 🚀 Starting auth initialization...')

  const auth = useAuthStore()

  // ตรวจสอบว่ามี token ใน localStorage หรือไม่
  const storedToken = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('auth_user')

  console.log('[Auth Plugin] 🔍 Checking localStorage...')
  console.log('[Auth Plugin] 🔑 Token exists:', !!storedToken)
  console.log('[Auth Plugin] 👤 User exists:', !!storedUser)

  // Hydrate จาก localStorage
  auth.hydrateFromStorage()

  console.log('[Auth Plugin] 💾 After hydration - Store token:', !!auth.token)
  console.log('[Auth Plugin] 💾 After hydration - Store user:', !!auth.user)
  console.log('[Auth Plugin] ✅ Auth initialization completed')
})
