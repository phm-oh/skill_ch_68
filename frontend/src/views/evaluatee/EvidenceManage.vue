<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">จัดการหลักฐาน</h1>

    <base-card title="เลือกรอบการประเมิน" icon="mdi-calendar" class="mb-4">
      <v-select
        v-model="selectedPeriodId"
        :items="periods"
        item-title="period_name"
        item-value="id"
        label="รอบการประเมิน"
        variant="outlined"
        density="compact"
        @update:model-value="loadTopicsAndIndicators"
      ></v-select>
    </base-card>

    <template v-if="selectedPeriodId && !loading">
      <base-card
        v-for="(topic, idx) in topics"
        :key="topic.id"
        :title="topic.topic_name"
        :subtitle="`น้ำหนัก ${topic.weight_percentage}%`"
        icon="mdi-book-open-variant"
        class="mb-4"
        :color="getTopicColor(idx)"
        variant="tonal"
      >
        <v-card
          v-for="indicator in topic.indicators"
          :key="indicator.id"
          class="mb-4 pa-4"
          :color="getIndicatorColor(idx)"
          variant="outlined"
          elevation="2"
        >
          <div class="d-flex align-center mb-3">
            <v-icon icon="mdi-checkbox-marked-circle-outline" class="mr-2" size="large" :color="getIconColor(idx)"></v-icon>
            <span class="text-subtitle-1 font-weight-bold flex-grow-1">{{ indicator.indicator_name }}</span>
            <v-chip :color="getIconColor(idx)" variant="flat">{{ indicator.weight_score }}%</v-chip>
          </div>

          <div v-if="getIndicatorFiles(indicator.id).length > 0" class="mb-3">
            <div class="text-subtitle-2 mb-2 font-weight-bold">📎 ไฟล์ที่อัปโหลดแล้ว:</div>
            <v-list density="compact" class="rounded" :bg-color="getListBgColor(idx)">
              <v-list-item v-for="file in getIndicatorFiles(indicator.id)" :key="file.id" class="my-1">
                <template v-slot:prepend>
                  <v-icon :icon="getFileIcon(file.file_name)" :color="getIconColor(idx)" size="large"></v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">{{ file.file_name }}</v-list-item-title>
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
        </v-card>
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
    periods.value = periodsRes.data.data;
    if (activeRes.data.data) {
      selectedPeriodId.value = activeRes.data.data.id;
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
    const filteredTopics = topicsRes.data.data.filter(t => t.period_id === selectedPeriodId.value);
    for (const topic of filteredTopics) {
      const indicatorsRes = await topicService.getIndicatorsByTopic(topic.id);
      topic.indicators = indicatorsRes.data.data;
    }
    topics.value = filteredTopics;
    const res = await uploadService.getMine();
    uploadedFiles.value = res.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const getIndicatorFiles = (indicatorId) => uploadedFiles.value.filter(f => f.indicator_id === indicatorId);

const handleFileUploaded = async () => {
  const res = await uploadService.getMine();
  uploadedFiles.value = res.data.data || [];
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

const viewFile = (file) => window.open(file.url, '_blank');

const downloadFile = (file) => {
  const link = document.createElement('a');
  link.href = file.url;
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

// Color schemes for topics and indicators
const topicColors = ['blue-lighten-4', 'green-lighten-4', 'purple-lighten-4', 'orange-lighten-4', 'cyan-lighten-4', 'pink-lighten-4'];
const indicatorColors = ['blue-lighten-5', 'green-lighten-5', 'purple-lighten-5', 'orange-lighten-5', 'cyan-lighten-5', 'pink-lighten-5'];
const iconColors = ['blue-darken-2', 'green-darken-2', 'purple-darken-2', 'orange-darken-2', 'cyan-darken-2', 'pink-darken-2'];
const listBgColors = ['blue-lighten-5', 'green-lighten-5', 'purple-lighten-5', 'orange-lighten-5', 'cyan-lighten-5', 'pink-lighten-5'];

const getTopicColor = (idx) => topicColors[idx % topicColors.length];
const getIndicatorColor = (idx) => indicatorColors[idx % indicatorColors.length];
const getIconColor = (idx) => iconColors[idx % iconColors.length];
const getListBgColor = (idx) => listBgColors[idx % listBgColors.length];

onMounted(fetchPeriods);
</script>
