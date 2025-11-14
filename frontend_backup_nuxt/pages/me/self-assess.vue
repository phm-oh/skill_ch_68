<!-- frontend/pages/me/self-assess.vue -->
<!-- 📋 หน้าประเมินตนเอง + อัปโหลดหลักฐาน (Evaluatee) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const periods = ref([])
const selectedPeriod = ref(null)
const topics = ref([])
const results = ref({}) // { indicator_id: { score, files: [] } }
const loading = ref(false)
const saving = ref(false)
const initializing = ref(false) // ⚠️ ส่วนเพิ่มเติม
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchPeriods() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res || []
    if (periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].id
      await fetchIndicators()
    }
  } catch (e) {
    console.error('Load periods failed:', e)
  }
}

// ⚠️ ส่วนเพิ่มเติม: เรียก API init-for-me ถ้ายังไม่มี results
async function initMyResults() {
  if (!selectedPeriod.value) return
  
  initializing.value = true
  try {
    const res = await $fetch(`${config.public.apiBase}/api/results/init-for-me`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: { period_id: selectedPeriod.value }
    })
    
    if (res.success && res.data.created > 0) {
      console.log(`Created ${res.data.created} evaluation records`)
      // โหลดผลประเมินใหม่
      await fetchMyResults()
    }
  } catch (e) {
    console.error('Init results failed:', e)
  } finally {
    initializing.value = false
  }
}

async function fetchIndicators() {
  if (!selectedPeriod.value) return
  
  loading.value = true
  errorMsg.value = ''
  try {
    // ดึง topics + indicators
    const topicsRes = await $fetch(`${config.public.apiBase}/api/topics/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    const indicatorsRes = await $fetch(`${config.public.apiBase}/api/attachments/indicators`, {
      params: { period_id: selectedPeriod.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // จัดกลุ่ม indicators ตาม topic
    const topicsData = topicsRes.items || []
    const indicatorsData = indicatorsRes || []
    
    topics.value = topicsData.map(topic => ({
      ...topic,
      indicators: indicatorsData.filter(ind => ind.topic_id === topic.id)
    })).filter(topic => topic.indicators.length > 0)

    // โหลดผลประเมินเดิม (ถ้ามี)
    await fetchMyResults()
    
    // ⚠️ ส่วนเพิ่มเติม: ถ้าไม่มี results ให้สร้างใหม่
    if (Object.keys(results.value).length === 0) {
      await initMyResults()
    }
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function fetchMyResults() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/results/me/${selectedPeriod.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // แปลงเป็น object { indicator_id: { score, ... } }
    const items = res.items || []
    results.value = items.reduce((acc, item) => {
      acc[item.indicator_id] = {
        score: item.self_score || 0,
        note: item.self_note || '',
        files: []
      }
      return acc
    }, {})
  } catch (e) {
    console.error('Load results failed:', e)
  }
}

async function handleFileUpload(indicatorId, event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  const formData = new FormData()
  formData.append('file', files[0])

  try {
    const res = await $fetch(`${config.public.apiBase}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: formData
    })
    
    // เก็บ URL ไฟล์
    if (!results.value[indicatorId]) {
      results.value[indicatorId] = { score: 0, note: '', files: [] }
    }
    results.value[indicatorId].files.push(res.url)
    
    console.log('File uploaded:', res.url)
  } catch (e) {
    console.error('Upload failed:', e)
    errorMsg.value = 'Upload failed'
  }
}

function getScore(indicatorId) {
  return results.value[indicatorId]?.score || 0
}

function setScore(indicatorId, score) {
  if (!results.value[indicatorId]) {
    results.value[indicatorId] = { score: 0, note: '', files: [] }
  }
  results.value[indicatorId].score = score
}

function getNote(indicatorId) {
  return results.value[indicatorId]?.note || ''
}

function setNote(indicatorId, note) {
  if (!results.value[indicatorId]) {
    results.value[indicatorId] = { score: 0, note: '', files: [] }
  }
  results.value[indicatorId].note = note
}

async function saveResults() {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true

  try {
    // เตรียมข้อมูล
    const items = Object.entries(results.value).map(([indicator_id, data]) => ({
      indicator_id: Number(indicator_id),
      score: data.score || 0
    }))

    // บันทึก
    await $fetch(`${config.public.apiBase}/api/results/self/bulk`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: {
        period_id: selectedPeriod.value,
        items
      }
    })

    successMsg.value = 'บันทึกสำเร็จ'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    saving.value = false
  }
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
        <v-icon left color="primary">mdi-star-check-outline</v-icon>
        <span class="text-h5 ml-2">ประเมินตนเอง</span>
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
              @update:model-value="fetchIndicators"
            />
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <!-- ⚠️ ส่วนเพิ่มเติม: แสดงสถานะ initializing -->
        <v-alert v-if="initializing" type="info" class="mb-4">
          <v-progress-circular indeterminate size="20" class="mr-2" />
          กำลังสร้างรายการประเมิน...
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Indicators by Topic -->
        <v-expansion-panels v-else-if="topics.length > 0">
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon left>mdi-folder-outline</v-icon>
                <strong>{{ topic.title_th }}</strong>
                <v-spacer />
                <v-chip size="small" class="mr-2">
                  {{ topic.indicators.length }} รายการ
                </v-chip>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4">
                  <v-list-item-title class="font-weight-bold mb-2">
                    {{ indicator.name_th }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="indicator.description" class="mb-3">
                    {{ indicator.description }}
                  </v-list-item-subtitle>

                  <!-- คะแนน -->
                  <div class="d-flex align-center mb-3">
                    <span class="mr-4">คะแนน:</span>
                    <v-slider
                      :model-value="getScore(indicator.id)"
                      @update:model-value="setScore(indicator.id, $event)"
                      :min="0"
                      :max="indicator.type === 'yes_no' ? 1 : 10"
                      :step="1"
                      thumb-label
                      :color="getScore(indicator.id) > 0 ? 'primary' : 'grey'"
                      class="flex-grow-1"
                    />
                    <v-chip class="ml-4" :color="getScore(indicator.id) > 0 ? 'primary' : 'grey'">
                      {{ getScore(indicator.id) }}
                    </v-chip>
                  </div>

                  <!-- หมายเหตุ -->
                  <v-textarea
                    :model-value="getNote(indicator.id)"
                    @update:model-value="setNote(indicator.id, $event)"
                    label="หมายเหตุ (ถ้ามี)"
                    rows="2"
                    variant="outlined"
                    density="compact"
                    class="mb-3"
                  />

                  <!-- อัปโหลดไฟล์ -->
                  <v-file-input
                    label="อัปโหลดหลักฐาน"
                    prepend-icon="mdi-paperclip"
                    variant="outlined"
                    density="compact"
                    @change="handleFileUpload(indicator.id, $event)"
                  />
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- ⚠️ ส่วนเพิ่มเติม: แสดงเมื่อไม่มีข้อมูล -->
        <v-alert v-else type="warning" class="mt-4">
          ไม่พบรายการประเมิน กรุณาเลือกรอบการประเมินที่เปิดใช้งาน
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="loading || initializing || topics.length === 0"
          @click="saveResults"
        >
          <v-icon left>mdi-content-save</v-icon>
          บันทึก
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>