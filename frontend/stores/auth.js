// ~/stores/auth.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null
  }),
  getters: {
    isLogged: (s) => !!s.token,
    userRole: (s) => s.user?.role || 'user'
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.user = user
      // ✅ ไม่ต้อง manual save เพราะ piniaPersist จัดการให้แล้ว
    },
    logout() {
      this.token = null
      this.user = null
      // ✅ ไม่ต้อง manual remove เพราะ piniaPersist จัดการให้แล้ว
    }
  }
})
