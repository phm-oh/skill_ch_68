<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">แดชบอร์ดฝ่ายบุคลากร</h1>
        <p class="text-grey">ภาพรวมระบบประเมินบุคลากร</p>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row>
      <v-col cols="12" md="3" v-for="stat in statistics" :key="stat.title">
        <v-card elevation="2" :color="stat.color" class="text-white">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h3 font-weight-bold">{{ stat.value }}</div>
                <div class="text-subtitle-1">{{ stat.title }}</div>
              </div>
              <v-icon :icon="stat.icon" size="56" class="opacity-50"></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions & Active Periods -->
    <v-row>
      <!-- Quick Actions -->
      <v-col cols="12" md="4">
        <base-card title="เมนูด่วน" icon="mdi-lightning-bolt">
          <v-list>
            <v-list-item
              v-for="action in quickActions"
              :key="action.title"
              :to="action.route"
              prepend-icon="mdi-chevron-right"
            >
              <v-list-item-title>
                <v-icon :icon="action.icon" class="mr-2"></v-icon>
                {{ action.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </base-card>
      </v-col>

      <!-- Active Periods -->
      <v-col cols="12" md="8">
        <base-card title="รอบการประเมินที่เปิดอยู่" icon="mdi-calendar-clock">
          <v-skeleton-loader v-if="loading" type="list-item-three-line@3"></v-skeleton-loader>
          <v-list v-else-if="activePeriods.length > 0">
            <v-list-item v-for="period in activePeriods" :key="period.id">
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <v-icon icon="mdi-calendar"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ period.period_name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(period.start_date) }} - {{ formatDate(period.end_date) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <status-chip status="active" size="small"></status-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">ไม่มีรอบการประเมินที่เปิดอยู่</v-alert>
        </base-card>
      </v-col>
    </v-row>

    <!-- Loading Overlay -->
    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..."></loading-overlay>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '@/components/base/BaseCard.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';
import periodService from '@/services/periodService';
import userService from '@/services/userService';
import { formatDate } from '@/utils/helpers';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(false);
const statistics = ref([
  { title: 'ผู้ใช้ทั้งหมด', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { title: 'รอบการประเมิน', value: 0, icon: 'mdi-calendar', color: 'success' },
  { title: 'ผู้รับการประเมิน', value: 0, icon: 'mdi-account', color: 'warning' },
  { title: 'กรรมการ', value: 0, icon: 'mdi-account-star', color: 'info' }
]);
const activePeriods = ref([]);
const quickActions = ref([
  { title: 'จัดการผู้ใช้', icon: 'mdi-account-edit', route: '/admin/users' },
  { title: 'จัดการรอบการประเมิน', icon: 'mdi-calendar-plus', route: '/admin/periods' },
  { title: 'จัดการหัวข้อ', icon: 'mdi-format-list-bulleted', route: '/admin/topics' },
  { title: 'มอบหมายกรรมการ', icon: 'mdi-account-multiple-plus', route: '/admin/assignments' },
  { title: 'ดูรายงาน', icon: 'mdi-chart-bar', route: '/admin/reports' }
]);

const loadStatistics = async () => {
  try {
    const [usersRes, periodsRes, evaluateesRes, evaluatorsRes] = await Promise.all([
      userService.getAll(),
      periodService.getAll(),
      userService.getByRole('evaluatee'),
      userService.getByRole('evaluator')
    ]);

    statistics.value[0].value = usersRes.data.data.length;
    statistics.value[1].value = periodsRes.data.data.length;
    statistics.value[2].value = evaluateesRes.data.data.length;
    statistics.value[3].value = evaluatorsRes.data.data.length;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดสถิติได้');
  }
};

const loadActivePeriods = async () => {
  try {
    const response = await periodService.getActive();
    activePeriods.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([loadStatistics(), loadActivePeriods()]);
  } finally {
    loading.value = false;
  }
});
</script>
