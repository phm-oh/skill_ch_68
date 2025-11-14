<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Dashboard - ผู้ดูแลระบบ</h1>
          <v-btn color="error" @click="handleLogout">
            <v-icon icon="mdi-logout" start></v-icon>
            ออกจากระบบ
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card color="primary">
          <v-card-text class="text-white">
            <div class="text-h6">จำนวนผู้ใช้ทั้งหมด</div>
            <div class="text-h3">{{ stats.totalUsers }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card color="success">
          <v-card-text class="text-white">
            <div class="text-h6">รอบการประเมิน</div>
            <div class="text-h3">{{ stats.totalPeriods }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card color="warning">
          <v-card-text class="text-white">
            <div class="text-h6">รอบที่เปิดอยู่</div>
            <div class="text-h3">{{ stats.activePeriods }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card color="info">
          <v-card-text class="text-white">
            <div class="text-h6">การมอบหมาย</div>
            <div class="text-h3">{{ stats.totalAssignments }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <base-card title="เมนูจัดการ" icon="mdi-menu">
          <v-row>
            <v-col cols="12" md="6" lg="3" v-for="menu in menus" :key="menu.title">
              <v-card class="pa-4 text-center" hover @click="$router.push(menu.path)">
                <v-icon :icon="menu.icon" size="48" :color="menu.color"></v-icon>
                <div class="text-h6 mt-2">{{ menu.title }}</div>
                <div class="text-caption text-grey">{{ menu.description }}</div>
              </v-card>
            </v-col>
          </v-row>
        </base-card>
      </v-col>
    </v-row>

    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..." />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import userService from '@/services/userService';
import periodService from '@/services/periodService';
import assignmentService from '@/services/assignmentService';
import BaseCard from '@/components/base/BaseCard.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const stats = ref({
  totalUsers: 0,
  totalPeriods: 0,
  activePeriods: 0,
  totalAssignments: 0
});

const menus = [
  { title: 'จัดการผู้ใช้', icon: 'mdi-account-multiple', color: 'primary', path: '/admin/users', description: 'เพิ่ม แก้ไข ลบผู้ใช้' },
  { title: 'จัดการรอบการประเมิน', icon: 'mdi-calendar', color: 'success', path: '/admin/periods', description: 'กำหนดรอบการประเมิน' },
  { title: 'จัดการหัวข้อ', icon: 'mdi-file-document', color: 'warning', path: '/admin/topics', description: 'กำหนดหัวข้อการประเมิน' },
  { title: 'จัดการตัวชี้วัด', icon: 'mdi-chart-box', color: 'info', path: '/admin/indicators', description: 'กำหนดตัวชี้วัดการประเมิน' },
  { title: 'มอบหมายกรรมการ', icon: 'mdi-account-star', color: 'orange', path: '/admin/assignments', description: 'มอบหมายงานประเมิน' },
  { title: 'รายงาน', icon: 'mdi-chart-line', color: 'purple', path: '/admin/reports', description: 'ดูรายงานและสถิติ' }
];

const fetchStats = async () => {
  loading.value = true;
  try {
    const [usersRes, periodsRes, assignmentsRes] = await Promise.all([
      userService.getAll(),
      periodService.getAll(),
      assignmentService.getAll()
    ]);

    stats.value.totalUsers = usersRes.data.data.length;
    stats.value.totalPeriods = periodsRes.data.data.length;
    stats.value.activePeriods = periodsRes.data.data.filter(p => p.is_active).length;
    stats.value.totalAssignments = assignmentsRes.data.data.length;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

onMounted(() => {
  fetchStats();
});
</script>
