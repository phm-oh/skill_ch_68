<template>
  <v-container fluid>
    <v-btn variant="text" color="primary" to="/evaluator" class="mb-2">
      <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
    </v-btn>
    <h1 class="text-h4 mb-4">อนุมัติการประเมิน</h1>
    <v-card class="mb-4">
      <v-tabs v-model="selectedTab" bg-color="primary">
        <v-tab value="pending">รอการอนุมัติ
          <v-badge v-if="counts.pending > 0" :content="counts.pending" color="warning" inline class="ml-2"></v-badge>
        </v-tab>
        <v-tab value="approved">อนุมัติแล้ว
          <v-badge v-if="counts.approved > 0" :content="counts.approved" color="success" inline class="ml-2"></v-badge>
        </v-tab>
      </v-tabs>
    </v-card>
    <v-card v-if="selectedTab === 'pending' && selected.length > 0" class="mb-4 pa-4">
      <div class="d-flex align-center justify-space-between">
        <div class="text-body-1">
          <v-icon icon="mdi-checkbox-marked-circle" color="primary"></v-icon>
          เลือกแล้ว {{ selected.length }} รายการ
        </div>
        <v-btn color="success" variant="elevated" @click="openBulkApproveDialog">
          <v-icon icon="mdi-check-all" start></v-icon>อนุมัติที่เลือก
        </v-btn>
      </div>
    </v-card>
    <BaseTable :headers="headers" :items="filteredItems" :loading="loading">
      <template #item.select="{ item }">
        <v-checkbox-btn v-if="selectedTab === 'pending'" :model-value="isSelected(item)" @update:model-value="toggleSelect(item)" hide-details></v-checkbox-btn>
      </template>
      <template #item.total_score="{ item }">
        <span class="font-weight-bold">{{ item.total_score || '-' }}</span>
      </template>
      <template #item.status="{ item }">
        <StatusChip :status="item.status" size="small" />
      </template>
      <template #item.actions="{ item }">
        <div class="d-flex ga-2">
          <v-btn color="primary" size="small" variant="tonal" @click="goToReview(item)">
            <v-icon icon="mdi-eye" start></v-icon>ดูรายละเอียด
          </v-btn>
          <v-btn v-if="selectedTab === 'pending'" color="success" size="small" variant="elevated" @click="openApproveDialog(item)">
            <v-icon icon="mdi-check-circle" start></v-icon>อนุมัติ
          </v-btn>
        </div>
      </template>
    </BaseTable>
    <BaseDialog v-model="approveDialog.show" :title="approveDialog.isBulk ? 'ยืนยันการอนุมัติหลายรายการ' : 'ยืนยันการอนุมัติ'" icon="mdi-check-circle" confirm-text="อนุมัติ" confirm-color="success" :loading="approving" @confirm="handleApprove" @cancel="closeApproveDialog">
      <div v-if="approveDialog.isBulk">
        <p>คุณต้องการอนุมัติการประเมินจำนวน <strong>{{ approveDialog.items.length }}</strong> รายการ ใช่หรือไม่?</p>
        <v-list density="compact" class="mt-3">
          <v-list-item v-for="item in approveDialog.items" :key="item.id">
            <template #prepend><v-icon icon="mdi-account" color="primary"></v-icon></template>
            <v-list-item-title>{{ item.full_name }}</v-list-item-title>
            <v-list-item-subtitle>{{ item.department }} - {{ item.period_name }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
      <div v-else>
        <p>คุณต้องการอนุมัติการประเมินของ</p>
        <v-card class="mt-3 pa-3" variant="tonal">
          <div><strong>ชื่อ:</strong> {{ approveDialog.items[0]?.full_name }}</div>
          <div><strong>แผนก:</strong> {{ approveDialog.items[0]?.department }}</div>
          <div><strong>รอบการประเมิน:</strong> {{ approveDialog.items[0]?.period_name }}</div>
          <div><strong>คะแนนรวม:</strong> {{ approveDialog.items[0]?.total_score }}</div>
        </v-card>
      </div>
    </BaseDialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import assignmentService from '@/services/assignmentService';
import evaluationService from '@/services/evaluationService';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const loading = ref(false);
const approving = ref(false);
const selectedTab = ref('pending');
const assignments = ref([]);
const evaluations = ref([]);
const selected = ref([]);
const approveDialog = ref({ show: false, isBulk: false, items: [] });

const baseHeaders = [
  { title: 'ชื่อ-สกุล', key: 'full_name', sortable: true },
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'คะแนนรวม', key: 'total_score', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'status', sortable: true, align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
];

const headers = computed(() =>
  selectedTab.value === 'pending'
    ? [{ title: '', key: 'select', sortable: false, width: 50 }, ...baseHeaders]
    : baseHeaders
);

// Combine assignments with their evaluation status
const combinedData = computed(() => {
  console.log('[ApprovalPage] assignments:', assignments.value);
  console.log('[ApprovalPage] evaluations:', evaluations.value);

  return assignments.value.map(assignment => {
    // Get all evaluation results for this assignment
    const results = evaluations.value.filter(
      e => e.evaluatee_id === assignment.evaluatee_id && e.period_id === assignment.period_id
    );

    // Determine evaluation status
    let status = 'pending';
    let totalScore = 0;

    if (results.length > 0) {
      const allEvaluated = results.every(r => r.evaluator_score !== null && r.evaluator_score !== undefined);
      const anyApproved = results.some(r => r.status === 'approved');

      if (anyApproved) {
        status = 'approved';
      } else if (allEvaluated) {
        status = 'evaluated';
      }

      // Calculate total score
      totalScore = results.reduce((sum, r) => sum + (parseFloat(r.evaluator_score) || 0), 0);
    }

    return {
      id: `${assignment.evaluatee_id}-${assignment.period_id}`,
      evaluatee_id: assignment.evaluatee_id,
      period_id: assignment.period_id,
      full_name: assignment.evaluatee_name || '-',
      department: assignment.department_name || '-',
      period_name: assignment.period_name || '-',
      total_score: totalScore.toFixed(2),
      status: status,
      results: results
    };
  });
});

const filteredItems = computed(() => {
  const targetStatus = selectedTab.value === 'pending' ? 'evaluated' : 'approved';
  return combinedData.value.filter(item => item.status === targetStatus);
});

const counts = computed(() => ({
  pending: combinedData.value.filter(item => item.status === 'evaluated').length,
  approved: combinedData.value.filter(item => item.status === 'approved').length
}));

const isSelected = (item) => selected.value.some(s => s.id === item.id);

const toggleSelect = (item) => {
  const index = selected.value.findIndex(s => s.id === item.id);
  index > -1 ? selected.value.splice(index, 1) : selected.value.push(item);
};

const goToReview = (item) => router.push(`/evaluator/review/${item.evaluatee_id}/${item.period_id}`);

const openApproveDialog = (item) => {
  approveDialog.value = { show: true, isBulk: false, items: [item] };
};

const openBulkApproveDialog = () => {
  approveDialog.value = { show: true, isBulk: true, items: [...selected.value] };
};

const closeApproveDialog = () => {
  approveDialog.value = { show: false, isBulk: false, items: [] };
};

const handleApprove = async () => {
  approving.value = true;
  try {
    const items = approveDialog.value.items;

    // Approve all evaluation results for each item
    for (const item of items) {
      if (item.results && item.results.length > 0) {
        await Promise.all(item.results.map(result =>
          // Update each evaluation result to approved status
          evaluationService.evaluate({
            evaluatee_id: item.evaluatee_id,
            indicator_id: result.indicator_id,
            period_id: item.period_id,
            score: result.evaluator_score
          })
        ));
      }
    }

    notificationStore.success(`อนุมัติการประเมินสำเร็จ ${items.length} รายการ`);
    selected.value = [];
    closeApproveDialog();
    await fetchData();
  } catch (error) {
    console.error('[ApprovalPage] Approve error:', error);
    notificationStore.error('ไม่สามารถอนุมัติได้: ' + (error.response?.data?.message || error.message));
  } finally {
    approving.value = false;
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    console.log('[ApprovalPage] Fetching data...');
    const assignmentsRes = await assignmentService.getMine();
    assignments.value = assignmentsRes.data.items || assignmentsRes.data.data || [];

    console.log('[ApprovalPage] Assignments:', assignments.value);

    // Fetch evaluations for each assignment
    const evaluationPromises = assignments.value.map(assignment =>
      evaluationService.getByEvaluatee(assignment.evaluatee_id, assignment.period_id)
        .then(res => res.data.items || res.data.data || [])
        .catch(err => {
          console.error(`[ApprovalPage] Error fetching evaluations for ${assignment.evaluatee_id}:`, err);
          return [];
        })
    );

    const evaluationResults = await Promise.all(evaluationPromises);
    evaluations.value = evaluationResults.flat();

    console.log('[ApprovalPage] Evaluations:', evaluations.value);
  } catch (error) {
    console.error('[ApprovalPage] Fetch error:', error);
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.ml-2 {
  margin-left: 8px;
}
</style>
