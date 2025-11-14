<template>
  <v-container fluid>
    <v-btn color="grey" variant="text" @click="$router.back()" class="mb-4">
      <v-icon icon="mdi-arrow-left" start></v-icon>กลับ
    </v-btn>
    <h1 class="text-h4 mb-4">ประเมินผลงาน</h1>

    <base-card v-if="evaluatee" :title="evaluatee.name" icon="mdi-account" class="mb-4">
      <v-row>
        <v-col cols="12" md="4"><strong>แผนก:</strong> {{ evaluatee.department || '-' }}</v-col>
        <v-col cols="12" md="4"><strong>ตำแหน่ง:</strong> {{ evaluatee.position || '-' }}</v-col>
        <v-col cols="12" md="4"><strong>รอบการประเมิน:</strong> {{ period?.name || '-' }}</v-col>
      </v-row>
    </base-card>

    <v-row v-if="!loading">
      <v-col cols="12" md="8">
        <v-card v-for="topic in topics" :key="topic.id" class="mb-4">
          <v-card-title class="bg-primary">{{ topic.topic_name }} ({{ topic.weight_percentage }}%)</v-card-title>
          <v-card-text>
            <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-4 pa-3 border rounded">
              <div class="d-flex justify-space-between mb-2">
                <strong>{{ indicator.indicator_name }}</strong>
                <v-chip size="small" color="primary">{{ indicator.weight_score }}%</v-chip>
              </div>
              <v-alert variant="tonal" density="compact" class="mb-3">
                <div class="text-caption"><strong>ประเมินตนเอง:</strong> {{ indicator.self_selected_value || '-' }} | คะแนน: {{ (indicator.self_score || 0).toFixed(2) }}</div>
                <div v-if="indicator.self_comment" class="text-body-2"><strong>ความเห็น:</strong> {{ indicator.self_comment }}</div>
              </v-alert>
              <div class="text-caption text-grey mb-2">{{ getEvaluationTypeText(indicator.evaluation_type) }}</div>
              <v-radio-group v-model="indicator.evaluator_selected_value" :inline="true" density="compact" @update:modelValue="updateScore(indicator)">
                <v-radio v-for="option in getOptions(indicator.evaluation_type)" :key="option.value" :label="option.label" :value="option.value"></v-radio>
              </v-radio-group>
              <v-textarea v-model="indicator.evaluator_comment" label="ความเห็นกรรมการ" variant="outlined" density="compact" rows="2" class="mt-2"></v-textarea>
              <div class="text-end">
                <span class="text-grey">คะแนนตนเอง: {{ (indicator.self_score || 0).toFixed(2) }}</span> |
                <span class="text-primary font-weight-bold">คะแนนกรรมการ: {{ (indicator.evaluator_score || 0).toFixed(2) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <base-card title="หลักฐานที่อัปโหลด" icon="mdi-file-document" class="mb-4">
          <v-list v-if="evidences.length > 0">
            <v-list-item v-for="evidence in evidences" :key="evidence.id">
              <v-list-item-title>{{ evidence.file_name }}</v-list-item-title>
              <template v-slot:append>
                <v-btn :href="evidence.file_url" target="_blank" size="small" color="primary" variant="text">
                  <v-icon icon="mdi-download"></v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">ไม่มีหลักฐานที่อัปโหลด</v-alert>
        </base-card>
      </v-col>

      <v-col cols="12" md="4">
        <div class="sticky-top">
          <score-display :total-score="totalScore" :max-score="100" :topic-scores="topicScores"></score-display>
          <v-card class="mt-4">
            <v-card-text>
              <v-btn block color="success" :loading="saving" @click="saveEvaluation" :disabled="!canSave">
                <v-icon icon="mdi-content-save" start></v-icon>บันทึกการประเมิน
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <loading-overlay v-model="loading" message="กำลังโหลดข้อมูล..." />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/notification';
import evaluationService from '@/services/evaluationService';
import uploadService from '@/services/uploadService';
import ScoreDisplay from '@/components/common/ScoreDisplay.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import LoadingOverlay from '@/components/base/LoadingOverlay.vue';
import { calculateScore, calculateTopicScore } from '@/utils/helpers';

const route = useRoute();
const notificationStore = useNotificationStore();
const evaluateeId = computed(() => route.params.evaluateeId);
const periodId = computed(() => route.params.periodId);
const loading = ref(false);
const saving = ref(false);
const evaluatee = ref(null);
const period = ref(null);
const topics = ref([]);
const evidences = ref([]);

const evaluationTypes = [
  { text: 'แบบ 2 ทาง (ได้/ไม่ได้)', value: 'binary' },
  { text: 'แบบมาตราส่วน 1-4', value: 'scale_1_4' },
  { text: 'แบบกำหนดเอง', value: 'custom' }
];

const getEvaluationTypeText = (type) => evaluationTypes.find(t => t.value === type)?.text || type;
const getOptions = (type) => {
  if (type === 'binary') return [{ label: 'ไม่ได้', value: 0 }, { label: 'ได้', value: 1 }];
  if (type === 'scale_1_4') return [{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }];
  return [{ label: '0', value: 0 }, { label: '1', value: 1 }];
};

const updateScore = (indicator) => {
  indicator.evaluator_score = calculateScore(indicator.evaluator_selected_value || 0, indicator.weight_score);
};

const topicScores = computed(() => topics.value.map(topic => ({
  topic_name: topic.topic_name,
  weight_percentage: topic.weight_percentage,
  topic_score: calculateTopicScore(topic.indicators?.map(ind => ({ selected_value: ind.evaluator_selected_value || 0, weight_score: ind.weight_score })) || [], topic.weight_percentage)
})));

const totalScore = computed(() => topics.value.reduce((sum, topic) =>
  sum + calculateTopicScore(topic.indicators?.map(ind => ({ selected_value: ind.evaluator_selected_value || 0, weight_score: ind.weight_score })) || [], topic.weight_percentage), 0
));

const canSave = computed(() => topics.value.every(topic => topic.indicators?.every(ind => ind.evaluator_selected_value !== undefined && ind.evaluator_selected_value !== null) ?? false));

const fetchData = async () => {
  loading.value = true;
  try {
    const [evalRes, evidenceRes] = await Promise.all([
      evaluationService.getByEvaluatee(evaluateeId.value, periodId.value),
      uploadService.getForEvaluator(evaluateeId.value)
    ]);

    const results = evalRes.data.data || [];
    if (results.length === 0) {
      notificationStore.error('ไม่พบข้อมูลการประเมิน');
      return;
    }

    evaluatee.value = results[0].evaluatee;
    period.value = results[0].period;

    const topicMap = new Map();
    results.forEach(result => {
      const topicId = result.indicator?.topic_id;
      const topicName = result.indicator?.topic?.topic_name;
      const topicWeight = result.indicator?.topic?.weight_percentage;

      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, { id: topicId, topic_name: topicName, weight_percentage: topicWeight, indicators: [] });
      }

      topicMap.get(topicId).indicators.push({
        id: result.indicator_id,
        indicator_name: result.indicator?.indicator_name,
        evaluation_type: result.indicator?.evaluation_type,
        weight_score: result.indicator?.weight_score,
        self_selected_value: result.self_selected_value,
        self_score: result.self_score,
        self_comment: result.self_comment,
        evaluator_selected_value: result.evaluator_selected_value,
        evaluator_score: result.evaluator_score || 0,
        evaluator_comment: result.evaluator_comment || ''
      });
    });

    topics.value = Array.from(topicMap.values());
    evidences.value = evidenceRes.data.data || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

const saveEvaluation = async () => {
  saving.value = true;
  try {
    const data = { period_id: periodId.value, evaluatee_id: evaluateeId.value, results: [] };
    topics.value.forEach(topic => {
      topic.indicators.forEach(indicator => {
        data.results.push({
          indicator_id: indicator.id,
          evaluator_selected_value: indicator.evaluator_selected_value,
          evaluator_comment: indicator.evaluator_comment,
          evaluator_score: calculateScore(indicator.evaluator_selected_value, indicator.weight_score)
        });
      });
    });
    await evaluationService.evaluateBulk(data);
    notificationStore.success('บันทึกการประเมินสำเร็จ');
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
.border { border: 1px solid #e0e0e0; }
</style>
