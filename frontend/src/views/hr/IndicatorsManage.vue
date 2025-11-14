<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการตัวชี้วัด</h1>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-select v-model="selectedPeriod" :items="periods" item-title="period_name" item-value="id"
          label="เลือกรอบการประเมิน" variant="outlined" density="compact"
          :loading="loadingPeriods" @update:modelValue="onPeriodChange"></v-select>
      </v-col>
      <v-col cols="12" md="6">
        <v-select v-model="selectedTopic" :items="topics" item-title="topic_name" item-value="id"
          label="เลือกหัวข้อการประเมิน" variant="outlined" density="compact"
          :loading="loadingTopics" :disabled="!selectedPeriod" @update:modelValue="fetchIndicators"></v-select>
      </v-col>
    </v-row>
    <div v-if="selectedTopic" class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h6">รายการตัวชี้วัด</h2>
      <v-btn color="primary" @click="openDialog()">
        <v-icon icon="mdi-plus" start></v-icon>เพิ่มตัวชี้วัด
      </v-btn>
    </div>
    <base-table v-if="selectedTopic" :headers="headers" :items="indicators" :loading="loading">
      <template v-slot:item.weight_score="{ item }">{{ item.weight_score }}%</template>
      <template v-slot:item.evaluation_type="{ item }">{{ getEvaluationTypeText(item.evaluation_type) }}</template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)"></v-btn>
        <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
      </template>
    </base-table>
    <v-alert v-else type="info" variant="tonal" class="mt-4">
      กรุณาเลือกรอบการประเมินและหัวข้อการประเมินเพื่อดูรายการตัวชี้วัด
    </v-alert>
    <base-dialog v-model="dialog" :title="isEdit ? 'แก้ไขตัวชี้วัด' : 'เพิ่มตัวชี้วัด'"
      icon="mdi-chart-line" :loading="saving" @confirm="handleSave" @cancel="dialog = false">
      <v-form ref="formRef" v-model="valid">
        <v-text-field v-model="form.indicator_name" label="ชื่อตัวชี้วัด"
          :rules="[v => !!v || 'กรุณากรอกชื่อตัวชี้วัด']" variant="outlined" density="compact" class="mb-3"></v-text-field>
        <v-text-field v-model.number="form.weight_score" label="น้ำหนักคะแนน (%)" type="number"
          :rules="[v => v !== null && v !== '' || 'กรุณากรอกน้ำหนักคะแนน',
            v => v >= 0 && v <= 100 || 'น้ำหนักคะแนนต้องอยู่ระหว่าง 0-100']"
          variant="outlined" density="compact" class="mb-3"></v-text-field>
        <v-select v-model="form.evaluation_type" :items="evaluationTypes" item-title="text" item-value="value"
          label="ประเภทการประเมิน" variant="outlined" density="compact" class="mb-3"></v-select>
        <v-textarea v-model="form.description" label="รายละเอียด (ไม่บังคับ)"
          variant="outlined" density="compact" rows="3"></v-textarea>
      </v-form>
    </base-dialog>
    <base-dialog v-model="deleteDialog" title="ยืนยันการลบ" icon="mdi-alert" confirm-text="ลบ"
      confirm-color="error" :loading="deleting" @confirm="handleDelete" @cancel="deleteDialog = false">
      <v-alert type="warning" variant="tonal" class="mb-4">
        คุณต้องการลบตัวชี้วัด "<strong>{{ deleteItem?.indicator_name }}</strong>" หรือไม่?
      </v-alert>
      <p class="text-body-2">การลบจะไม่สามารถย้อนกลับได้</p>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import periodService from '@/services/periodService';
import topicService from '@/services/topicService';

const notificationStore = useNotificationStore();
const headers = [
  { title: 'ชื่อตัวชี้วัด', key: 'indicator_name', sortable: true },
  { title: 'น้ำหนักคะแนน', key: 'weight_score', sortable: true },
  { title: 'ประเภทการประเมิน', key: 'evaluation_type', sortable: true },
  { title: 'รายละเอียด', key: 'description', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false }
];
const evaluationTypes = [
  { text: 'แบบ 2 ทาง (ได้/ไม่ได้)', value: 'binary' },
  { text: 'แบบมาตราส่วน 1-4', value: 'scale_1_4' },
  { text: 'แบบกำหนดเอง', value: 'custom' }
];
const periods = ref([]);
const topics = ref([]);
const indicators = ref([]);
const selectedPeriod = ref(null);
const selectedTopic = ref(null);
const loadingPeriods = ref(false);
const loadingTopics = ref(false);
const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const deleting = ref(false);
const valid = ref(false);
const formRef = ref(null);
const deleteItem = ref(null);
const form = ref({ indicator_name: '', weight_score: null, evaluation_type: 'binary', description: '', topic_id: null });

const getEvaluationTypeText = (type) => {
  const found = evaluationTypes.find(t => t.value === type);
  return found ? found.text : type;
};

const fetchPeriods = async () => {
  loadingPeriods.value = true;
  try {
    const response = await periodService.getAll();
    periods.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  } finally {
    loadingPeriods.value = false;
  }
};

const onPeriodChange = async () => {
  selectedTopic.value = null;
  indicators.value = [];
  if (!selectedPeriod.value) {
    topics.value = [];
    return;
  }
  await fetchTopics();
};

const fetchTopics = async () => {
  loadingTopics.value = true;
  try {
    const response = await topicService.getAll();
    topics.value = response.data.data.filter(t => t.period_id === selectedPeriod.value);
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดหัวข้อการประเมินได้');
  } finally {
    loadingTopics.value = false;
  }
};

const fetchIndicators = async () => {
  if (!selectedTopic.value) {
    indicators.value = [];
    return;
  }
  loading.value = true;
  try {
    const response = await topicService.getIndicatorsByTopic(selectedTopic.value);
    indicators.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดตัวชี้วัดได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (item = null) => {
  isEdit.value = !!item;
  form.value = item ? { ...item } : { indicator_name: '', weight_score: null, evaluation_type: 'binary', description: '', topic_id: selectedTopic.value };
  dialog.value = true;
};

const handleSave = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    form.value.topic_id = selectedTopic.value;
    if (isEdit.value) {
      await topicService.updateIndicator(form.value.id, form.value);
      notificationStore.success('แก้ไขตัวชี้วัดสำเร็จ');
    } else {
      await topicService.createIndicator(form.value);
      notificationStore.success('เพิ่มตัวชี้วัดสำเร็จ');
    }
    dialog.value = false;
    fetchIndicators();
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
    await topicService.deleteIndicator(deleteItem.value.id);
    notificationStore.success('ลบตัวชี้วัดสำเร็จ');
    deleteDialog.value = false;
    fetchIndicators();
  } catch (error) {
    notificationStore.error('ไม่สามารถลบได้');
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchPeriods);
</script>
