// frontend/composables/useMenu.js
// 🔧 แก้ไขให้เมนูตรงกับหน้าที่มีจริง 100%

import { ref, isRef, computed } from 'vue'

// ถ้า backend ส่ง 'evaluatee' ให้ map มาเป็น 'user'
function normalizeRole(r) {
  const x = (r || '').toString().toLowerCase()
  if (x === 'evaluatee') return 'user'
  return ['admin', 'evaluator', 'user'].includes(x) ? x : 'user'
}

const MAP = {
  // ============= ADMIN MENU =============
  admin: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
        { label: 'Users', to: '/users', icon: 'mdi-account-multiple-outline' }, // ✅ เฉพาะ admin
      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { label: 'Periods', to: '/admin/periods', icon: 'mdi-calendar-range' },
        { label: 'Topics', to: '/admin/topics', icon: 'mdi-format-list-bulleted' },
        { label: 'Indicators', to: '/admin/indicators', icon: 'mdi-chart-box-outline' },
        { label: 'Assignments', to: '/admin/assignments', icon: 'mdi-account-multiple-check' },
        { label: 'Reports', to: '/admin/reports', icon: 'mdi-chart-areaspline' },
        { label: 'API Docs', href: 'http://localhost:7000/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  // ============= EVALUATOR MENU =============
  evaluator: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
        // ❌ ลบ Users ออก - ไม่ให้ evaluator เห็น
      ]
    },
    {
      label: 'EVALUATION',
      items: [
        { label: 'My Tasks', to: '/evaluator/tasks', icon: 'mdi-clipboard-check-outline' },
        { label: 'Sign Document', to: '/evaluator/signature', icon: 'mdi-draw-pen' },
        { label: 'API Docs', href: 'http://localhost:7000/docs', target: '_blank', icon: 'mdi-book-open-outline' },
      ]
    }
  ],

  // ============= USER (EVALUATEE) MENU =============
  user: [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/', icon: 'mdi-view-dashboard-outline' },
        // ❌ ลบ Users ออก - ไม่ให้ evaluatee เห็น
      ]
    },
    {
      label: 'MY EVALUATION',
      items: [
        { label: 'Profile', to: '/me/profile', icon: 'mdi-account' },
        { label: 'Self Assessment', to: '/me/self-assess', icon: 'mdi-star-check-outline' },
        { label: 'Progress', to: '/me/progress', icon: 'mdi-progress-clock' },
      ]
    }
  ]
}

export function useMenu(roleInput = 'user') {
  const r = isRef(roleInput) ? roleInput : ref(roleInput)

  // ให้เมนูปลอดภัยแม้ role ยังไม่พร้อม (ตอน hydrate แรก ๆ)
  const menu = computed(() => {
    const key = normalizeRole(r.value)
    return MAP[key] || MAP.user
  })

  return { menu }
}