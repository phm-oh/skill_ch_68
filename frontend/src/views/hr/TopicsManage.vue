<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการหัวข้อการประเมิน</h1>

    <v-row>
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
            <template #item.weight="{ item }">
              {{ item.weight }}%
            </template>

            <template #item.active="{ item }">
              <status-chip :status="item.active ? 'active' : 'inactive'" size="small"></status-chip>
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
          v-model="formData.code"
          label="รหัสหัวข้อ"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.title_th"
          label="ชื่อหัวข้อ"
          :rules="[rules.required]"
        ></v-text-field>

        <v-textarea
          v-model="formData.description"
          label="รายละเอียด"
          rows="3"
        ></v-textarea>

        <v-text-field
          v-model.number="formData.weight"
          label="น้ำหนัก (%)"
          type="number"
          min="0"
          max="100"
          :rules="[rules.required, rules.range(0, 100)]"
        ></v-text-field>

        <v-checkbox
          v-model="formData.active"
          label="เปิดใช้งาน"
        ></v-checkbox>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import topicService from '@/services/topicService';
import { useNotificationStore } from '@/stores/notification';
import { required, range } from '@/utils/validators';

const notificationStore = useNotificationStore();
const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const topics = ref([]);
const topicForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'รหัส', key: 'code' },
  { title: 'ชื่อหัวข้อ', key: 'title_th' },
  { title: 'น้ำหนัก', key: 'weight' },
  { title: 'สถานะ', key: 'active' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const rules = { required, range };

const totalWeight = computed(() => {
  return topics.value.reduce((sum, topic) => sum + (topic.weight || 0), 0);
});

const loadTopics = async () => {
  loading.value = true;
  try {
    const response = await topicService.getAll();
    topics.value = response.data.items || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดหัวข้อได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (topic = null) => {
  editMode.value = !!topic;
  formData.value = topic ? { ...topic } : { active: true, weight: 0 };
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
  if (confirm(`ต้องการลบ "${topic.title_th}" หรือไม่?`)) {
    try {
      await topicService.delete(topic.id);
      notificationStore.success('ลบหัวข้อสำเร็จ');
      loadTopics();
    } catch (error) {
      notificationStore.error(error.response?.data?.message || 'ไม่สามารถลบได้');
    }
  }
};

onMounted(() => {
  loadTopics();
});
</script>
