<!-- frontend/pages/evaluatee/dashboard.vue -->
<!-- 📊 หน้าแดชบอร์ดสำหรับผู้ถูกประเมิน (Evaluatee) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const assignments = ref([])
const loading = ref(false)
const errorMsg = ref('')

// ============= COMPUTED =============
const summary = computed(() => {
  const total = assignments.value.length
  const completed = assignments.value.filter(a => a.status === 'completed').length
  const pending = total - completed

  return { total, completed, pending }
})

// ============= METHODS =============
async function fetchPeriods() {
  try {
    console.log('🔍 Fetching periods...')
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res.items || []
    console.log('✅ Periods loaded:', periods.value.length)

    if (periods.value.length > 0) {
      // เลือกรอบที่ active หรือรอบแรก
      const activePeriod = periods.value.find(p => p.is_active === 1)
      selectedPeriod.value = activePeriod?.id || periods.value[0].id
      fetchAssignments()
    }
  } catch (e) {
    console.error('❌ Load periods failed:', e)
    errorMsg.value = 'โหลดรอบการประเมินไม่สำเร็จ'
  }
}

async function fetchAssignments() {
  if (!selectedPeriod.value) return

  loading.value = true
  errorMsg.value = ''
  try {
    console.log('🔍 Fetching assignments for period:', selectedPeriod.value)
    const res = await $fetch(`${config.public.apiBase}/api/assignments/mine`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    console.log('✅ Assignments response:', res)
    assignments.value = res.items || []
    console.log('📋 My assignments:', assignments.value.length, 'items')
  } catch (e) {
    console.error('❌ Load assignments failed:', e)
    errorMsg.value = e.data?.message || e.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function getStatusColor(status) {
  const colors = {
    'completed': 'success',
    'in_progress': 'warning',
    'pending': 'grey'
  }
  return colors[status] || 'grey'
}

function getStatusText(status) {
  const texts = {
    'completed': 'เสร็จสิ้น',
    'in_progress': 'กำลังดำเนินการ',
    'pending': 'รอดำเนินการ'
  }
  return texts[status] || 'รอดำเนินการ'
}

// ============= LIFECYCLE =============
onMounted(() => {
  console.log('🚀 Evaluatee dashboard mounted')
  console.log('👤 User:', auth.user)
  fetchPeriods()
})
</script>

<template>
  <div class="pa-4">
    <!-- Header with Home Button -->
    <div class="d-flex align-center mb-4">
      <v-btn icon size="small" variant="text" @click="$router.push('/')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <h1 class="text-h5 ml-2">ข้อมูลการประเมินของฉัน</h1>
    </div>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-account-check</v-icon>
        <span class="text-h6 ml-2">รายการกรรมการที่ประเมิน</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Filter Period -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              item-title="name_th"
              item-value="id"
              label="เลือกรอบการประเมิน"
              @update:model-value="fetchAssignments"
            />
          </v-col>
        </v-row>

        <!-- Summary Cards -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.total }}</div>
                <div class="text-subtitle-1">กรรมการทั้งหมด</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="success" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.completed }}</div>
                <div class="text-subtitle-1">ประเมินแล้ว</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="warning" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.pending }}</div>
                <div class="text-subtitle-1">รอการประเมิน</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Assignment List -->
        <v-list v-else-if="assignments.length > 0">
          <v-list-item
            v-for="assignment in assignments"
            :key="assignment.id"
            class="mb-2"
            border
            rounded
          >
            <template #prepend>
              <v-avatar color="primary" size="56">
                <span class="text-h6 text-white">
                  {{ assignment.evaluator_name?.charAt(0) || 'E' }}
                </span>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold">
              {{ assignment.evaluator_name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              ประเมินโดย: {{ assignment.evaluator_name }}
            </v-list-item-subtitle>
            <v-list-item-subtitle>
              รอบ: {{ assignment.period_name }}
            </v-list-item-subtitle>

            <template #append>
              <v-chip
                :color="getStatusColor(assignment.status)"
                size="small"
              >
                {{ getStatusText(assignment.status) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <!-- No Data -->
        <div v-else class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-clipboard-text-outline</v-icon>
          <div class="text-subtitle-1 mt-2">ยังไม่มีข้อมูลการประเมิน</div>
          <div class="text-caption text-grey">รอการมอบหมายจากผู้ดูแลระบบ</div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
