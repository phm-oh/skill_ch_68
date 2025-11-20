<template>
  <v-container fluid>
    <v-btn variant="text" color="primary" to="/evaluator" class="mb-2">
      <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
    </v-btn>
    <h1 class="text-h4 mb-4">รายการงานประเมินที่ได้รับมอบหมาย</h1>

    <v-card class="mb-4">
      <v-tabs v-model="selectedTab" bg-color="primary">
        <v-tab value="all">
          ทั้งหมด
          <v-badge v-if="counts.all > 0" :content="counts.all" color="white" text-color="primary" inline class="ml-2"></v-badge>
        </v-tab>
        <v-tab value="pending">
          รอประเมิน
          <v-badge v-if="counts.pending > 0" :content="counts.pending" color="warning" inline class="ml-2"></v-badge>
        </v-tab>
        <v-tab value="evaluated">
          ประเมินแล้ว
          <v-badge v-if="counts.evaluated > 0" :content="counts.evaluated" color="orange" inline class="ml-2"></v-badge>
        </v-tab>
        <v-tab value="approved">
          อนุมัติแล้ว
          <v-badge v-if="counts.approved > 0" :content="counts.approved" color="success" inline class="ml-2"></v-badge>
        </v-tab>
      </v-tabs>
    </v-card>

    <BaseTable :headers="headers" :items="filteredItems" :loading="loading">
      <template #item.submission_status="{ item }">
        <v-chip
          :color="item.submission_status === 'submitted' ? 'blue' : 'grey'"
          size="small"
          variant="flat"
        >
          {{ item.submission_status === 'submitted' ? 'ส่งแล้ว' : 'ยังไม่ส่ง' }}
        </v-chip>
      </template>

      <template #item.evaluation_status="{ item }">
        <StatusChip :status="item.evaluation_status" size="small" />
      </template>

      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          size="small"
          variant="tonal"
          @click="goToEvaluate(item)"
        >
          <v-icon icon="mdi-clipboard-edit" start></v-icon>
          ประเมิน
        </v-btn>
      </template>
    </BaseTable>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import assignmentService from '@/services/assignmentService';
import evaluationService from '@/services/evaluationService';

const router = useRouter();
const notificationStore = useNotificationStore();

const loading = ref(false);
const selectedTab = ref('all');
const assignments = ref([]);
const evaluations = ref([]);

const headers = [
  { title: 'ชื่อ-สกุล', key: 'full_name', sortable: true },
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'สถานะการส่งงาน', key: 'submission_status', sortable: true, align: 'center' },
  { title: 'สถานะการประเมิน', key: 'evaluation_status', sortable: true, align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
];

// รวมข้อมูล assignments และ evaluations
const combinedData = computed(() => {
  return assignments.value.map(assignment => {
    // หา evaluation ที่ตรงกับ assignment นี้
    const evaluation = evaluations.value.find(
      e => e.evaluatee_id === assignment.evaluatee_id && e.period_id === assignment.period_id
    );

    // Map status to evaluation_status
    let evaluationStatus = 'pending';
    if (evaluation?.status === 'approved') {
      evaluationStatus = 'approved';
    } else if (evaluation?.status === 'evaluated') {
      evaluationStatus = 'evaluated';
    } else if (evaluation?.status === 'submitted') {
      evaluationStatus = 'pending';
    }

    return {
      id: assignment.id,
      evaluatee_id: assignment.evaluatee_id,
      period_id: assignment.period_id,
      full_name: assignment.evaluatee_name || '-',
      period_name: assignment.period_name || '-',
      submission_status: evaluation?.status === 'submitted' || evaluation?.status === 'evaluated' || evaluation?.status === 'approved' ? 'submitted' : 'not_submitted',
      evaluation_status: evaluationStatus
    };
  });
});

// กรองตาม tab ที่เลือก
const filteredItems = computed(() => {
  if (selectedTab.value === 'all') {
    return combinedData.value;
  }
  return combinedData.value.filter(item => item.evaluation_status === selectedTab.value);
});

// นับจำนวนแต่ละสถานะ
const counts = computed(() => ({
  all: combinedData.value.length,
  pending: combinedData.value.filter(item => item.evaluation_status === 'pending').length,
  evaluated: combinedData.value.filter(item => item.evaluation_status === 'evaluated').length,
  approved: combinedData.value.filter(item => item.evaluation_status === 'approved').length
}));

// ไปหน้าประเมิน
const goToEvaluate = (item) => {
  router.push(`/evaluator/review/${item.evaluatee_id}/${item.period_id}`);
};

// โหลดข้อมูล
const fetchData = async () => {
  loading.value = true;
  try {
    const [assignmentsRes, evaluationsRes] = await Promise.all([
      assignmentService.getMine(),
      evaluationService.getAll()
    ]);

    // Backend ส่ง { success: true, items: [...] }
    assignments.value = assignmentsRes.data.items || assignmentsRes.data.data || [];
    evaluations.value = evaluationsRes.data.items || evaluationsRes.data.data || [];
  } catch (error) {
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
