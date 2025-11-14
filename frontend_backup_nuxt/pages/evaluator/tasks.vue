<!-- frontend/pages/evaluator/tasks.vue -->
<!-- 📋 หน้างานที่ได้รับมอบหมาย (Evaluator) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()
const router = useRouter()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const tasks = ref([])
const loading = ref(false)
const errorMsg = ref('')

// ============= COMPUTED =============
const summary = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter(t => t.status === 'completed').length
  const pending = total - completed
  
  return { total, completed, pending }
})

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      fetchTasks()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchTasks() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/assignments/mine`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    tasks.value = res.items || []
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function goToEvaluate(task) {
  router.push(`/evaluator/evaluate/${task.evaluatee_id}?period=${selectedPeriod.value}`)
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
  fetchPeriods()
})
</script>

<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-briefcase</v-icon>
        <span class="text-h5 ml-2">งานที่ได้รับมอบหมาย</span>
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
              @update:model-value="fetchTasks"
            />
          </v-col>
        </v-row>

        <!-- Summary Cards -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.total }}</div>
                <div class="text-subtitle-1">งานทั้งหมด</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="success" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.completed }}</div>
                <div class="text-subtitle-1">เสร็จสิ้น</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="warning" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ summary.pending }}</div>
                <div class="text-subtitle-1">รอดำเนินการ</div>
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

        <!-- Task List -->
        <v-list v-else-if="tasks.length > 0">
          <v-list-item
            v-for="task in tasks"
            :key="task.id"
            class="mb-2"
            border
            rounded
          >
            <template #prepend>
              <v-avatar color="primary" size="56">
                <span class="text-h6 text-white">
                  {{ task.evaluatee_name?.charAt(0) || 'E' }}
                </span>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-bold">
              {{ task.evaluatee_name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              มอบหมายเมื่อ: {{ new Date(task.assigned_at).toLocaleDateString('th-TH') }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end gap-2">
                <v-chip
                  :color="getStatusColor(task.status)"
                  size="small"
                >
                  {{ getStatusText(task.status) }}
                </v-chip>
                <v-btn
                  color="primary"
                  size="small"
                  @click="goToEvaluate(task)"
                >
                  <v-icon left>mdi-clipboard-edit</v-icon>
                  {{ task.status === 'completed' ? 'ดูรายละเอียด' : 'ให้คะแนน' }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <!-- No Data -->
        <div v-else class="text-center pa-8">
          <v-icon size="64" color="grey">mdi-briefcase-outline</v-icon>
          <div class="text-subtitle-1 mt-2">ไม่มีงานที่ได้รับมอบหมาย</div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>