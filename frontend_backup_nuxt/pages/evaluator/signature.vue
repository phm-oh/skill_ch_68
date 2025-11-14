<!-- frontend/pages/evaluator/signature.vue -->
<!-- 📝 หน้าลงนามอิเล็กทรอนิกส์ (Evaluator) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const documents = ref([])
const loading = ref(false)
const signing = ref(false)
const selectedDoc = ref(null)
const signatureDialog = ref(false)
const signaturePad = ref(null)
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res.items || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchDocuments()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchDocuments() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/assignments/mine`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // กรองเฉพาะที่ประเมินเสร็จแล้ว แต่ยังไม่ลงนาม
    documents.value = (res.items || []).filter(item => 
      item.status === 'completed' && !item.signed_at
    )
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function openSignDialog(doc) {
  selectedDoc.value = doc
  signatureDialog.value = true
}

function closeSignDialog() {
  signatureDialog.value = false
  selectedDoc.value = null
}

async function confirmSign() {
  if (!selectedDoc.value) return
  
  signing.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    await $fetch(`${config.public.apiBase}/api/assignments/${selectedDoc.value.id}/sign`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        signature: 'digital_signature', // TODO: Implement real signature
        signed_at: new Date().toISOString()
      }
    })
    
    successMsg.value = 'ลงนามสำเร็จ'
    closeSignDialog()
    await fetchDocuments()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Sign failed'
  } finally {
    signing.value = false
  }
}

onMounted(() => {
  fetchPeriods()
})
</script>

<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Digital Signature</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">ลงนามอิเล็กทรอนิกส์</p>
      </div>
    </div>

    <!-- Period Selector -->
    <v-card class="mb-6">
      <v-card-text>
        <v-select
          v-model="selectedPeriod"
          :items="periods"
          item-title="name_th"
          item-value="id"
          label="เลือกรอบการประเมิน"
          density="comfortable"
          variant="outlined"
          @update:model-value="fetchDocuments"
        />
      </v-card-text>
    </v-card>

    <!-- Messages -->
    <v-alert v-if="errorMsg" type="error" class="mb-4" closable @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" class="mb-4" closable @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Documents List -->
    <v-card v-if="!loading">
      <v-card-title>เอกสารรอลงนาม ({{ documents.length }})</v-card-title>
      <v-card-text>
        <v-list v-if="documents.length > 0">
          <v-list-item
            v-for="doc in documents"
            :key="doc.id"
            class="mb-2"
          >
            <template #prepend>
              <v-icon color="warning">mdi-file-document-edit-outline</v-icon>
            </template>

            <v-list-item-title>
              {{ doc.evaluatee_name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              รอบการประเมิน: {{ doc.period_name }}
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                color="primary"
                variant="tonal"
                prepend-icon="mdi-draw-pen"
                @click="openSignDialog(doc)"
              >
                ลงนาม
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-check-circle-outline</v-icon>
          <div class="text-h6 mt-4 text-medium-emphasis">ไม่มีเอกสารรอลงนาม</div>
          <div class="text-body-2 mt-2 text-medium-emphasis">
            เอกสารทั้งหมดได้ลงนามเรียบร้อยแล้ว
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Signature Dialog -->
    <v-dialog v-model="signatureDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>ยืนยันการลงนาม</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              คุณกำลังจะลงนามอิเล็กทรอนิกส์สำหรับ:
            </div>
            <div class="text-h6 mt-2">{{ selectedDoc?.evaluatee_name }}</div>
            <div class="text-caption mt-1">{{ selectedDoc?.period_name }}</div>
          </v-alert>

          <!-- TODO: Implement signature pad canvas -->
          <v-card variant="outlined" class="pa-4 text-center" min-height="200">
            <v-icon size="64" color="grey">mdi-draw</v-icon>
            <div class="text-caption mt-2 text-medium-emphasis">
              Signature Pad - Coming Soon
            </div>
          </v-card>

          <v-alert type="warning" variant="tonal" class="mt-4">
            <div class="text-caption">
              การลงนามอิเล็กทรอนิกส์มีผลทางกฎหมายเท่าเทียมกับลายเซ็นจริง
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeSignDialog">ยกเลิก</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            @click="confirmSign"
            :loading="signing"
          >
            ยืนยันการลงนาม
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>