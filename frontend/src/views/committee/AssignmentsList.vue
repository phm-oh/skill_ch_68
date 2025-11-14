<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">รายการที่ต้องประเมิน</h1>

    <v-row>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="กรองตามสถานะ"
          variant="outlined"
          @update:model-value="filterAssignments"
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <base-card title="รายการทั้งหมด" icon="mdi-clipboard-list">
          <base-table :headers="headers" :items="filteredAssignments" :loading="loading">
            <template #item.status="{ item }">
              <status-chip :status="item.status" size="small"></status-chip>
            </template>

            <template #item.submitted_at="{ item }">
              {{ item.submitted_at ? formatDateTime(item.submitted_at) : '-' }}
            </template>

            <template #item.actions="{ item }">
              <v-btn
                color="primary"
                size="small"
                :to="`/evaluator/review/${item.evaluatee_id}/${item.period_id}`"
              >
                {{ item.status === 'pending' ? 'เริ่มประเมิน' : 'ดูผลการประเมิน' }}
              </v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import assignmentService from '@/services/assignmentService';
import { useNotificationStore } from '@/stores/notification';
import { formatDateTime } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const loading = ref(false);
const assignments = ref([]);
const statusFilter = ref('all');

const statusOptions = [
  { title: 'ทั้งหมด', value: 'all' },
  { title: 'รอประเมิน', value: 'pending' },
  { title: 'ประเมินแล้ว', value: 'evaluated' },
  { title: 'อนุมัติแล้ว', value: 'approved' }
];

const headers = [
  { title: 'ผู้รับการประเมิน', key: 'evaluatee_name' },
  { title: 'แผนก', key: 'department' },
  { title: 'ตำแหน่ง', key: 'position' },
  { title: 'วันที่ส่ง', key: 'submitted_at' },
  { title: 'สถานะ', key: 'status' },
  { title: 'ดำเนินการ', key: 'actions', sortable: false }
];

const filteredAssignments = computed(() => {
  if (statusFilter.value === 'all') return assignments.value;
  return assignments.value.filter(a => a.status === statusFilter.value);
});

const filterAssignments = () => {
  // Triggers reactive update
};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await assignmentService.getMine();
    assignments.value = response.data.data;
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
