<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <v-btn variant="text" color="primary" to="/admin" class="mb-2">
          <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
        </v-btn>
        <h1 class="text-h4">จัดการรอบการประเมิน</h1>
      </div>
      <v-btn color="primary" @click="openDialog()">
        <v-icon icon="mdi-plus" start></v-icon>
        เพิ่มรอบใหม่
      </v-btn>
    </div>

    <base-table :headers="headers" :items="periods" :loading="loading">
      <template v-slot:item.start_date="{ item }">{{ formatDate(item.start_date) }}</template>
      <template v-slot:item.end_date="{ item }">{{ formatDate(item.end_date) }}</template>
      <template v-slot:item.is_active="{ item }">
        <status-chip :status="item.is_active ? 'active' : 'inactive'" />
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)"></v-btn>
        <v-btn :icon="item.is_active ? 'mdi-eye-off' : 'mdi-eye'" size="small" variant="text"
          :color="item.is_active ? 'warning' : 'success'" @click="toggleActive(item)"></v-btn>
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
      </template>
    </base-table>

    <base-dialog v-model="dialog" :title="isEdit ? 'แก้ไขรอบการประเมิน' : 'เพิ่มรอบการประเมิน'"
      icon="mdi-calendar" :loading="saving" @confirm="handleSave" @cancel="dialog = false">
      <v-form ref="formRef" v-model="valid">
        <v-text-field v-model="form.code" label="รหัสรอบการประเมิน"
          :rules="[v => !!v || 'กรุณากรอกรหัสรอบการประเมิน']" variant="outlined" density="compact" class="mb-3" :readonly="isEdit">
        </v-text-field>
        <v-text-field v-model="form.name_th" label="ชื่อรอบการประเมิน"
          :rules="[v => !!v || 'กรุณากรอกชื่อรอบการประเมิน']" variant="outlined" density="compact" class="mb-3">
        </v-text-field>
        <v-text-field v-model.number="form.buddhist_year" label="ปีพุทธศักราช" type="number"
          :rules="[v => !!v || 'กรุณากรอกปีพุทธศักราช']" variant="outlined" density="compact" class="mb-3">
        </v-text-field>
        <v-text-field v-model="form.start_date" label="วันที่เริ่มต้น" type="date"
          :rules="[v => !!v || 'กรุณาเลือกวันที่เริ่มต้น']" variant="outlined" density="compact" class="mb-3">
        </v-text-field>
        <v-text-field v-model="form.end_date" label="วันที่สิ้นสุด" type="date"
          :rules="[v => !!v || 'กรุณาเลือกวันที่สิ้นสุด',
            v => !form.start_date || v > form.start_date || 'วันที่สิ้นสุดต้องหลังวันที่เริ่มต้น']"
          variant="outlined" density="compact" class="mb-3"></v-text-field>
        <v-checkbox v-model="form.is_active" label="เปิดใช้งาน" color="primary" hide-details></v-checkbox>
      </v-form>
    </base-dialog>

    <base-dialog v-model="deleteDialog" title="ยืนยันการลบ" icon="mdi-alert" confirm-text="ลบ"
      confirm-color="error" :loading="deleting" @confirm="handleDelete" @cancel="deleteDialog = false">
      <v-alert type="warning" variant="tonal" class="mb-4">
        คุณต้องการลบรอบการประเมิน "<strong>{{ deleteItem?.name_th }}</strong>" หรือไม่?
      </v-alert>
      <p class="text-body-2">การลบจะไม่สามารถย้อนกลับได้</p>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import StatusChip from '@/components/base/StatusChip.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import periodService from '@/services/periodService';
import { formatDate } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อรอบการประเมิน', key: 'name_th', sortable: true },
  { title: 'ปีพุทธศักราช', key: 'buddhist_year', sortable: true },
  { title: 'วันที่เริ่มต้น', key: 'start_date', sortable: true },
  { title: 'วันที่สิ้นสุด', key: 'end_date', sortable: true },
  { title: 'สถานะ', key: 'is_active', sortable: true },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const periods = ref([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const deleting = ref(false);
const valid = ref(false);
const formRef = ref(null);
const deleteItem = ref(null);
const form = ref({ code: '', name_th: '', buddhist_year: new Date().getFullYear() + 543, start_date: '', end_date: '', is_active: true });

const fetchPeriods = async () => {
  loading.value = true;
  try {
    const response = await periodService.getAll();
    periods.value = response.data.items || response.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (item = null) => {
  isEdit.value = !!item;
  form.value = item ? { ...item } : { code: '', name_th: '', buddhist_year: new Date().getFullYear() + 543, start_date: '', end_date: '', is_active: true };
  dialog.value = true;
};

const handleSave = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    notificationStore.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  // Validate dates
  if (!form.value.start_date || !form.value.end_date) {
    notificationStore.error('กรุณาระบุช่วงการประเมิน (วันที่เริ่มต้นและวันที่สิ้นสุด)');
    return;
  }

  saving.value = true;
  try {
    const data = {
      ...form.value,
      is_active: form.value.is_active ? 1 : 0
    };

    if (isEdit.value) {
      await periodService.update(form.value.id, data);
      notificationStore.success('แก้ไขรอบการประเมินสำเร็จ');
    } else {
      await periodService.create(data);
      notificationStore.success('เพิ่มรอบการประเมินสำเร็จ');
    }
    dialog.value = false;
    fetchPeriods();
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (item) => {
  try {
    const data = { ...item, is_active: item.is_active ? 0 : 1 };
    await periodService.update(item.id, data);
    notificationStore.success('เปลี่ยนสถานะสำเร็จ');
    fetchPeriods();
  } catch (error) {
    notificationStore.error('ไม่สามารถเปลี่ยนสถานะได้');
  }
};

const confirmDelete = (item) => {
  deleteItem.value = item;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  deleting.value = true;
  try {
    await periodService.delete(deleteItem.value.id);
    notificationStore.success('ลบรอบการประเมินสำเร็จ');
    deleteDialog.value = false;
    fetchPeriods();
  } catch (error) {
    notificationStore.error('ไม่สามารถลบได้');
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchPeriods);
</script>
