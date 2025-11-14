<template>
  <v-container fluid>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">จัดการหัวข้อการประเมิน</h1>
      <v-btn color="primary" @click="openDialog()" :disabled="!selectedPeriod">
        <v-icon icon="mdi-plus" start></v-icon>
        เพิ่มหัวข้อใหม่
      </v-btn>
    </div>

    <v-select v-model="selectedPeriod" :items="periods" item-title="period_name" item-value="id"
      label="เลือกรอบการประเมิน" variant="outlined" density="compact" class="mb-4"
      clearable @update:modelValue="fetchTopics">
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :subtitle="`${formatDate(item.raw.start_date)} - ${formatDate(item.raw.end_date)}`"></v-list-item>
      </template>
    </v-select>

    <v-alert v-if="selectedPeriod" :type="totalWeight === 100 ? 'success' : 'warning'" variant="tonal" class="mb-4">
      <strong v-if="totalWeight !== 100">คำเตือน:</strong> น้ำหนักรวมทั้งหมด {{ totalWeight }}% {{ totalWeight === 100 ? 'ถูกต้อง' : '(ต้องเป็น 100%)' }}
    </v-alert>

    <base-table v-if="selectedPeriod" :headers="headers" :items="topics" :loading="loading">
      <template v-slot:item.weight_percentage="{ item }">{{ item.weight_percentage }}%</template>
      <template v-slot:item.indicator_count="{ item }">
        <v-chip size="small" color="info">{{ item.indicator_count || 0 }} รายการ</v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)"></v-btn>
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
      </template>
    </base-table>

    <v-alert v-if="!selectedPeriod" type="info" variant="tonal" class="mt-4">
      กรุณาเลือกรอบการประเมินเพื่อจัดการหัวข้อ
    </v-alert>

    <base-dialog v-model="dialog" :title="isEdit ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่'"
      icon="mdi-file-document-outline" :loading="saving" @confirm="handleSave" @cancel="dialog = false">
      <v-form ref="formRef" v-model="valid">
        <v-text-field v-model="form.topic_name" label="ชื่อหัวข้อ"
          :rules="[v => !!v || 'กรุณากรอกชื่อหัวข้อ']" variant="outlined" density="compact" class="mb-3"></v-text-field>
        <v-text-field v-model.number="form.weight_percentage" label="น้ำหนัก (%)" type="number"
          :rules="[v => v !== '' && v !== null || 'กรุณากรอกน้ำหนัก', v => v >= 0 || 'น้ำหนักต้องมากกว่าหรือเท่ากับ 0', v => v <= 100 || 'น้ำหนักต้องน้อยกว่าหรือเท่ากับ 100']"
          variant="outlined" density="compact" class="mb-3" min="0" max="100"></v-text-field>
        <v-text-field v-model.number="form.sort_order" label="ลำดับการแสดงผล (ถ้าไม่ระบุจะเรียงอัตโนมัติ)"
          type="number" variant="outlined" density="compact" class="mb-3" min="0" hint="เว้นว่างเพื่อกำหนดอัตโนมัติ"></v-text-field>
        <v-alert v-if="!isEdit && predictedTotal !== 100" type="info" variant="tonal" density="compact">
          น้ำหนักรวมหลังเพิ่ม: {{ predictedTotal }}%
        </v-alert>
      </v-form>
    </base-dialog>

    <base-dialog v-model="deleteDialog" title="ยืนยันการลบ" icon="mdi-alert" confirm-text="ลบ"
      confirm-color="error" :loading="deleting" @confirm="handleDelete" @cancel="deleteDialog = false">
      <v-alert type="warning" variant="tonal" class="mb-4">
        คุณต้องการลบหัวข้อ "<strong>{{ deleteItem?.topic_name }}</strong>" หรือไม่?
      </v-alert>
      <p class="text-body-2">การลบจะทำให้ตัวชี้วัดทั้งหมดในหัวข้อนี้ถูกลบด้วย</p>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import periodService from '@/services/periodService';
import topicService from '@/services/topicService';
import { formatDate } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const headers = [
  { title: 'ลำดับ', key: 'sort_order', sortable: true },
  { title: 'ชื่อหัวข้อ', key: 'topic_name', sortable: true },
  { title: 'น้ำหนัก', key: 'weight_percentage', sortable: true },
  { title: 'จำนวนตัวชี้วัด', key: 'indicator_count', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const periods = ref([]);
const selectedPeriod = ref(null);
const topics = ref([]);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const deleting = ref(false);
const valid = ref(false);
const formRef = ref(null);
const deleteItem = ref(null);
const form = ref({ topic_name: '', weight_percentage: 0, sort_order: null, period_id: null });

const totalWeight = computed(() => {
  return topics.value.reduce((sum, topic) => sum + (parseFloat(topic.weight_percentage) || 0), 0);
});

const predictedTotal = computed(() => {
  const currentTotal = isEdit.value
    ? totalWeight.value - (parseFloat(deleteItem.value?.weight_percentage) || 0)
    : totalWeight.value;
  return currentTotal + (parseFloat(form.value.weight_percentage) || 0);
});

const fetchPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลรอบการประเมินได้');
  }
};

const fetchTopics = async () => {
  if (!selectedPeriod.value) {
    topics.value = [];
    return;
  }
  loading.value = true;
  try {
    const response = await topicService.getAll();
    topics.value = response.data.data.filter(t => t.period_id === selectedPeriod.value);
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลหัวข้อได้');
  } finally {
    loading.value = false;
  }
};

const getMaxSort = () => topics.value.length > 0 ? Math.max(...topics.value.map(t => t.sort_order || 0)) : 0;

const openDialog = (item = null) => {
  isEdit.value = !!item;
  if (item) {
    form.value = { ...item };
    deleteItem.value = { ...item };
  } else {
    form.value = { topic_name: '', weight_percentage: 0, sort_order: getMaxSort() + 1, period_id: selectedPeriod.value };
  }
  dialog.value = true;
};

const handleSave = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    const data = { ...form.value, period_id: selectedPeriod.value };
    if (!data.sort_order) data.sort_order = getMaxSort() + 1;
    if (isEdit.value) {
      await topicService.update(form.value.id, data);
      notificationStore.success('แก้ไขหัวข้อสำเร็จ');
    } else {
      await topicService.create(data);
      notificationStore.success('เพิ่มหัวข้อสำเร็จ');
    }
    dialog.value = false;
    fetchTopics();
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
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
    await topicService.delete(deleteItem.value.id);
    notificationStore.success('ลบหัวข้อสำเร็จ');
    deleteDialog.value = false;
    fetchTopics();
  } catch (error) {
    notificationStore.error('ไม่สามารถลบได้');
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchPeriods);
</script>
