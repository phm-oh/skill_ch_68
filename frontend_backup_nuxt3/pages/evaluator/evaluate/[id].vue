<!-- frontend/pages/evaluator/evaluate/[id].vue -->
<!-- 📋 หน้าให้คะแนนผู้ถูกประเมิน (Evaluator) -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

// ============= STATE =============
const evaluateeId = computed(() => route.params.id)
const periodId = computed(() => route.query.period)
const evaluatee = ref(null)
const topics = ref([])
const results = ref({}) // { indicator_id: { self_score, evaluator_score } }
const comments = ref({
  general: '',
  strength: '',
  improvement: ''
})
const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchEvaluatee() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/users/${evaluateeId.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    evaluatee.value = res.data
  } catch (e) {
    console.error('Load evaluatee failed:', e)
  }
}

async function fetchData() {
  loading.value = true
  errorMsg.value = ''
  try {
    // ดึง topics + indicators
    const topicsRes = await $fetch(`${config.public.apiBase}/api/topics/active`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    const indicatorsRes = await $fetch(`${config.public.apiBase}/api/attachments/indicators`, {
      params: { period_id: periodId.value },
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    // จัดกลุ่ม
    const topicsData = topicsRes.items || []
    const indicatorsData = indicatorsRes || []
    
    topics.value = topicsData.map(topic => ({
      ...topic,
      indicators: indicatorsData.filter(ind => ind.topic_id === topic.id)
    })).filter(topic => topic.indicators.length > 0)

    // ดึงผลประเมิน
    await fetchResults()
    await fetchComments()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function fetchResults() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/results/evaluatee/${evaluateeId.value}/${periodId.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    const items = res.items || []
    results.value = items.reduce((acc, item) => {
      acc[item.indicator_id] = {
        self_score: item.self_score || 0,
        evaluator_score: item.evaluator_score || 0
      }
      return acc
    }, {})
  } catch (e) {
    console.error('Load results failed:', e)
  }
}

async function fetchComments() {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/comments/evaluatee/${evaluateeId.value}/period/${periodId.value}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    
    const items = res.items || []
    items.forEach(item => {
      if (item.evaluator_id === auth.user.id) {
        comments.value[item.comment_type] = item.comment_text
      }
    })
  } catch (e) {
    console.error('Load comments failed:', e)
  }
}

function getEvaluatorScore(indicatorId) {
  return results.value[indicatorId]?.evaluator_score || 0
}

function setEvaluatorScore(indicatorId, score) {
  if (!results.value[indicatorId]) {
    results.value[indicatorId] = { self_score: 0, evaluator_score: 0 }
  }
  results.value[indicatorId].evaluator_score = score
}

async function saveEvaluation() {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true

  try {
    // บันทึกคะแนน
    const scoreItems = Object.entries(results.value).map(([indicator_id, data]) => ({
      indicator_id: Number(indicator_id),
      period_id: Number(periodId.value),
      evaluatee_id: Number(evaluateeId.value),
      score: data.evaluator_score || 0
    }))

    await $fetch(`${config.public.apiBase}/api/results/evaluate/bulk`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: { items: scoreItems }
    })

    // บันทึกความคิดเห็น
    const commentPromises = Object.entries(comments.value)
      .filter(([, text]) => text.trim())
      .map(([type, text]) => 
        $fetch(`${config.public.apiBase}/api/comments`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          },
          body: {
            period_id: Number(periodId.value),
            evaluatee_id: Number(evaluateeId.value),
            evaluator_id: auth.user.id,
            comment_type: type,
            comment_text: text
          }
        })
      )

    await Promise.all(commentPromises)

    successMsg.value = 'บันทึกการประเมินสำเร็จ'
    setTimeout(() => router.push('/evaluator/tasks'), 1500)
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

// ============= LIFECYCLE =============
onMounted(() => {
  if (!periodId.value) {
    errorMsg.value = 'ไม่พบรอบการประเมิน'
    return
  }
  fetchEvaluatee()
  fetchData()
})
</script>

<template>
  <div class="pa-4">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left color="primary">mdi-account-star</v-icon>
        <span class="text-h5 ml-2">ประเมินผู้ถูกประเมิน</span>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Evaluatee Info -->
        <v-card v-if="evaluatee" class="mb-4" color="primary" variant="tonal">
          <v-card-text class="d-flex align-center">
            <v-avatar size="64" color="primary" class="mr-4">
              <span class="text-h5 text-white">{{ evaluatee.name_th?.charAt(0) || 'E' }}</span>
            </v-avatar>
            <div>
              <div class="text-h6">{{ evaluatee.name_th }}</div>
              <div class="text-subtitle-2">{{ evaluatee.email }}</div>
            </div>
          </v-card-text>
        </v-card>

        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <!-- Loading -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Indicators by Topic -->
        <v-expansion-panels v-else class="mb-4">
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

                  <!-- คะแนนตนเอง -->
                  <div class="mb-3">
                    <v-chip color="info" size="small" class="mr-2">
                      คะแนนตนเอง: {{ results[indicator.id]?.self_score || 0 }}
                    </v-chip>
                  </div>

                  <!-- คะแนนกรรมการ -->
                  <div class="d-flex align-center">
                    <span class="mr-4">คะแนนกรรมการ:</span>
                    <v-slider
                      :model-value="getEvaluatorScore(indicator.id)"
                      @update:model-value="setEvaluatorScore(indicator.id, $event)"
                      :min="0"
                      :max="indicator.type === 'yes_no' ? 1 : 10"
                      :step="1"
                      thumb-label
                      :color="getEvaluatorScore(indicator.id) > 0 ? 'success' : 'grey'"
                      class="flex-grow-1"
                    />
                    <v-chip class="ml-4" color="success">
                      {{ getEvaluatorScore(indicator.id) }}
                    </v-chip>
                  </div>

                  <v-divider class="mt-4" />
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- ความคิดเห็น -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon left>mdi-comment-text</v-icon>
            ความคิดเห็นของกรรมการ
          </v-card-title>
          <v-card-text>
            <v-textarea
              v-model="comments.general"
              label="ความคิดเห็นทั่วไป"
              rows="3"
              variant="outlined"
              class="mb-3"
            />
            <v-textarea
              v-model="comments.strength"
              label="จุดแข็ง"
              rows="3"
              variant="outlined"
              class="mb-3"
            />
            <v-textarea
              v-model="comments.improvement"
              label="ข้อเสนอแนะในการพัฒนา"
              rows="3"
              variant="outlined"
            />
          </v-card-text>
        </v-card>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-btn color="grey" variant="outlined" @click="router.push('/evaluator/tasks')">
          <v-icon left>mdi-arrow-left</v-icon>
          ย้อนกลับ
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          @click="saveEvaluation"
          :loading="saving"
          :disabled="topics.length === 0"
        >
          <v-icon left>mdi-content-save</v-icon>
          บันทึกการประเมิน
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>