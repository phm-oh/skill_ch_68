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
