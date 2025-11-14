<template>
  <div>
    <v-card elevation="2">
      <v-card-title>แนบหลักฐาน</v-card-title>

      <v-card-text>
        <!-- File Upload -->
        <v-file-input
          v-model="selectedFiles"
          :accept="acceptedTypes"
          label="เลือกไฟล์"
          prepend-icon="mdi-paperclip"
          multiple
          chips
          show-size
          :disabled="uploading"
          @update:model-value="handleFileSelect"
        >
          <template v-slot:selection="{ fileNames }">
            <v-chip
              v-for="fileName in fileNames"
              :key="fileName"
              color="primary"
              label
              size="small"
            >
              {{ fileName }}
            </v-chip>
          </template>
        </v-file-input>

        <!-- Progress Bar -->
        <v-progress-linear
          v-if="uploading"
          v-model="uploadProgress"
          color="primary"
          height="20"
          class="mt-2"
        >
          <template v-slot:default="{ value }">
            <strong>{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>

        <!-- Upload Button -->
        <v-btn
          v-if="selectedFiles.length > 0"
          color="primary"
          :loading="uploading"
          @click="uploadFiles"
          class="mt-2"
        >
          <v-icon icon="mdi-upload" start></v-icon>
          อัปโหลด
        </v-btn>

        <!-- URL Input -->
        <v-text-field
          v-model="evidenceUrl"
          label="URL หลักฐาน"
          prepend-icon="mdi-link"
          class="mt-4"
        >
          <template v-slot:append>
            <v-btn
              icon="mdi-plus"
              size="small"
              @click="addUrl"
            ></v-btn>
          </template>
        </v-text-field>

        <!-- Text Evidence -->
        <v-textarea
          v-model="evidenceText"
          label="คำอธิบายเพิ่มเติม"
          prepend-icon="mdi-text"
          rows="3"
        ></v-textarea>

        <!-- Uploaded Files List -->
        <div v-if="uploadedFiles.length > 0" class="mt-4">
          <v-divider class="mb-2"></v-divider>
          <div class="text-subtitle-2 mb-2">ไฟล์ที่อัปโหลดแล้ว:</div>
          <v-chip
            v-for="file in uploadedFiles"
            :key="file.id"
            closable
            @click:close="removeFile(file.id)"
            class="ma-1"
          >
            <v-icon icon="mdi-file" start></v-icon>
            {{ file.original_name || file.filename }}
          </v-chip>
        </div>

        <!-- URLs List -->
        <div v-if="urls.length > 0" class="mt-2">
          <div class="text-subtitle-2 mb-2">URL ที่แนบ:</div>
          <v-chip
            v-for="(url, index) in urls"
            :key="index"
            closable
            @click:close="removeUrl(index)"
            class="ma-1"
          >
            <v-icon icon="mdi-link" start></v-icon>
            {{ url }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import uploadService from '@/services/uploadService';

const props = defineProps({
  acceptedTypes: {
    type: String,
    default: 'application/pdf,image/jpeg,image/png'
  },
  maxSize: { type: Number, default: 5 * 1024 * 1024 } // 5MB
});

const emit = defineEmits(['uploaded', 'error']);

const selectedFiles = ref([]);
const uploadedFiles = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const evidenceUrl = ref('');
const urls = ref([]);
const evidenceText = ref('');

const handleFileSelect = (files) => {
  // Validate file sizes
  if (files) {
    for (const file of files) {
      if (file.size > props.maxSize) {
        emit('error', `ไฟล์ ${file.name} มีขนาดเกิน 5MB`);
        selectedFiles.value = [];
        return;
      }
    }
  }
};

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return;

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    for (const file of selectedFiles.value) {
      const result = await uploadService.uploadEvidence(file, (progress) => {
        uploadProgress.value = progress;
      });

      uploadedFiles.value.push(result.data.data);
    }

    selectedFiles.value = [];
    emit('uploaded', uploadedFiles.value);
  } catch (error) {
    emit('error', error.message);
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const addUrl = () => {
  if (evidenceUrl.value.trim()) {
    urls.value.push(evidenceUrl.value.trim());
    evidenceUrl.value = '';
  }
};

const removeUrl = (index) => {
  urls.value.splice(index, 1);
};

const removeFile = async (id) => {
  try {
    await uploadService.delete(id);
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id);
  } catch (error) {
    emit('error', 'ไม่สามารถลบไฟล์ได้');
  }
};

// Expose data for parent
defineExpose({
  getEvidenceData: () => ({
    files: uploadedFiles.value.map(f => f.id),
    urls: urls.value,
    text: evidenceText.value
  }),
  reset: () => {
    selectedFiles.value = [];
    uploadedFiles.value = [];
    urls.value = [];
    evidenceText.value = '';
  }
});
</script>
