<template>
  <v-container fluid>
    <v-btn variant="text" color="primary" to="/evaluatee" class="mb-2">
      <v-icon icon="mdi-arrow-left" start></v-icon>กลับหน้าหลัก
    </v-btn>
    <h1 class="text-h4 mb-4">ประเมินตนเอง</h1>

    <v-alert v-if="availablePeriods.length === 0 && !loading" type="info" variant="tonal">
      ไม่มีรอบการประเมินที่ได้รับมอบหมาย
    </v-alert>

    <template v-else-if="availablePeriods.length > 0">
      <v-card class="mb-4">
        <v-card-text>
          <v-select
            v-model="selectedPeriodId"
            :items="availablePeriods"
            item-title="name_th"
            item-value="id"
            label="เลือกรอบการประเมิน"
            variant="outlined"
            density="comfortable"
            @update:modelValue="onPeriodChange"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:subtitle>
                  {{ formatDate(item.raw.start_date) }} - {{ formatDate(item.raw.end_date) }}
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
      </v-card>
      <v-row v-if="!loading && selectedPeriodId">
        <v-col cols="12" md="8">
          <v-alert v-if="topics.length === 0" type="warning" variant="tonal" class="mb-4">
            ไม่มีหัวข้อการประเมินในรอบนี้
          </v-alert>
          <v-card v-for="topic in topics" :key="topic.id" class="mb-4">
            <v-card-title class="bg-primary">{{ topic.title_th }} ({{ topic.weight }}%)</v-card-title>
            <v-card-text>
              <div v-if="!topic.indicators || topic.indicators.length === 0" class="pa-4 text-center text-grey">
                ไม่มีตัวชี้วัดในหัวข้อนี้
              </div>
              <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4 pa-3 border rounded">
                <div class="d-flex justify-space-between mb-2">
                  <strong>{{ indicator.name_th }}</strong>
                  <v-chip size="small" color="primary">{{ indicator.weight }}%</v-chip>
                </div>
                <div class="text-caption text-grey mb-3">{{ getEvaluationTypeText(indicator.type) }}</div>
                <v-radio-group v-model="indicator.selected_value" :inline="true" density="compact" @update:modelValue="updateScore(indicator)">
                  <v-radio v-for="option in getOptions(indicator.type)" :key="option.value" :label="option.label" :value="option.value"></v-radio>
                </v-radio-group>
                <v-textarea v-model="indicator.comment" label="ความเห็น" variant="outlined" density="compact" rows="2" class="mt-2"></v-textarea>
                <div class="text-end text-primary font-weight-bold">
                  คะแนน: {{ calculateScore(indicator.selected_value || 0, indicator.weight).toFixed(2) }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <div class="sticky-top">
            <score-display :total-score="totalScore" :max-score="100" :topic-scores="topicScores"></score-display>
            <v-card class="mt-4">
              <v-card-text>
                <v-btn block color="grey" variant="outlined" class="mb-2" :loading="saving" @click="saveResults(false)">
                  <v-icon icon="mdi-content-save" start></v-icon>บันทึกร่าง
                </v-btn>
                <v-btn block color="success" :loading="saving" @click="submitDialog = true">
                  <v-icon icon="mdi-send" start></v-icon>ส่งการประเมิน
                </v-btn>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
      <loading-overlay :loading="loading"></loading-overlay>
    </template>
    <base-dialog v-model="submitDialog" title="ยืนยันการส่งประเมิน" icon="mdi-alert" confirm-text="ส่งการประเมิน" confirm-color="success" @confirm="handleSubmit" @cancel="submitDialog = false">
      <v-alert type="warning" variant="tonal" class="mb-4">คุณต้องการส่งการประเมินตนเองหรือไม่?</v-alert>
      <p class="text-body-2">เมื่อส่งแล้วจะไม่สามารถแก้ไขได้อีก</p>
      <p class="text-body-2 font-weight-bold">คะแนนรวม: {{ totalScore.toFixed(2) }} / 100</p>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import assignmentService from '@/services/assignmentService';
import topicService from '@/services/topicService';
import evaluationService from '@/services/evaluationService';
import ScoreDisplay from '@/components/common/ScoreDisplay.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import { formatDate, calculateScore, calculateTopicScore, calculateTotalScore } from '@/utils/helpers';

const notificationStore = useNotificationStore();
const availablePeriods = ref([]);
const selectedPeriodId = ref(null);
const topics = ref([]);
const loading = ref(false);
const saving = ref(false);
const submitDialog = ref(false);

const evaluationTypes = [
  { text: 'แบบ ใช่/ไม่ใช่', value: 'yes_no' },
  { text: 'แบบมาตราส่วน 1-4', value: 'score_1_4' },
  { text: 'แบบ URL ไฟล์', value: 'file_url' }
];

const getEvaluationTypeText = (type) => evaluationTypes.find(t => t.value === type)?.text || type;

const getOptions = (type) => {
  if (type === 'yes_no') return [{ label: 'ไม่ใช่', value: 0 }, { label: 'ใช่', value: 1 }];
  if (type === 'score_1_4') return [
    { label: '1', value: 1 }, { label: '2', value: 2 },
    { label: '3', value: 3 }, { label: '4', value: 4 }
  ];
  if (type === 'file_url') return [{ label: 'ไม่มี', value: 0 }, { label: 'มี', value: 1 }];
  return [{ label: '0', value: 0 }, { label: '1', value: 1 }];
};

const updateScore = (indicator) => {
  indicator.calculated_score = calculateScore(indicator.selected_value, indicator.weight);
};

const topicScores = computed(() => topics.value.map(topic => ({
  topic_name: topic.title_th,
  weight_percentage: topic.weight,
  topic_score: calculateTopicScore(topic.indicators || [], topic.weight)
})));

const totalScore = computed(() => calculateTotalScore(topics.value));

const fetchData = async () => {
  loading.value = true;
  try {
    // ดึง assignments ของ evaluatee (รวม period info)
    const assignmentsRes = await assignmentService.getMine();
    const assignments = assignmentsRes.data.items || assignmentsRes.data.data || [];

    // แปลง assignments เป็น periods (distinct by period_id)
    const periodMap = new Map();
    for (const assignment of assignments) {
      if (!periodMap.has(assignment.period_id)) {
        periodMap.set(assignment.period_id, {
          id: assignment.period_id,
          name_th: assignment.period_name,
          name: assignment.period_name,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          is_active: assignment.is_active
        });
      }
    }

    availablePeriods.value = Array.from(periodMap.values());

    // เลือกรอบแรกอัตโนมัติถ้ามี
    if (availablePeriods.value.length > 0) {
      selectedPeriodId.value = availablePeriods.value[0].id;
      await loadPeriodData(selectedPeriodId.value);
    }
  } catch (error) {
    console.error('[SelfEvaluation] Error loading data:', error);
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const onPeriodChange = async (periodId) => {
  if (!periodId) return;
  loading.value = true;
  try {
    await loadPeriodData(periodId);
  } catch (error) {
    console.error('[SelfEvaluation] Error loading period data:', error);
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  } finally {
    loading.value = false;
  }
};

const loadPeriodData = async (periodId) => {
  // ดึง topics ตาม period_id จาก backend (ผ่าน period_topics table)
  const topicsRes = await topicService.getAll(periodId);
  const periodTopics = topicsRes.data.items || topicsRes.data.data || [];

  // ดึง indicators สำหรับแต่ละ topic
  for (const topic of periodTopics) {
    const indicatorsRes = await topicService.getIndicatorsByTopic(topic.id);
    const indicators = indicatorsRes.data.items || indicatorsRes.data.data || [];
    topic.indicators = indicators.map(ind => ({
      ...ind, selected_value: 0, comment: '', calculated_score: 0
    }));
  }

  topics.value = periodTopics;
  await loadSavedResults(periodId);
};

const loadSavedResults = async (periodId) => {
  try {
    const res = await evaluationService.getMyResults(periodId);
    const savedResults = res.data.items || res.data.data || [];
    topics.value.forEach(topic => {
      topic.indicators.forEach(indicator => {
        const saved = savedResults.find(r => r.indicator_id === indicator.id);
        if (saved) {
          indicator.selected_value = saved.self_selected_value || 0;
          indicator.comment = saved.self_comment || '';
          indicator.calculated_score = saved.self_score || 0;
        }
      });
    });
  } catch (error) {
    console.log('No saved results');
  }
};

const handleSubmit = async () => {
  await saveResults(true);
  submitDialog.value = false;
};

const saveResults = async (isSubmit) => {
  if (!selectedPeriodId.value) {
    notificationStore.error('กรุณาเลือกรอบการประเมิน');
    return;
  }

  saving.value = true;
  try {
    const data = {
      period_id: selectedPeriodId.value,
      is_submitted: isSubmit,
      results: []
    };
    topics.value.forEach(topic => {
      topic.indicators.forEach(indicator => {
        data.results.push({
          indicator_id: indicator.id,
          self_selected_value: indicator.selected_value,
          self_comment: indicator.comment,
          self_score: calculateScore(indicator.selected_value, indicator.weight)
        });
      });
    });
    await evaluationService.saveSelfBulk(data);
    notificationStore.success(isSubmit ? 'ส่งการประเมินสำเร็จ' : 'บันทึกร่างสำเร็จ');
  } catch (error) {
    notificationStore.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.sticky-top { position: sticky; top: 20px; }
</style>
