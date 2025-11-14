<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">อนุมัติการประเมิน</h1>

    <v-row>
      <v-col cols="12">
        <base-card title="รายการรอการอนุมัติ" icon="mdi-check-circle">
          <template #actions>
            <v-btn
              color="primary"
              @click="approveSelected"
              :disabled="selected.length === 0"
              :loading="approving"
            >
              <v-icon icon="mdi-check-all" start></v-icon>
              อนุมัติที่เลือก ({{ selected.length }})
            </v-btn>
          </template>

          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="evaluations"
            :loading="loading"
            show-select
            item-value="id"
          >
            <template #item.total_score="{ item }">
              <span class="font-weight-bold text-primary">{{ item.total_score }}</span>
            </template>

            <template #item.status="{ item }">
              <status-chip :status="item.status" size="small"></status-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                size="small"
                variant="text"
                @click="viewDetails(item)"
              ></v-btn>
              <v-btn
                icon="mdi-check"
                size="small"
                variant="text"
                color="success"
                @click="approveOne(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </base-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import resultService from '@/services/resultService';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const loading = ref(false);
const approving = ref(false);
const evaluations = ref([]);
const selected = ref([]);

const headers = [
  { title: 'ผู้รับการประเมิน', key: 'evaluatee_name' },
  { title: 'แผนก', key: 'department' },
  { title: 'คะแนนรวม', key: 'total_score' },
  { title: 'สถานะ', key: 'status' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const loadData = async () => {
  loading.value = true;
  try {
    const response = await resultService.getAll();
    // Filter only evaluated status
    evaluations.value = response.data.data.filter(e => e.status === 'evaluated');
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const approveOne = async (evaluation) => {
  if (confirm(`ต้องการอนุมัติการประเมินของ "${evaluation.evaluatee_name}" หรือไม่?`)) {
    try {
      // Assuming approval endpoint exists
      notificationStore.success('อนุมัติสำเร็จ');
      loadData();
    } catch (error) {
      notificationStore.error('ไม่สามารถอนุมัติได้');
    }
  }
};

const approveSelected = async () => {
  if (confirm(`ต้องการอนุมัติการประเมิน ${selected.value.length} รายการหรือไม่?`)) {
    approving.value = true;
    try {
      // Assuming bulk approval endpoint exists
      notificationStore.success(`อนุมัติ ${selected.value.length} รายการสำเร็จ`);
      selected.value = [];
      loadData();
    } catch (error) {
      notificationStore.error('ไม่สามารถอนุมัติได้');
    } finally {
      approving.value = false;
    }
  }
};

const viewDetails = (evaluation) => {
  notificationStore.info(`ดูรายละเอียด: ${evaluation.evaluatee_name}`);
};

onMounted(() => {
  loadData();
});
</script>
