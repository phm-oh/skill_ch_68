<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-btn variant="text" color="primary" to="/admin" class="mb-2">
          <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
        </v-btn>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h4">รายงานการประเมิน</h1>
          <v-btn color="primary" @click="exportPDF" :disabled="!selectedPeriod">
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
          </base-table>
        </base-card>
      </v-col>
    </v-row>
    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..." />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import periodService from '@/services/periodService';
import evaluationService from '@/services/evaluationService';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';

const notificationStore = useNotificationStore();
const loading = ref(false);
const periods = ref([]);
const selectedPeriod = ref(null);
const reportData = ref([]);

const headers = [
  { title: 'ชื่อ-นามสกุล', key: 'full_name', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'คะแนนรวม', key: 'total_score', sortable: true, align: 'center' }
];

const reportItems = computed(() => reportData.value.map(item => ({
  evaluatee_id: item.evaluatee_id,
  full_name: item.evaluatee_name || item.name_th || '-',
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

const exportPDF = () => {
  if (!selectedPeriod.value) {
    notificationStore.error('กรุณาเลือกรอบการประเมินก่อน');
    return;
  }
  window.print();
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
    // Fetch all assignments for this period to get evaluatee list
    const assignmentsRes = await evaluationService.getAll();
    const allResults = assignmentsRes.data.items || assignmentsRes.data.data || [];

    // Filter by period and group by evaluatee
    const evaluateeIds = [...new Set(
      allResults
        .filter(r => r.period_id === selectedPeriod.value)
        .map(r => r.evaluatee_id)
    )];

    console.log('[ReportsView] Evaluatee IDs:', evaluateeIds);

    // Fetch summary for each evaluatee
    const summaryPromises = evaluateeIds.map(evaluateeId =>
      evaluationService.getSummary(evaluateeId, selectedPeriod.value)
        .then(res => ({
          evaluatee_id: evaluateeId,
          evaluatee_name: res.data.data?.evaluatee_name || '-',
          total_score: res.data.data?.total_score || res.data.data?.evaluator_total || 0,
          status: res.data.data?.status || 'draft'
        }))
        .catch(err => {
          console.error(`[ReportsView] Error fetching summary for ${evaluateeId}:`, err);
          return {
            evaluatee_id: evaluateeId,
            evaluatee_name: '-',
            total_score: 0,
            status: 'draft'
          };
        })
    );

    const summaries = await Promise.all(summaryPromises);

    // Get evaluatee names from results if not in summary
    summaries.forEach(summary => {
      if (summary.evaluatee_name === '-') {
        const result = allResults.find(r => r.evaluatee_id === summary.evaluatee_id);
        if (result) {
          summary.evaluatee_name = result.evaluatee_name || result.name_th || '-';
        }
      }

      // Determine status from results if not in summary
      if (summary.status === 'draft') {
        const evaluateeResults = allResults.filter(r =>
          r.evaluatee_id === summary.evaluatee_id &&
          r.period_id === selectedPeriod.value
        );
        const anyApproved = evaluateeResults.some(r => r.status === 'approved');
        const anyEvaluated = evaluateeResults.some(r => r.evaluator_score !== null);
        const anySubmitted = evaluateeResults.some(r => r.self_score !== null);

        if (anyApproved) summary.status = 'approved';
        else if (anyEvaluated) summary.status = 'evaluated';
        else if (anySubmitted) summary.status = 'submitted';
      }
    });

    console.log('[ReportsView] Summaries:', summaries);
    reportData.value = summaries;
  } catch (error) {
    console.error('[ReportsView] Fetch error:', error);
    notificationStore.error('ไม่สามารถโหลดข้อมูลรายงานได้');
  } finally {
    loading.value = false;
  }
};

onMounted(() => { fetchPeriods(); });
</script>

<style scoped>
@media print {
  .v-btn, .v-select, [class*="actions"] { display: none !important; }
}
</style>
