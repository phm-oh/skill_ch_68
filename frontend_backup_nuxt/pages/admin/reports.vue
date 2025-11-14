<!-- frontend/pages/admin/reports.vue -->
<!-- 📊 หน้ารายงานสรุป (Admin Only) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const loading = ref(false)
const reportData = ref(null)
const errorMsg = ref('')

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res.items || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchReport()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchReport() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/reports/overall/${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    reportData.value = res.data || null
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function exportCSV() {
  try {
    // TODO: Implement CSV export
    alert('CSV Export coming soon!')
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Export failed'
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
        <h1 class="text-h4 font-weight-bold">Reports</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">รายงานสรุปผลการประเมิน</p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-download"
        @click="exportCSV"
        :disabled="!reportData"
      >
        Export CSV
      </v-btn>
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
          @update:model-value="fetchReport"
        />
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Error Message -->
    <v-alert v-if="errorMsg" type="error" class="mb-4">{{ errorMsg }}</v-alert>

    <!-- Report Content -->
    <v-card v-if="reportData">
      <v-card-title>สรุปภาพรวม</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-card variant="tonal" color="primary">
              <v-card-text class="text-center">
                <div class="text-h3 font-weight-bold">{{ reportData.total_evaluatees || 0 }}</div>
                <div class="text-subtitle-2 mt-2">ผู้ถูกประเมินทั้งหมด</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-h3 font-weight-bold">{{ reportData.completed || 0 }}</div>
                <div class="text-subtitle-2 mt-2">ประเมินเสร็จแล้ว</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="tonal" color="warning">
              <v-card-text class="text-center">
                <div class="text-h3 font-weight-bold">{{ reportData.in_progress || 0 }}</div>
                <div class="text-subtitle-2 mt-2">กำลังดำเนินการ</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card variant="tonal" color="info">
              <v-card-text class="text-center">
                <div class="text-h3 font-weight-bold">{{ reportData.average_score || 0 }}</div>
                <div class="text-subtitle-2 mt-2">คะแนนเฉลี่ย</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Empty State -->
    <v-card v-else-if="!loading">
      <v-card-text class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-box-outline</v-icon>
        <div class="text-h6 mt-4 text-medium-emphasis">ไม่มีข้อมูลรายงาน</div>
        <div class="text-body-2 mt-2 text-medium-emphasis">เลือกรอบการประเมินเพื่อดูรายงาน</div>
      </v-card-text>
    </v-card>
  </div>
</template>