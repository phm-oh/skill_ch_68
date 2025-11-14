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
    const token = auth.token

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
