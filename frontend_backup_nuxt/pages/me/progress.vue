<!-- frontend/pages/me/progress.vue -->
<!-- 📋 หน้าติดตามความคืบหน้า (Evaluatee) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const results = ref([])
const assignments = ref([])
const loading = ref(false)
const errorMsg = ref('')

// ============= COMPUTED =============
const progress = computed(() => {
  if (results.value.length === 0) return { completed: 0, total: 0, percent: 0 }
  
  const total = results.value.length
  const completed = results.value.filter(r => r.self_score > 0).length
  const percent = Math.round((completed / total) * 100)
  
  return { completed, total, percent }
})

const totalScore = computed(() => {
  return results.value.reduce((sum, r) => sum + (r.self_score || 0), 0)
})

const evaluatorProgress = computed(() => {
  if (results.value.length === 0) return { completed: 0, total: 0, percent: 0 }
  
  const total = results.value.length
  const completed = results.value.filter(r => r.evaluator_score > 0).length
  const percent = Math.round((completed / total) * 100)
  
  return { completed, total, percent }
})

// ⚠️ ส่วนเพิ่มเติม: จัดกลุ่มผลประเมินตาม topic
const resultsByTopic = computed(() => {
  const grouped = {}
  
  results.value.forEach(r => {
    const topicName = r.topic_name || 'อื่นๆ'
    if (!grouped[topicName]) {
      grouped[topicName] = []
    }
    grouped[topicName].push(r)
  })
  
  return grouped
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
      fetchProgress()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

async function fetchProgress() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    // ดึงผลประเมิน
    const res = await $fetch(`${config.public.apiBase}/api/results/me/${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    results.value = res.items || []
    
    // ⚠️ ส่วนเพิ่มเติม: ดึงรายชื่อกรรมการที่ได้รับมอบหมาย
    try {
      const assignRes = await $fetch(`${config.public.apiBase}/api/assignments/mine`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      assignments.value = assignRes.items || []
    } catch (e) {
      console.error('Load assignments failed:', e)
    }
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

function getProgressColor(percent) {
  if (percent >= 80) return 'success'
  if (percent >= 50) return 'warning'
  return 'error'
}

function getStatusColor(result) {
  if (result.evaluator_score > 0) return 'success'
  if (result.self_score > 0) return 'info'
  return 'grey'
}

function getStatusText(result) {
  if (result.evaluator_score > 0) return 'กรรมการประเมินแล้ว'
  if (result.self_score > 0) return 'รอกรรมการประเมิน'
  return 'ยังไม่ได้ประเมิน'
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
        <v-icon left color="primary">mdi-progress-clock</v-icon>
        <span class="text-h5 ml-2">ความคืบหน้าการประเมิน</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- เลือกรอบประเมิน -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedPeriod"
              :items="periods"
              item-title="name_th"
              item-value="id"
              label="เลือกรอบการประเมิน"
              @update:model-value="fetchProgress"
            />
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
          <!-- Progress Cards -->
          <v-row class="mb-4">
            <!-- ประเมินตนเอง -->
            <v-col cols="12" md="6">
              <v-card color="primary" variant="tonal">
                <v-card-title>
                  <v-icon left>mdi-account-check</v-icon>
                  การประเมินตนเอง
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 mb-2">{{ progress.completed }} / {{ progress.total }}</div>
                  <v-progress-linear
                    :model-value="progress.percent"
                    :color="getProgressColor(progress.percent)"
                    height="20"
                    rounded
                  >
                    <strong>{{ progress.percent }}%</strong>
                  </v-progress-linear>
                  <div class="text-subtitle-1 mt-2">
                    คะแนนรวม: <strong>{{ totalScore }}</strong>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- การประเมินโดยกรรมการ -->
            <v-col cols="12" md="6">
              <v-card color="success" variant="tonal">
                <v-card-title>
                  <v-icon left>mdi-account-star</v-icon>
                  การประเมินโดยกรรมการ
                </v-card-title>
                <v-card-text>
                  <div class="text-h4 mb-2">{{ evaluatorProgress.completed }} / {{ evaluatorProgress.total }}</div>
                  <v-progress-linear
                    :model-value="evaluatorProgress.percent"
                    :color="getProgressColor(evaluatorProgress.percent)"
                    height="20"
                    rounded
                  >
                    <strong>{{ evaluatorProgress.percent }}%</strong>
                  </v-progress-linear>
                  <div class="text-subtitle-1 mt-2">
                    กรรมการ: <strong>{{ assignments.length }}</strong> คน
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- รายละเอียดตาม Topic -->
          <v-expansion-panels v-if="Object.keys(resultsByTopic).length > 0">
            <v-expansion-panel v-for="(items, topicName) in resultsByTopic" :key="topicName">
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon left>mdi-folder-outline</v-icon>
                  <strong>{{ topicName }}</strong>
                  <v-spacer />
                  <v-chip size="small" class="mr-2">
                    {{ items.length }} รายการ
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list>
                  <v-list-item v-for="result in items" :key="result.id">
                    <v-list-item-title>{{ result.indicator_name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="getStatusColor(result)" size="small" class="mr-2">
                        {{ getStatusText(result) }}
                      </v-chip>
                      <span v-if="result.self_score > 0">
                        คะแนนตนเอง: <strong>{{ result.self_score }}</strong>
                      </span>
                      <span v-if="result.evaluator_score > 0" class="ml-2">
                        | คะแนนกรรมการ: <strong>{{ result.evaluator_score }}</strong>
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-alert v-else type="warning" class="mt-4">
            ยังไม่มีข้อมูลการประเมิน
          </v-alert>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>