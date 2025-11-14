<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการหัวข้อการประเมิน</h1>

    <v-row>
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedPeriodId"
          :items="periods"
          item-title="period_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          @update:model-value="loadTopics"
        ></v-select>
      </v-col>
    </v-row>

    <v-row v-if="selectedPeriodId">
      <v-col cols="12">
        <base-card title="รายการหัวข้อ" icon="mdi-format-list-bulleted">
          <template #actions>
            <v-btn color="primary" @click="openDialog()">
              <v-icon icon="mdi-plus" start></v-icon>
              เพิ่มหัวข้อ
            </v-btn>
          </template>

          <base-table
            :headers="headers"
            :items="topics"
            :loading="loading"
          >
            <template #item.weight_percentage="{ item }">
              {{ item.weight_percentage }}%
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
            </template>
          </base-table>

          <v-alert v-if="totalWeight !== 100" type="warning" variant="tonal" class="mt-4">
            น้ำหนักรวม: {{ totalWeight }}% (ต้องเท่ากับ 100%)
          </v-alert>
          <v-alert v-else type="success" variant="tonal" class="mt-4">
            น้ำหนักรวม: {{ totalWeight }}% ✓
          </v-alert>
        </base-card>
      </v-col>
    </v-row>

    <base-dialog
      v-model="dialog"
      :title="editMode ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่'"
      @confirm="saveTopic"
      :loading="saving"
    >
      <v-form ref="topicForm">
        <v-text-field
          v-model="formData.topic_name"
          label="ชื่อหัวข้อ"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model.number="formData.weight_percentage"
          label="น้ำหนัก (%)"
          type="number"
          min="0"
          max="100"
          :rules="[rules.required, rules.range(0, 100)]"
        ></v-text-field>

        <v-text-field
          v-model.number="formData.sort_order"
          label="ลำดับ"
          type="number"
          min="1"
        ></v-text-field>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import periodService from '@/services/periodService';
import topicService from '@/services/topicService';
import { useNotificationStore } from '@/stores/notification';
import { required, range } from '@/utils/validators';

const notificationStore = useNotificationStore();
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const periods = ref([]);
const topics = ref([]);
const selectedPeriodId = ref(null);
const topicForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'ชื่อหัวข้อ', key: 'topic_name' },
  { title: 'น้ำหนัก', key: 'weight_percentage' },
  { title: 'ลำดับ', key: 'sort_order' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const rules = { required, range };

const totalWeight = computed(() => {
  return topics.value.reduce((sum, topic) => sum + (topic.weight_percentage || 0), 0);
});

const loadPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.data;
    if (periods.value.length > 0 && !selectedPeriodId.value) {
      selectedPeriodId.value = periods.value[0].id;
      loadTopics();
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const loadTopics = async () => {
  if (!selectedPeriodId.value) return;
  loading.value = true;
  try {
    const response = await topicService.getAll();
    // Filter by period
    topics.value = response.data.data.filter(t => t.period_id === selectedPeriodId.value);
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดหัวข้อได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (topic = null) => {
  editMode.value = !!topic;
  formData.value = topic ? { ...topic } : { period_id: selectedPeriodId.value, sort_order: topics.value.length + 1 };
  dialog.value = true;
};

const saveTopic = async () => {
  const { valid } = await topicForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (editMode.value) {
      await topicService.update(formData.value.id, formData.value);
      notificationStore.success('อัปเดตหัวข้อสำเร็จ');
    } else {
      await topicService.create(formData.value);
      notificationStore.success('เพิ่มหัวข้อสำเร็จ');
    }
    dialog.value = false;
    loadTopics();
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (topic) => {
  if (confirm(`ต้องการลบ "${topic.topic_name}" หรือไม่?`)) {
    try {
      await topicService.delete(topic.id);
      notificationStore.success('ลบหัวข้อสำเร็จ');
      loadTopics();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบได้');
    }
  }
};

onMounted(() => {
  loadPeriods();
});
</script>
