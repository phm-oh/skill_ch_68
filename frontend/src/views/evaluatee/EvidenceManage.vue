<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการหลักฐาน</h1>

    <v-row>
      <v-col cols="12">
        <evidence-upload
          @uploaded="handleUploaded"
          @error="handleError"
        ></evidence-upload>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <base-card title="ไฟล์หลักฐานที่อัปโหลด" icon="mdi-file-document-multiple">
          <base-table
            :headers="headers"
            :items="evidenceFiles"
            :loading="loading"
          >
            <template #item.created_at="{ item }">
              {{ formatDateTime(item.created_at) }}
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-download" size="small" variant="text" @click="downloadFile(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteFile(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import EvidenceUpload from '@/components/common/EvidenceUpload.vue';
import uploadService from '@/services/uploadService';
import { useNotificationStore } from '@/stores/notification';
import { formatDateTime } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const loading = ref(false);
const evidenceFiles = ref([]);

const headers = [
  { title: 'ชื่อไฟล์', key: 'original_name' },
  { title: 'วันที่อัปโหลด', key: 'created_at' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const loadFiles = async () => {
  loading.value = true;
  try {
    const response = await uploadService.getMine();
    evidenceFiles.value = response.data.items || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดไฟล์ได้');
  } finally {
    loading.value = false;
  }
};

const handleUploaded = () => {
  notificationStore.success('อัปโหลดไฟล์สำเร็จ');
  loadFiles();
};

const handleError = (error) => {
  notificationStore.error(error);
};

const downloadFile = (file) => {
  const link = document.createElement('a');
  link.href = `/uploads/${file.filename}`;
  link.download = file.original_name;
  link.click();
};

const deleteFile = async (file) => {
  if (confirm(`ต้องการลบไฟล์ "${file.original_name}" หรือไม่?`)) {
    try {
      await uploadService.delete(file.id);
      notificationStore.success('ลบไฟล์สำเร็จ');
      loadFiles();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบไฟล์ได้');
    }
  }
};

onMounted(() => {
  loadFiles();
});
</script>
