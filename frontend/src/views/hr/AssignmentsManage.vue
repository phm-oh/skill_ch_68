<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">มอบหมายกรรมการ</h1>

    <v-row>
      <v-col cols="12">
        <base-card title="รายการมอบหมาย" icon="mdi-account-multiple">
          <template #actions>
            <v-btn color="primary" @click="openDialog()">
              <v-icon icon="mdi-plus" start></v-icon>
              มอบหมายใหม่
            </v-btn>
          </template>

          <base-table :headers="headers" :items="assignments" :loading="loading">
            <template #item.actions="{ item }">
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>

    <base-dialog v-model="dialog" title="มอบหมายกรรมการ" @confirm="saveAssignment" :loading="saving">
      <v-form ref="assignmentForm">
        <v-select v-model="formData.period_id" :items="periods" item-title="period_name" item-value="id" label="รอบการประเมิน" :rules="[rules.required]"></v-select>
        <v-select v-model="formData.evaluator_id" :items="evaluators" item-title="full_name" item-value="id" label="กรรมการ" :rules="[rules.required]"></v-select>
        <v-select v-model="formData.evaluatee_id" :items="evaluatees" item-title="full_name" item-value="id" label="ผู้รับการประเมิน" :rules="[rules.required]"></v-select>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import assignmentService from '@/services/assignmentService';
import periodService from '@/services/periodService';
import userService from '@/services/userService';
import { useNotificationStore } from '@/stores/notification';
import { required } from '@/utils/validators';

const notificationStore = useNotificationStore();
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const assignments = ref([]);
const periods = ref([]);
const evaluators = ref([]);
const evaluatees = ref([]);
const assignmentForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'รอบการประเมิน', key: 'period_name' },
  { title: 'กรรมการ', key: 'evaluator_name' },
  { title: 'ผู้รับการประเมิน', key: 'evaluatee_name' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const rules = { required };

const loadData = async () => {
  loading.value = true;
  try {
    const [assignmentsRes, periodsRes, evaluatorsRes, evaluateesRes] = await Promise.all([
      assignmentService.getAll(),
      periodService.getAll(),
      userService.getByRole('evaluator'),
      userService.getByRole('evaluatee')
    ]);

    assignments.value = assignmentsRes.data.data;
    periods.value = periodsRes.data.data;
    evaluators.value = evaluatorsRes.data.data;
    evaluatees.value = evaluateesRes.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = () => {
  formData.value = {};
  dialog.value = true;
};

const saveAssignment = async () => {
  const { valid } = await assignmentForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    await assignmentService.create(formData.value);
    notificationStore.success('มอบหมายสำเร็จ');
    dialog.value = false;
    loadData();
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (assignment) => {
  if (confirm('ต้องการลบการมอบหมายนี้หรือไม่?')) {
    try {
      await assignmentService.delete(assignment.id);
      notificationStore.success('ลบการมอบหมายสำเร็จ');
      loadData();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบได้');
    }
  }
};

onMounted(() => {
  loadData();
});
</script>
