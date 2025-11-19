<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-btn variant="text" color="primary" to="/admin" class="mb-2">
          <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
        </v-btn>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">รายงานการประเมิน</h1>
          <v-btn color="primary" @click="window.print()" :disabled="!selectedPeriod">
            <v-icon icon="mdi-printer" start></v-icon>Export PDF
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="6">
        <v-select v-model="selectedPeriod" :items="periods" item-title="name_th"
          item-value="id" label="เลือกรอบการประเมิน" variant="outlined"
          density="comfortable" prepend-inner-icon="mdi-calendar"
          @update:model-value="fetchReportData"></v-select>
      </v-col>
    </v-row>
    <v-row v-if="selectedPeriod">
      <v-col cols="12" md="3">
        <v-card color="primary">
          <v-card-text class="text-white">
            <div class="text-subtitle-1">ผู้รับการประเมินทั้งหมด</div>
            <div class="text-h3">{{ statistics.totalEvaluatees }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="blue">
          <v-card-text class="text-white">
            <div class="text-subtitle-1">จำนวนที่ส่งแล้ว</div>
            <div class="text-h3">{{ statistics.submitted }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="orange">
          <v-card-text class="text-white">
            <div class="text-subtitle-1">จำนวนที่ประเมินแล้ว</div>
            <div class="text-h3">{{ statistics.evaluated }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="success">
          <v-card-text class="text-white">
            <div class="text-subtitle-1">อัตราการส่งงาน</div>
            <div class="text-h3">{{ statistics.submissionRate }}%</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="selectedPeriod" class="mt-4">
      <v-col cols="12">
        <base-card title="รายงานรายบุคคล" icon="mdi-table">
          <base-table :headers="headers" :items="reportItems" :loading="loading">
            <template #item.full_name="{ item }">
              <div class="font-weight-medium">{{ item.full_name }}</div>
            </template>
            <template #item.status="{ item }">
              <status-chip :status="item.status" />
            </template>
            <template #item.total_score="{ item }">
              <div v-if="item.total_score !== null" class="text-center">
                <span class="font-weight-bold text-h6" :class="getScoreColor(item.total_score)">
                  {{ item.total_score.toFixed(2) }}
                </span>
                <span class="text-caption text-grey ml-1">/ 100</span>
              </div>
              <span v-else class="text-grey">-</span>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="small" color="primary" variant="text" @click="viewDetail(item)">
                <v-icon icon="mdi-eye" start></v-icon>ดูรายละเอียด
              </v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>
    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..." />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notification';
import periodService from '@/services/periodService';
import evaluationService from '@/services/evaluationService';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';

const router = useRouter();
const notificationStore = useNotificationStore();
const loading = ref(false);
const periods = ref([]);
const selectedPeriod = ref(null);
const reportData = ref([]);

const headers = [
  { title: 'ชื่อ-นามสกุล', key: 'full_name', sortable: true },
  { title: 'แผนก', key: 'department', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'คะแนนรวม', key: 'total_score', sortable: true, align: 'center' },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
];

const reportItems = computed(() => reportData.value.map(item => ({
  evaluatee_id: item.evaluatee_id,
  full_name: item.evaluatee_name || '-',
  department: item.department || '-',
  status: item.status || 'draft',
  total_score: item.total_score
})));

const statistics = computed(() => {
  const total = reportItems.value.length;
  const submitted = reportItems.value.filter(item =>
    ['submitted', 'evaluated', 'approved'].includes(item.status)).length;
  const evaluated = reportItems.value.filter(item =>
    ['evaluated', 'approved'].includes(item.status)).length;
  const submissionRate = total > 0 ? ((submitted / total) * 100).toFixed(1) : 0;
  return { totalEvaluatees: total, submitted, evaluated, submissionRate };
});

const getScoreColor = (score) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
};

const fetchPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.items || response.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const fetchReportData = async () => {
  if (!selectedPeriod.value) return;
  loading.value = true;
  try {
    const response = await evaluationService.getAll();
    const allResults = response.data.items || response.data.data || [];
    const groupedData = {};
    const statusOrder = { draft: 0, submitted: 1, evaluated: 2, approved: 3 };
    allResults.filter(result => result.period_id === selectedPeriod.value).forEach(result => {
      const key = result.evaluatee_id;
      if (!groupedData[key]) {
        groupedData[key] = {
          evaluatee_id: result.evaluatee_id,
          evaluatee_name: result.evaluatee_name,
          department: result.department,
          status: result.status || 'draft',
          total_score: null
        };
      }
      if (statusOrder[result.status] > statusOrder[groupedData[key].status]) {
        groupedData[key].status = result.status;
      }
      if (result.total_score) {
        groupedData[key].total_score = result.total_score;
      }
    });
    reportData.value = Object.values(groupedData);
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลรายงานได้');
  } finally {
    loading.value = false;
  }
};

const viewDetail = (item) => {
  router.push(`/admin/reports/${item.evaluatee_id}/${selectedPeriod.value}`);
};

onMounted(() => { fetchPeriods(); });
</script>

<style scoped>
@media print {
  .v-btn, .v-select, [class*="actions"] { display: none !important; }
}
</style>
