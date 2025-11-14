<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">ประเมินตนเอง</h1>

    <v-row v-if="topics.length > 0">
      <v-col cols="12" md="8">
        <v-expansion-panels v-model="panel">
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <h3>{{ topic.topic_name }} ({{ topic.weight_percentage }}%)</h3>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-6">
                <h4>{{ indicator.indicator_name }} ({{ indicator.weight_score }} คะแนน)</h4>

                <v-radio-group
                  v-model="evaluationData[indicator.id]"
                  @update:model-value="calculateScores"
                >
                  <v-radio
                    v-for="option in getOptions(indicator.evaluation_type)"
                    :key="option.value"
                    :label="option.text"
                    :value="option.value"
                  ></v-radio>
                </v-radio-group>

                <v-textarea
                  v-model="comments[indicator.id]"
                  label="ความคิดเห็น (ถ้ามี)"
                  rows="2"
                  variant="outlined"
                  density="compact"
                ></v-textarea>
                <v-divider class="my-4"></v-divider>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-card class="mt-4">
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" @click="saveDraft" :loading="saving">บันทึกร่าง</v-btn>
            <v-btn color="primary" @click="submitEvaluation" :loading="submitting">ส่งการประเมิน</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <score-display :total-score="totalScore" :topic-scores="topicScores"></score-display>
      </v-col>
    </v-row>
    <v-alert v-else type="info">ไม่มีหัวข้อการประเมิน</v-alert>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ScoreDisplay from '@/components/common/ScoreDisplay.vue';
import topicService from '@/services/topicService';
import indicatorService from '@/services/indicatorService';
import resultService from '@/services/resultService';
import periodService from '@/services/periodService';
import { useNotificationStore } from '@/stores/notification';
import { EVALUATION_TYPES } from '@/utils/constants';

const notificationStore = useNotificationStore();
const panel = ref(0);
const topics = ref([]);
const evaluationData = ref({});
const comments = ref({});
const saving = ref(false);
const submitting = ref(false);
const currentPeriod = ref(null);

const topicScores = computed(() => {
  return topics.value.map(topic => ({
    topic_name: topic.topic_name,
    weight_percentage: topic.weight_percentage,
    topic_score: calculateTopicScore(topic)
  }));
});

const totalScore = computed(() => {
  return topicScores.value.reduce((sum, t) => sum + t.topic_score, 0);
});

const getOptions = (evaluationType) => {
  return EVALUATION_TYPES[evaluationType]?.options || [];
};

const calculateTopicScore = (topic) => {
  let score = 0;
  topic.indicators.forEach(ind => {
    const selectedValue = evaluationData.value[ind.id] || 0;
    score += selectedValue * ind.weight_score;
  });
  return (score * topic.weight_percentage) / 100;
};

const calculateScores = () => {
  // Triggers reactive update
};

const loadData = async () => {
  try {
    const periodRes = await periodService.getActive();
    if (periodRes.data.data.length > 0) {
      currentPeriod.value = periodRes.data.data[0];

      const topicsRes = await topicService.getActive();
      const topicsData = topicsRes.data.data;

      for (const topic of topicsData) {
        const indicatorsRes = await indicatorService.getByTopic(topic.id);
        topic.indicators = indicatorsRes.data.data;
      }

      topics.value = topicsData;
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  }
};

const saveDraft = async () => {
  saving.value = true;
  try {
    const data = Object.entries(evaluationData.value).map(([indicatorId, value]) => ({
      indicator_id: parseInt(indicatorId),
      self_selected_option_id: value,
      self_comment: comments.value[indicatorId] || ''
    }));

    await resultService.saveSelfBulk({ period_id: currentPeriod.value.id, results: data });
    notificationStore.success('บันทึกร่างสำเร็จ');
  } catch (error) {
    notificationStore.error('ไม่สามารถบันทึกได้');
  } finally {
    saving.value = false;
  }
};

const submitEvaluation = async () => {
  if (confirm('ต้องการส่งการประเมินหรือไม่? หลังจากส่งแล้วจะไม่สามารถแก้ไขได้')) {
    submitting.value = true;
    try {
      await saveDraft();
      notificationStore.success('ส่งการประเมินสำเร็จ');
    } catch (error) {
      notificationStore.error('ไม่สามารถส่งได้');
    } finally {
      submitting.value = false;
    }
  }
};

onMounted(() => {
  loadData();
});
</script>
