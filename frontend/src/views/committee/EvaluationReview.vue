<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">ตรวจสอบและประเมิน</h1>

    <v-row v-if="evaluateeInfo">
      <v-col cols="12">
        <v-card>
          <v-card-title class="bg-primary">ข้อมูลผู้รับการประเมิน</v-card-title>
          <v-card-text class="pt-4">
            <v-row>
              <v-col cols="12" md="4">
                <strong>ชื่อ-สกุล:</strong> {{ evaluateeInfo.full_name }}
              </v-col>
              <v-col cols="12" md="4">
                <strong>แผนก:</strong> {{ evaluateeInfo.department }}
              </v-col>
              <v-col cols="12" md="4">
                <strong>ตำแหน่ง:</strong> {{ evaluateeInfo.position }}
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-expansion-panels v-model="panel">
          <v-expansion-panel v-for="topic in topics" :key="topic.id">
            <v-expansion-panel-title>
              <h3>{{ topic.topic_name }} ({{ topic.weight_percentage }}%)</h3>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-for="indicator in topic.indicators" :key="indicator.id" class="mb-6">
                <h4>{{ indicator.indicator_name }} ({{ indicator.weight_score }} คะแนน)</h4>

                <div class="bg-grey-lighten-4 pa-3 mb-3 rounded">
                  <strong>การประเมินตนเอง:</strong>
                  <p>คะแนน: {{ indicator.self_score || '-' }}</p>
                  <p>ความเห็น: {{ indicator.self_comment || '-' }}</p>
                </div>

                <v-radio-group
                  v-model="evaluationData[indicator.id]"
                  @update:model-value="calculateScores"
                  label="ประเมินโดยกรรมการ"
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
                  label="ความคิดเห็นจากกรรมการ"
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
            <v-btn color="grey" @click="$router.back()">ย้อนกลับ</v-btn>
            <v-btn color="primary" @click="saveEvaluation" :loading="saving">บันทึกการประเมิน</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <score-display :total-score="totalScore" :topic-scores="topicScores"></score-display>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ScoreDisplay from '@/components/common/ScoreDisplay.vue';
import resultService from '@/services/resultService';
import topicService from '@/services/topicService';
import indicatorService from '@/services/indicatorService';
import userService from '@/services/userService';
import { useNotificationStore } from '@/stores/notification';
import { EVALUATION_TYPES } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const panel = ref(0);
const topics = ref([]);
const evaluateeInfo = ref(null);
const evaluationData = ref({});
const comments = ref({});
const saving = ref(false);

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
    const { evaluateeId, periodId } = route.params;

    // Load evaluatee info
    const userRes = await userService.getById(evaluateeId);
    evaluateeInfo.value = userRes.data.data;

    // Load evaluation results
    const resultsRes = await resultService.getByEvaluatee(evaluateeId, periodId);
    const results = resultsRes.data.data;

    // Load topics and indicators
    const topicsRes = await topicService.getActive();
    const topicsData = topicsRes.data.data;

    for (const topic of topicsData) {
      const indicatorsRes = await indicatorService.getByTopic(topic.id);
      topic.indicators = indicatorsRes.data.data;

      // Populate self evaluation data
      topic.indicators.forEach(ind => {
        const result = results.find(r => r.indicator_id === ind.id);
        if (result) {
          ind.self_score = result.self_score;
          ind.self_comment = result.self_comment;
          evaluationData.value[ind.id] = result.evaluator_selected_option_id || 0;
          comments.value[ind.id] = result.evaluator_comment || '';
        }
      });
    }

    topics.value = topicsData;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  }
};

const saveEvaluation = async () => {
  saving.value = true;
  try {
    const { evaluateeId, periodId } = route.params;

    const data = Object.entries(evaluationData.value).map(([indicatorId, value]) => ({
      indicator_id: parseInt(indicatorId),
      evaluatee_id: parseInt(evaluateeId),
      period_id: parseInt(periodId),
      evaluator_selected_option_id: value,
      evaluator_comment: comments.value[indicatorId] || ''
    }));

    await resultService.evaluateBulk({ results: data });
    notificationStore.success('บันทึกการประเมินสำเร็จ');
    router.push('/evaluator/assignments');
  } catch (error) {
    notificationStore.error('ไม่สามารถบันทึกได้');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>
