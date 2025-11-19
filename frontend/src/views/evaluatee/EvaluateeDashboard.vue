<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Dashboard - ผู้ถูกประเมิน</h1>
          <v-btn color="error" @click="handleLogout">
            <v-icon icon="mdi-logout" start></v-icon>ออกจากระบบ
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="activePeriods.length > 0">
      <v-col cols="12" v-for="period in activePeriods" :key="period.id">
        <base-card :title="`รอบการประเมิน: ${period.name}`" icon="mdi-calendar-clock">
          <v-row>
            <v-col cols="12" md="8">
              <div class="mb-3">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-subtitle-1">ความคืบหน้าการประเมิน</span>
                  <span class="text-subtitle-2">{{ getProgress(period.id).completed }} / {{ getProgress(period.id).total }} ตัวชี้วัด</span>
                </div>
                <v-progress-linear :model-value="getProgressPercentage(period.id)" height="25" color="success" striped>
                  <template v-slot:default><strong>{{ getProgressPercentage(period.id) }}%</strong></template>
                </v-progress-linear>
              </div>
              <div class="d-flex gap-4 align-center">
                <div><v-icon icon="mdi-calendar-start" size="small"></v-icon> เริ่ม: {{ formatDate(period.start_date) }}</div>
                <div><v-icon icon="mdi-calendar-end" size="small"></v-icon> สิ้นสุด: {{ formatDate(period.end_date) }}</div>
                <div>
                  <v-chip color="warning" variant="flat">
                    <v-icon icon="mdi-clock-alert" start></v-icon>เหลือเวลาอีก {{ getDaysRemaining(period.end_date) }} วัน
                  </v-chip>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center justify-center">
              <div class="text-center">
                <div class="text-subtitle-2 mb-2">สถานะการประเมิน</div>
                <status-chip :status="getEvaluationStatus(period.id)" size="large" />
              </div>
            </v-col>
          </v-row>
        </base-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <base-card title="เมนูด่วน" icon="mdi-lightning-bolt">
          <v-row>
            <v-col cols="12" md="4" v-for="action in quickActions" :key="action.title">
              <v-card class="pa-4 text-center" hover @click="$router.push(action.path)" :color="action.color" variant="tonal">
                <v-icon :icon="action.icon" size="56" :color="action.color"></v-icon>
                <div class="text-h6 mt-3">{{ action.title }}</div>
                <div class="text-caption text-grey-darken-1 mt-1">{{ action.description }}</div>
              </v-card>
            </v-col>
          </v-row>
        </base-card>
      </v-col>
    </v-row>

    <v-row v-if="!loading && activePeriods.length === 0">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" prominent>
          <v-alert-title>ไม่มีรอบการประเมินที่เปิดอยู่</v-alert-title>
          กรุณารอจนกว่าฝ่าย HR จะเปิดรอบการประเมิน
        </v-alert>
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
import periodService from '@/services/periodService';
import evaluationService from '@/services/evaluationService';
import topicService from '@/services/topicService';
import assignmentService from '@/services/assignmentService';
import BaseCard from '@/components/base/BaseCard.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';
import StatusChip from '@/components/base/StatusChip.vue';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const activePeriods = ref([]);
const evaluationData = ref({});
const topicsData = ref({});

const quickActions = [
  { title: 'ประเมินตนเอง', icon: 'mdi-clipboard-check', color: 'primary', path: '/evaluatee/evaluation', description: 'กรอกแบบประเมินตนเอง' },
  { title: 'อัปโหลดหลักฐาน', icon: 'mdi-file-upload', color: 'success', path: '/evaluatee/evidence', description: 'จัดการไฟล์หลักฐาน' },
  { title: 'ดูรายงาน', icon: 'mdi-chart-box', color: 'info', path: '/evaluatee/report', description: 'ดูผลการประเมินของคุณ' }
];

const fetchData = async () => {
  loading.value = true;
  try {
    // Get assignments for this evaluatee to find which periods they're assigned to
    const assignmentsRes = await assignmentService.getMine();
    const assignments = assignmentsRes.data.items || [];

    // Extract unique periods from assignments (only active ones)
    const periodMap = new Map();
    assignments.forEach(assignment => {
      if (assignment.is_active && assignment.period_id) {
        periodMap.set(assignment.period_id, {
          id: assignment.period_id,
          name: assignment.period_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          is_active: assignment.is_active
        });
      }
    });
    activePeriods.value = Array.from(periodMap.values());

    for (const period of activePeriods.value) {
      try {
        const evalRes = await evaluationService.getMyResults(period.id);
        const results = evalRes.data.data || [];
        evaluationData.value[period.id] = { status: determineStatus(results), results };

        const topicsRes = await topicService.getAll();
        const periodTopics = topicsRes.data.data.filter(t => t.period_id === period.id);

        let totalIndicators = 0;
        let completedIndicators = 0;

        for (const topic of periodTopics) {
          const indicators = topic.indicators || [];
          totalIndicators += indicators.length;
          completedIndicators += results.filter(r =>
            indicators.some(ind => ind.id === r.indicator_id) && r.self_score !== null
          ).length;
        }
        topicsData.value[period.id] = { total: totalIndicators, completed: completedIndicators };
      } catch (err) {
        console.error(`Error fetching data for period ${period.id}:`, err);
      }
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const determineStatus = (results) => {
  if (!results || results.length === 0) return 'draft';
  const hasApproved = results.some(r => r.approver_score !== null);
  const hasEvaluated = results.some(r => r.evaluator_score !== null);
  const allSubmitted = results.every(r => r.self_score !== null);
  if (hasApproved) return 'approved';
  if (hasEvaluated) return 'evaluated';
  if (allSubmitted) return 'submitted';
  return 'draft';
};

const getProgress = (periodId) => topicsData.value[periodId] || { total: 0, completed: 0 };

const getProgressPercentage = (periodId) => {
  const progress = getProgress(periodId);
  return progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);
};

const getEvaluationStatus = (periodId) => evaluationData.value[periodId]?.status || 'draft';

const getDaysRemaining = (endDate) => {
  const diffDays = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const formatDate = (date) => new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

const handleLogout = async () => { await authStore.logout(); };

onMounted(() => { fetchData(); });
</script>

<style scoped>
.gap-4 { gap: 1rem; }
</style>
