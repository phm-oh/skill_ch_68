<template>
  <v-container fluid>
    <v-btn variant="text" color="primary" to="/evaluatee" class="mb-2">
      <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
    </v-btn>
    <h1 class="text-h4 mb-4">จัดการหลักฐาน</h1>

    <base-card title="เลือกรอบการประเมิน" icon="mdi-calendar" class="mb-4">
      <v-select
        v-model="selectedPeriodId"
        :items="periods"
        item-title="name_th"
        item-value="id"
        label="รอบการประเมิน"
        variant="outlined"
        density="compact"
        @update:model-value="loadTopicsAndIndicators"
      ></v-select>
    </base-card>

    <template v-if="selectedPeriodId && !loading">
      <base-card
        v-for="topic in topics"
        :key="topic.id"
        :title="topic.title_th"
        :subtitle="`น้ำหนัก ${topic.weight}%`"
        icon="mdi-book-open-variant"
        class="mb-4"
      >
        <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-6">
          <v-divider class="mb-4"></v-divider>

          <div class="d-flex align-center mb-3">
            <v-icon icon="mdi-checkbox-marked-circle-outline" class="mr-2" color="primary"></v-icon>
            <span class="text-subtitle-1 font-weight-medium">{{ indicator.name_th }}</span>
            <v-chip size="small" color="primary" class="ml-2">{{ indicator.weight }}%</v-chip>
          </div>

          <div v-if="getIndicatorFiles(indicator.id).length > 0" class="mb-3">
            <div class="text-subtitle-2 mb-2">ไฟล์ที่อัปโหลดแล้ว:</div>
            <v-list density="compact" class="bg-grey-lighten-5 rounded">
              <v-list-item v-for="file in getIndicatorFiles(indicator.id)" :key="file.id">
                <template v-slot:prepend>
                  <v-icon :icon="getFileIcon(file.file_name)" color="primary"></v-icon>
                </template>
                <v-list-item-title>{{ file.file_name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(file.size_bytes) }} | {{ formatDate(file.created_at) }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="viewFile(file)"></v-btn>
                  <v-btn icon="mdi-download" size="small" variant="text" color="success" @click="downloadFile(file)"></v-btn>
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(file)"></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <evidence-upload
            :period-id="selectedPeriodId"
            :indicator-id="indicator.id"
            :evidence-type-id="1"
            @uploaded="handleFileUploaded"
            @error="handleUploadError"
          ></evidence-upload>
        </div>
      </base-card>
    </template>

    <loading-overlay :loading="loading"></loading-overlay>

    <base-dialog
      v-model="deleteDialog"
      title="ยืนยันการลบไฟล์"
      icon="mdi-delete-alert"
      confirm-text="ลบ"
      confirm-color="error"
      @confirm="deleteFile"
      @cancel="deleteDialog = false"
    >
      <p>คุณต้องการลบไฟล์ "{{ fileToDelete?.file_name }}" หรือไม่?</p>
      <v-alert type="warning" variant="tonal" class="mt-2">การลบไฟล์ไม่สามารถกู้คืนได้</v-alert>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import periodService from '@/services/periodService';
import topicService from '@/services/topicService';
import uploadService from '@/services/uploadService';
import BaseCard from '@/components/base/BaseCard.vue';
import EvidenceUpload from '@/components/common/EvidenceUpload.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';

const notificationStore = useNotificationStore();
const periods = ref([]);
const selectedPeriodId = ref(null);
const topics = ref([]);
const uploadedFiles = ref([]);
const loading = ref(false);
const deleteDialog = ref(false);
const fileToDelete = ref(null);

const fetchPeriods = async () => {
  try {
    const [periodsRes, activeRes] = await Promise.all([
      periodService.getAll(),
      periodService.getActive()
    ]);
    // Backend ส่ง { success: true, items: [...] }
    periods.value = periodsRes.data.items || periodsRes.data.data || [];
    const activePeriods = activeRes.data.items || activeRes.data.data || [];
    const activePeriod = activePeriods[0] || null;
    if (activePeriod) {
      selectedPeriodId.value = activePeriod.id;
      await loadTopicsAndIndicators();
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const loadTopicsAndIndicators = async () => {
  if (!selectedPeriodId.value) return;
  loading.value = true;
  try {
    const topicsRes = await topicService.getAll();
    // Backend ส่ง { success: true, items: [...] }
    const allTopics = topicsRes.data.items || topicsRes.data.data || [];

    for (const topic of allTopics) {
      const indicatorsRes = await topicService.getIndicatorsByTopic(topic.id);
      topic.indicators = indicatorsRes.data.items || indicatorsRes.data.data || [];
    }
    topics.value = allTopics;

    const res = await uploadService.getMine();
    uploadedFiles.value = res.data.items || res.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const getIndicatorFiles = (indicatorId) => uploadedFiles.value.filter(f => f.indicator_id === indicatorId);

const handleFileUploaded = async () => {
  const res = await uploadService.getMine();
  uploadedFiles.value = res.data.items || res.data.data || [];
  notificationStore.success('อัปโหลดไฟล์สำเร็จ');
};

const handleUploadError = (message) => notificationStore.error(message);

const confirmDelete = (file) => {
  fileToDelete.value = file;
  deleteDialog.value = true;
};

const deleteFile = async () => {
  try {
    await uploadService.delete(fileToDelete.value.id);
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== fileToDelete.value.id);
    notificationStore.success('ลบไฟล์สำเร็จ');
    deleteDialog.value = false;
    fileToDelete.value = null;
  } catch (error) {
    notificationStore.error('ไม่สามารถลบไฟล์ได้');
  }
};

const getFileUrl = (file) => {
  const relativePath = file.file_url || file.url;
  if (!relativePath) return null;
  // ถ้าเป็น relative path (/uploads/...) ให้เพิ่ม base URL
  if (relativePath.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';
    // เอา /api ออกเพื่อให้ได้ http://localhost:7000
    const apiBase = baseURL.replace('/api', '');
    return apiBase + relativePath;
  }
  // ถ้าเป็น full URL แล้วใช้เลย
  return relativePath;
};

const viewFile = (file) => {
  const fileUrl = getFileUrl(file);
  if (fileUrl) {
    window.open(fileUrl, '_blank');
  } else {
    notificationStore.error('ไม่พบ URL ของไฟล์');
  }
};

const downloadFile = (file) => {
  const link = document.createElement('a');
  link.href = getFileUrl(file);
  link.download = file.file_name;
  link.click();
};

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const icons = { pdf: 'mdi-file-pdf-box', doc: 'mdi-file-word', docx: 'mdi-file-word',
    xls: 'mdi-file-excel', xlsx: 'mdi-file-excel', jpg: 'mdi-file-image',
    jpeg: 'mdi-file-image', png: 'mdi-file-image', gif: 'mdi-file-image' };
  return icons[ext] || 'mdi-file-document';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('th-TH',
  { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

onMounted(fetchPeriods);
</script>
