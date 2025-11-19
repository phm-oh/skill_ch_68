<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <v-btn variant="text" color="primary" :to="/admin" class="mb-2">
          <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
        </v-btn>
        <h1 class="text-h4">จัดการมอบหมายงานประเมิน</h1>
      </div>
      <div class="d-flex gap-2">
        <v-btn color="secondary" @click="openDialog('bulk')">
          <v-icon icon="mdi-account-multiple-plus" start></v-icon>มอบหมายแบบ Bulk
        </v-btn>
        <v-btn color="primary" @click="openDialog('single')">
          <v-icon icon="mdi-account-plus" start></v-icon>มอบหมายเดี่ยว
        </v-btn>
      </div>
    </div>

    <v-select v-model="selectedPeriodId" :items="periods" item-title="name_th" item-value="id"
      label="เลือกรอบการประเมิน" variant="outlined" density="compact" class="mb-4"
      @update:model-value="fetchAssignments"></v-select>

    <BaseTable :headers="headers" :items="filteredAssignments" :loading="loading">
      <template #item.created_at="{ item }">{{ formatDate(item.created_at) }}</template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
      </template>
    </BaseTable>

    <!-- Single Assignment Dialog -->
    <BaseDialog v-model="singleDialog" title="มอบหมายงานประเมิน (เดี่ยว)" icon="mdi-account-plus"
      :loading="saving" @confirm="handleSaveSingle" @cancel="singleDialog = false">
      <v-form ref="singleFormRef">
        <v-select v-model="singleForm.evaluator_id" :items="evaluators" item-title="name_th" item-value="id"
          label="เลือกกรรมการผู้ประเมิน" :rules="[v => !!v || 'กรุณาเลือกกรรมการ']"
          variant="outlined" density="compact" class="mb-3"></v-select>
        <v-select v-model="singleForm.evaluatee_id" :items="evaluatees" item-title="name_th" item-value="id"
          label="เลือกผู้รับการประเมิน" :rules="[v => !!v || 'กรุณาเลือกผู้รับการประเมิน']"
          variant="outlined" density="compact"></v-select>
      </v-form>
    </BaseDialog>

    <!-- Bulk Assignment Dialog -->
    <BaseDialog v-model="bulkDialog" title="มอบหมายงานประเมิน (Bulk)" icon="mdi-account-multiple-plus"
      :loading="saving" @confirm="handleSaveBulk" @cancel="bulkDialog = false">
      <v-form ref="bulkFormRef">
        <v-select v-model="bulkForm.evaluator_ids" :items="evaluators" item-title="name_th" item-value="id"
          label="เลือกกรรมการผู้ประเมิน (หลายคน)" :rules="[v => v?.length > 0 || 'กรุณาเลือกอย่างน้อย 1 คน']"
          variant="outlined" density="compact" multiple chips closable-chips class="mb-3"></v-select>
        <v-select v-model="bulkForm.evaluatee_ids" :items="evaluatees" item-title="name_th" item-value="id"
          label="เลือกผู้รับการประเมิน (หลายคน)" :rules="[v => v?.length > 0 || 'กรุณาเลือกอย่างน้อย 1 คน']"
          variant="outlined" density="compact" multiple chips closable-chips></v-select>
      </v-form>
    </BaseDialog>

    <!-- Delete Dialog -->
    <BaseDialog v-model="deleteDialog" title="ยืนยันการลบ" icon="mdi-delete" confirm-text="ลบ"
      confirm-color="error" :loading="deleting" @confirm="handleDelete" @cancel="deleteDialog = false">
      <v-alert type="warning" variant="tonal">
        คุณต้องการลบการมอบหมาย <strong>{{ deleteItem?.evaluator_name }}</strong>
        ประเมิน <strong>{{ deleteItem?.evaluatee_name }}</strong> ใช่หรือไม่?
      </v-alert>
    </BaseDialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import periodService from '@/services/periodService';
import assignmentService from '@/services/assignmentService';
import userService from '@/services/userService';
import { formatDate } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const loading = ref(false), saving = ref(false), deleting = ref(false);
const singleDialog = ref(false), bulkDialog = ref(false), deleteDialog = ref(false);
const singleFormRef = ref(null), bulkFormRef = ref(null);

const periods = ref([]), assignments = ref([]), evaluators = ref([]), evaluatees = ref([]);
const selectedPeriodId = ref(null), deleteItem = ref(null);
const singleForm = ref({ period_id: null, evaluator_id: null, evaluatee_id: null });
const bulkForm = ref({ period_id: null, evaluator_ids: [], evaluatee_ids: [] });

const headers = [
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'กรรมการผู้ประเมิน', key: 'evaluator_name', sortable: true },
  { title: 'ผู้รับการประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'วันที่สร้าง', key: 'created_at', sortable: true },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
];

const filteredAssignments = computed(() =>
  selectedPeriodId.value ? assignments.value.filter(a => a.period_id === selectedPeriodId.value) : assignments.value
);

const fetchPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.items || response.data.data || [];
    if (periods.value.length > 0) selectedPeriodId.value = periods.value[0].id;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const response = await assignmentService.getAll();
    assignments.value = response.data.items || response.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลการมอบหมายได้');
  } finally {
    loading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const [evalResponse, evaluResponse] = await Promise.all([
      userService.getByRole('evaluator'),
      userService.getByRole('evaluatee')
    ]);
    evaluators.value = evalResponse.data.items || evalResponse.data.data || [];
    evaluatees.value = evaluResponse.data.items || evaluResponse.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
  }
};

const openDialog = (type) => {
  if (!selectedPeriodId.value) {
    notificationStore.warning('กรุณาเลือกรอบการประเมินก่อน');
    return;
  }
  if (type === 'single') {
    singleForm.value = { period_id: selectedPeriodId.value, evaluator_id: null, evaluatee_id: null };
    singleDialog.value = true;
  } else {
    bulkForm.value = { period_id: selectedPeriodId.value, evaluator_ids: [], evaluatee_ids: [] };
    bulkDialog.value = true;
  }
};

const handleSaveSingle = async () => {
  const { valid } = await singleFormRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    await assignmentService.create(singleForm.value);
    notificationStore.success('มอบหมายงานสำเร็จ');
    singleDialog.value = false;
    await fetchAssignments();
  } catch (error) {
    notificationStore.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const handleSaveBulk = async () => {
  const { valid } = await bulkFormRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    await assignmentService.createBulk(bulkForm.value);
    notificationStore.success('มอบหมายงานแบบ Bulk สำเร็จ');
    bulkDialog.value = false;
    await fetchAssignments();
  } catch (error) {
    notificationStore.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  deleteItem.value = item;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  deleting.value = true;
  try {
    await assignmentService.delete(deleteItem.value.id);
    notificationStore.success('ลบการมอบหมายสำเร็จ');
    deleteDialog.value = false;
    await fetchAssignments();
  } catch (error) {
    notificationStore.error('ไม่สามารถลบได้');
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchPeriods(), fetchUsers()]);
  await fetchAssignments();
});
</script>
