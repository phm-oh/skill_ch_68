<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">Dashboard - กรรมการประเมิน</h1>
          <v-btn color="error" @click="handleLogout">
            <v-icon icon="mdi-logout" start></v-icon>ออกจากระบบ
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3" v-for="card in statCards" :key="card.title">
        <v-card :color="card.color">
          <v-card-text class="text-white">
            <div class="text-h6">{{ card.title }}</div>
            <div class="text-h3">{{ card.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <base-card title="งานที่ต้องประเมิน (Top 5)" icon="mdi-clipboard-list">
          <v-table v-if="topAssignments.length > 0">
            <thead>
              <tr>
                <th>ลำดับ</th>
                <th>ชื่อผู้รับการประเมิน</th>
                <th>รอบการประเมิน</th>
                <th>สถานะ</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topAssignments" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.evaluateeName }}</td>
                <td>{{ item.periodName }}</td>
                <td><status-chip :status="item.status" /></td>
                <td>
                  <v-btn color="primary" size="small" @click="goToEvaluate(item)" :disabled="item.status === 'approved'">
                    <v-icon icon="mdi-clipboard-edit" start></v-icon>
                    {{ item.status === 'approved' ? 'เสร็จสิ้น' : 'ไปประเมิน' }}
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info" variant="tonal">ไม่มีงานที่ต้องดำเนินการ</v-alert>
        </base-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <base-card title="เมนูด่วน" icon="mdi-lightning-bolt">
          <v-row>
            <v-col cols="12" md="6" v-for="action in quickActions" :key="action.title">
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

    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..." />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import assignmentService from '@/services/assignmentService';
import evaluationService from '@/services/evaluationService';
import BaseCard from '@/components/base/BaseCard.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const loading = ref(false);
const assignments = ref([]);
const evaluations = ref([]);

const quickActions = [
  { title: 'ดูรายการทั้งหมด', icon: 'mdi-format-list-bulleted', color: 'primary', path: '/evaluator/assignments', description: 'ดูงานที่ได้รับมอบหมายทั้งหมด' },
  { title: 'อนุมัติการประเมิน', icon: 'mdi-check-circle', color: 'success', path: '/evaluator/approval', description: 'อนุมัติผลการประเมิน' }
];

const stats = computed(() => {
  const pending = evaluations.value.filter(e => e.evaluator_score === null && e.self_score !== null).length;
  const evaluated = evaluations.value.filter(e => e.evaluator_score !== null && e.approver_score === null).length;
  const approved = evaluations.value.filter(e => e.approver_score !== null).length;
  const total = evaluations.value.length;
  const progress = total > 0 ? Math.round(((evaluated + approved) / total) * 100) : 0;
  return { pending, evaluated, approved, progress };
});

const statCards = computed(() => [
  { title: 'รอประเมิน', value: stats.value.pending, color: 'warning' },
  { title: 'ประเมินแล้ว', value: stats.value.evaluated, color: 'orange' },
  { title: 'อนุมัติแล้ว', value: stats.value.approved, color: 'success' },
  { title: 'ความคืบหน้า', value: `${stats.value.progress}%`, color: 'primary' }
]);

const topAssignments = computed(() => {
  const assignmentMap = new Map();
  assignments.value.forEach(assignment => {
    const key = `${assignment.evaluatee_id}_${assignment.period_id}`;
    if (!assignmentMap.has(key)) {
      assignmentMap.set(key, {
        id: assignment.id,
        evaluateeId: assignment.evaluatee_id,
        evaluateeName: assignment.evaluatee?.name_th || assignment.evaluatee?.name || 'ไม่ระบุ',
        periodId: assignment.period_id,
        periodName: assignment.period?.name_th || assignment.period?.name || 'ไม่ระบุ',
        status: 'pending'
      });
    }
  });
  evaluations.value.forEach(evaluation => {
    const key = `${evaluation.evaluatee_id}_${evaluation.period_id}`;
    if (assignmentMap.has(key)) {
      const item = assignmentMap.get(key);
      if (evaluation.approver_score !== null) item.status = 'approved';
      else if (evaluation.evaluator_score !== null) item.status = 'evaluated';
    }
  });
  return Array.from(assignmentMap.values())
    .sort((a, b) => ({ pending: 0, evaluated: 1, approved: 2 }[a.status] - { pending: 0, evaluated: 1, approved: 2 }[b.status]))
    .slice(0, 5);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [assignmentsRes, evaluationsRes] = await Promise.all([
      assignmentService.getMine(),
      evaluationService.getAll()
    ]);
    // Backend ส่ง { success: true, items: [...] }
    assignments.value = assignmentsRes.data.items || assignmentsRes.data.data || [];
    const currentUserId = authStore.user?.id;
    const allEvaluations = evaluationsRes.data.items || evaluationsRes.data.data || [];
    evaluations.value = allEvaluations.filter(e => e.evaluator_id === currentUserId);
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const goToEvaluate = (item) => router.push(`/evaluator/review/${item.evaluateeId}/${item.periodId}`);
const handleLogout = async () => await authStore.logout();

onMounted(() => fetchData());
</script>
