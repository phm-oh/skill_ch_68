<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการตัวชี้วัด</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedTopicId"
          :items="topics"
          item-title="topic_name"
          item-value="id"
          label="เลือกหัวข้อ"
          variant="outlined"
          @update:model-value="loadIndicators"
        ></v-select>
      </v-col>
    </v-row>

    <v-row v-if="selectedTopicId">
      <v-col cols="12">
        <base-card title="รายการตัวชี้วัด" icon="mdi-chart-box">
          <template #actions>
            <v-btn color="primary" @click="openDialog()">
              <v-icon icon="mdi-plus" start></v-icon>
              เพิ่มตัวชี้วัด
            </v-btn>
          </template>

          <base-table :headers="headers" :items="indicators" :loading="loading">
            <template #item.evaluation_type="{ item }">
              {{ getTypeName(item.evaluation_type) }}
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>

    <base-dialog v-model="dialog" title="จัดการตัวชี้วัด" @confirm="saveIndicator" :loading="saving">
      <v-form ref="indicatorForm">
        <v-text-field v-model="formData.indicator_name" label="ชื่อตัวชี้วัด" :rules="[rules.required]"></v-text-field>
        <v-text-field v-model.number="formData.weight_score" label="คะแนน" type="number" :rules="[rules.required]"></v-text-field>
        <v-select v-model="formData.evaluation_type" label="รูปแบบการประเมิน" :items="evaluationTypes" item-title="text" item-value="value" :rules="[rules.required]"></v-select>
        <v-textarea v-model="formData.description" label="คำอธิบาย" rows="2"></v-textarea>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import topicService from '@/services/topicService';
import indicatorService from '@/services/indicatorService';
import { useNotificationStore } from '@/stores/notification';
import { required } from '@/utils/validators';

const notificationStore = useNotificationStore();
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const topics = ref([]);
const indicators = ref([]);
const selectedTopicId = ref(null);
const indicatorForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'ชื่อตัวชี้วัด', key: 'indicator_name' },
  { title: 'คะแนน', key: 'weight_score' },
  { title: 'รูปแบบ', key: 'evaluation_type' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const evaluationTypes = [
  { text: 'มี/ไม่มี', value: 'binary' },
  { text: 'สเกล 1-4', value: 'scale_1_4' },
  { text: 'กำหนดเอง', value: 'custom_options' }
];

const rules = { required };

const getTypeName = (type) => {
  const found = evaluationTypes.find(t => t.value === type);
  return found ? found.text : type;
};

const loadTopics = async () => {
  try {
    const response = await topicService.getActive();
    topics.value = response.data.data;
    if (topics.value.length > 0 && !selectedTopicId.value) {
      selectedTopicId.value = topics.value[0].id;
      loadIndicators();
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดหัวข้อได้');
  }
};

const loadIndicators = async () => {
  if (!selectedTopicId.value) return;
  loading.value = true;
  try {
    const response = await indicatorService.getByTopic(selectedTopicId.value);
    indicators.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดตัวชี้วัดได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (indicator = null) => {
  editMode.value = !!indicator;
  formData.value = indicator ? { ...indicator } : { topic_id: selectedTopicId.value, evaluation_type: 'scale_1_4' };
  dialog.value = true;
};

const saveIndicator = async () => {
  const { valid } = await indicatorForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (editMode.value) {
      await indicatorService.update(formData.value.id, formData.value);
      notificationStore.success('อัปเดตตัวชี้วัดสำเร็จ');
    } else {
      await indicatorService.create(formData.value);
      notificationStore.success('เพิ่มตัวชี้วัดสำเร็จ');
    }
    dialog.value = false;
    loadIndicators();
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (indicator) => {
  if (confirm(`ต้องการลบ "${indicator.indicator_name}" หรือไม่?`)) {
    try {
      await indicatorService.delete(indicator.id);
      notificationStore.success('ลบตัวชี้วัดสำเร็จ');
      loadIndicators();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบได้');
    }
  }
};

onMounted(() => {
  loadTopics();
});
</script>
