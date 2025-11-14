<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">แดชบอร์ดกรรมการ</h1>

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

    <v-row>
      <v-col cols="12">
        <base-card title="รายการที่ต้องประเมิน (Top 5)" icon="mdi-clipboard-list">
          <template #actions>
            <v-btn color="primary" to="/evaluator/assignments">ดูทั้งหมด</v-btn>
          </template>

          <base-table :headers="headers" :items="assignments.slice(0, 5)" :loading="loading">
            <template #item.status="{ item }">
              <status-chip :status="item.status" size="small"></status-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                color="primary"
                size="small"
                :to="`/evaluator/review/${item.evaluatee_id}/${item.period_id}`"
              >
                ประเมิน
              </v-btn>
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
import assignmentService from '@/services/assignmentService';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const loading = ref(false);
const assignments = ref([]);

const statistics = ref([
  { title: 'รอประเมิน', value: 0, icon: 'mdi-clock', color: 'warning' },
  { title: 'ประเมินแล้ว', value: 0, icon: 'mdi-check', color: 'success' },
  { title: 'อนุมัติแล้ว', value: 0, icon: 'mdi-check-circle', color: 'info' },
  { title: 'ทั้งหมด', value: 0, icon: 'mdi-clipboard-list', color: 'primary' }
]);

const headers = [
  { title: 'ผู้รับการประเมิน', key: 'evaluatee_name' },
  { title: 'สถานะ', key: 'status' },
  { title: 'ดำเนินการ', key: 'actions', sortable: false }
];

const loadData = async () => {
  loading.value = true;
  try {
    const response = await assignmentService.getMine();
    assignments.value = response.data.items || [];

    statistics.value[0].value = assignments.value.filter(a => a.status === 'pending').length;
    statistics.value[1].value = assignments.value.filter(a => a.status === 'evaluated').length;
    statistics.value[2].value = assignments.value.filter(a => a.status === 'approved').length;
    statistics.value[3].value = assignments.value.length;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>
