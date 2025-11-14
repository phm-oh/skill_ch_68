<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">รายงานและสถิติ</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedPeriodId"
          :items="periods"
          item-title="name_th"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          @update:model-value="loadReport"
        ></v-select>
      </v-col>
    </v-row>

    <v-row v-if="selectedPeriodId">
      <!-- Overall Summary -->
      <v-col cols="12" md="3" v-for="stat in statistics" :key="stat.title">
        <v-card elevation="2">
          <v-card-text>
            <div class="text-h4 font-weight-bold text-primary">{{ stat.value }}</div>
            <div class="text-subtitle-2 text-grey">{{ stat.title }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="selectedPeriodId">
      <v-col cols="12">
        <base-card title="รายงานรายบุคคล" icon="mdi-chart-bar">
          <template #actions>
            <v-btn color="primary" @click="exportReport">
              <v-icon icon="mdi-download" start></v-icon>
              Export
            </v-btn>
          </template>

          <base-table :headers="headers" :items="reportData" :loading="loading">
            <template #item.total_score="{ item }">
              <span class="font-weight-bold">{{ item.total_score }}</span>
            </template>

            <template #item.status="{ item }">
              <status-chip :status="item.status" size="small"></status-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-eye" size="small" variant="text" @click="viewDetails(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import periodService from '@/services/periodService';
import reportService from '@/services/reportService';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const loading = ref(false);
const periods = ref([]);
const selectedPeriodId = ref(null);
const reportData = ref([]);

const statistics = ref([
  { title: 'จำนวนทั้งหมด', value: 0 },
  { title: 'ส่งแล้ว', value: 0 },
  { title: 'ประเมินแล้ว', value: 0 },
  { title: 'อนุมัติแล้ว', value: 0 }
]);

const headers = [
  { title: 'ชื่อ-สกุล', key: 'evaluatee_name' },
  { title: 'คะแนนรวม', key: 'total_score' },
  { title: 'สถานะ', key: 'status' },
  { title: 'ดูรายละเอียด', key: 'actions', sortable: false }
];

const loadPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.items || [];
    if (periods.value.length > 0 && !selectedPeriodId.value) {
      selectedPeriodId.value = periods.value[0].id;
      loadReport();
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const loadReport = async () => {
  if (!selectedPeriodId.value) return;
  loading.value = true;
  try {
    const response = await reportService.getOverall(selectedPeriodId.value);
    reportData.value = response.data.data.reports || [];

    // Update statistics
    const summary = response.data.data.summary || {};
    statistics.value[0].value = summary.total || 0;
    statistics.value[1].value = summary.submitted || 0;
    statistics.value[2].value = summary.evaluated || 0;
    statistics.value[3].value = summary.approved || 0;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรายงานได้');
    reportData.value = [];
  } finally {
    loading.value = false;
  }
};

const exportReport = () => {
  window.print();
};

const viewDetails = (item) => {
  notificationStore.info(`ดูรายละเอียด: ${item.evaluatee_name}`);
};

onMounted(() => {
  loadPeriods();
});
</script>
