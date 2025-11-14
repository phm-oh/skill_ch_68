import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    redirect: () => '/login', // ✅ ให้ router guard จัดการ redirect ตาม role
    meta: { requiresAuth: true }
  },

  // Admin Routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/hr/HRDashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/users',
    name: 'UsersManage',
    component: () => import('@/views/hr/UsersManage.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/periods',
    name: 'PeriodsManage',
    component: () => import('@/views/hr/PeriodsManage.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/topics',
    name: 'TopicsManage',
    component: () => import('@/views/hr/TopicsManage.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/indicators',
    name: 'IndicatorsManage',
    component: () => import('@/views/hr/IndicatorsManage.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/assignments',
    name: 'AssignmentsManage',
    component: () => import('@/views/hr/AssignmentsManage.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/reports',
    name: 'ReportsView',
    component: () => import('@/views/hr/ReportsView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },

  // Evaluatee Routes
  {
    path: '/evaluatee',
    name: 'EvaluateeDashboard',
    component: () => import('@/views/evaluatee/EvaluateeDashboard.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/evaluation',
    name: 'SelfEvaluation',
    component: () => import('@/views/evaluatee/SelfEvaluation.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/evidence',
    name: 'EvidenceManage',
    component: () => import('@/views/evaluatee/EvidenceManage.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/report',
    name: 'MyReport',
    component: () => import('@/views/evaluatee/MyReport.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },

  // Evaluator Routes
  {
    path: '/evaluator',
    name: 'EvaluatorDashboard',
    component: () => import('@/views/committee/CommitteeDashboard.vue'),
    meta: { requiresAuth: true, role: 'evaluator' }
  },
  {
    path: '/evaluator/assignments',
    name: 'AssignmentsList',
    component: () => import('@/views/committee/AssignmentsList.vue'),
    meta: { requiresAuth: true, role: 'evaluator' }
  },
  {
    path: '/evaluator/review/:evaluateeId/:periodId',
    name: 'EvaluationReview',
    component: () => import('@/views/committee/EvaluationReview.vue'),
    meta: { requiresAuth: true, role: 'evaluator' }
  },
  {
    path: '/evaluator/approval',
    name: 'ApprovalPage',
    component: () => import('@/views/committee/ApprovalPage.vue'),
    meta: { requiresAuth: true, role: 'evaluator' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  // ✅ รอ initialization ให้เสร็จก่อน (fetch user จาก token)
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  // Check authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('[Router] Not authenticated, redirecting to /login');
    return next('/login');
  }

  // ✅ ถ้าเข้า '/' (home) และ authenticated แล้ว ให้ redirect ตาม role
  if (to.path === '/' && authStore.isAuthenticated && authStore.user) {
    const redirectPath = authStore.isAdmin ? '/admin' :
                        authStore.isEvaluator ? '/evaluator' : '/evaluatee';
    console.log('[Router] Home redirect based on role:', redirectPath);
    return next(redirectPath);
  }

  // ✅ ถ้าไปหน้า login แต่ authenticated แล้ว ให้ redirect ไปหน้าหลัก
  if (to.path === '/login' && authStore.isAuthenticated && authStore.user) {
    const redirectPath = authStore.isAdmin ? '/admin' :
                        authStore.isEvaluator ? '/evaluator' : '/evaluatee';
    console.log('[Router] Already authenticated, redirecting to:', redirectPath);
    return next(redirectPath);
  }

  // Check role permission
  if (to.meta.role) {
    if (!authStore.user) {
      console.log('[Router] No user data, redirecting to /login');
      return next('/login');
    }

    if (authStore.user.role !== to.meta.role) {
      const redirectPath = authStore.isAdmin ? '/admin' :
                          authStore.isEvaluator ? '/evaluator' : '/evaluatee';
      console.log('[Router] Role mismatch, redirecting to:', redirectPath);
      return next(redirectPath);
    }
  }

  console.log('[Router] ✅ Allowing access to:', to.path);
  next();
});

export default router;
