<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">จัดการรอบการประเมิน</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <base-card title="รายการรอบการประเมิน" icon="mdi-calendar">
          <template #actions>
            <v-btn color="primary" @click="openDialog()">
              <v-icon icon="mdi-plus" start></v-icon>
              สร้างรอบใหม่
            </v-btn>
          </template>

          <base-table
            :headers="headers"
            :items="periods"
            :loading="loading"
          >
            <template #item.start_date="{ item }">
              {{ formatDate(item.start_date) }}
            </template>

            <template #item.end_date="{ item }">
              {{ formatDate(item.end_date) }}
            </template>

            <template #item.is_active="{ item }">
              <status-chip :status="item.is_active ? 'active' : 'inactive'" size="small"></status-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>

    <!-- Dialog -->
    <base-dialog
      v-model="dialog"
      :title="editMode ? 'แก้ไขรอบการประเมิน' : 'สร้างรอบการประเมินใหม่'"
      icon="mdi-calendar"
      @confirm="savePeriod"
      :loading="saving"
    >
      <v-form ref="periodForm">
        <v-text-field
          v-model="formData.code"
          label="รหัสรอบ"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.name_th"
          label="ชื่อรอบการประเมิน"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.buddhist_year"
          label="ปีพุทธศักราช"
          type="number"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.start_date"
          label="วันเริ่มต้น"
          type="date"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.end_date"
          label="วันสิ้นสุด"
          type="date"
          :rules="[rules.required]"
        ></v-text-field>

        <v-checkbox
          v-model="formData.is_active"
          label="เปิดใช้งาน"
        ></v-checkbox>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import periodService from '@/services/periodService';
import { useNotificationStore } from '@/stores/notification';
import { required } from '@/utils/validators';
import { formatDate } from '@/utils/helpers';

const notificationStore = useNotificationStore();

const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const periods = ref([]);
const periodForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'รหัสรอบ', key: 'code' },
  { title: 'ชื่อรอบการประเมิน', key: 'name_th' },
  { title: 'ปีพุทธศักราช', key: 'buddhist_year' },
  { title: 'วันเริ่มต้น', key: 'start_date' },
  { title: 'วันสิ้นสุด', key: 'end_date' },
  { title: 'สถานะ', key: 'is_active' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const rules = { required };

const loadPeriods = async () => {
  loading.value = true;
  try {
    const response = await periodService.getAll();
    periods.value = response.data.items || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (period = null) => {
  editMode.value = !!period;
  formData.value = period ? { ...period } : { is_active: true };
  dialog.value = true;
};

const savePeriod = async () => {
  const { valid } = await periodForm.value.validate();
  if (!valid) return;

  // Validate dates
  if (new Date(formData.value.end_date) <= new Date(formData.value.start_date)) {
    notificationStore.error('วันสิ้นสุดต้องมากกว่าวันเริ่มต้น');
    return;
  }

  saving.value = true;
  try {
    if (editMode.value) {
      await periodService.update(formData.value.id, formData.value);
      notificationStore.success('อัปเดตรอบการประเมินสำเร็จ');
    } else {
      await periodService.create(formData.value);
      notificationStore.success('สร้างรอบการประเมินสำเร็จ');
    }
    dialog.value = false;
    loadPeriods();
  } catch (error) {
    notificationStore.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (period) => {
  if (confirm(`ต้องการลบรอบ "${period.name_th}" หรือไม่?`)) {
    try {
      await periodService.delete(period.id);
      notificationStore.success('ลบรอบการประเมินสำเร็จ');
      loadPeriods();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบได้');
    }
  }
};

onMounted(() => {
  loadPeriods();
});
</script>
