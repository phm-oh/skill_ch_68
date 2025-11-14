<template>
  <v-container fluid>
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
import evaluationService from '@/services/evaluationService';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const loading = ref(false);
const approving = ref(false);
const selectedTab = ref('pending');
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

const filteredItems = computed(() => {
  const filtered = evaluations.value.filter(e => e.evaluator_id === authStore.userId);
  const status = selectedTab.value === 'pending' ? 'evaluated' : 'approved';
  return filtered.filter(e => e.status === status);
});

const counts = computed(() => ({
  pending: evaluations.value.filter(e => e.status === 'evaluated' && e.evaluator_id === authStore.userId).length,
  approved: evaluations.value.filter(e => e.status === 'approved' && e.evaluator_id === authStore.userId).length
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
    await Promise.all(items.map(item =>
      evaluationService.evaluate({ result_id: item.id, status: 'approved' })
    ));
    notificationStore.success(`อนุมัติการประเมินสำเร็จ ${items.length} รายการ`);
    selected.value = [];
    closeApproveDialog();
    await fetchData();
  } catch (error) {
    notificationStore.error('ไม่สามารถอนุมัติได้: ' + (error.response?.data?.message || error.message));
  } finally {
    approving.value = false;
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await evaluationService.getAll();
    evaluations.value = response.data.data || [];
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
