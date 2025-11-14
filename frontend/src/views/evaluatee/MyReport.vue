<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">รายงานของฉัน</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedPeriodId"
          :items="periods"
          item-title="period_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          @update:model-value="loadReport"
        ></v-select>
      </v-col>
      <v-col cols="12" md="8" class="text-right">
        <v-btn color="primary" @click="exportPDF" v-if="selectedPeriodId">
          <v-icon icon="mdi-download" start></v-icon>
          Export PDF
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="selectedPeriodId && reportData">
      <v-col cols="12" md="6">
        <score-display
          :total-score="reportData.total_score || 0"
          :topic-scores="reportData.topic_scores || []"
        ></score-display>
      </v-col>

      <v-col cols="12" md="6">
        <base-card title="สรุปผลการประเมิน" icon="mdi-chart-box">
          <v-list>
            <v-list-item>
              <v-list-item-title>สถานะ</v-list-item-title>
              <template #append>
                <status-chip :status="reportData.status"></status-chip>
              </template>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>คะแนนจากตนเอง</v-list-item-title>
              <template #append>
                <strong>{{ reportData.self_score || 0 }}</strong>
              </template>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>คะแนนจากกรรมการ</v-list-item-title>
              <template #append>
                <strong>{{ reportData.evaluator_score || 0 }}</strong>
              </template>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>คะแนนรวม</v-list-item-title>
              <template #append>
                <strong class="text-primary text-h6">{{ reportData.total_score || 0 }}</strong>
              </template>
            </v-list-item>
          </v-list>
        </base-card>
      </v-col>
    </v-row>

    <v-row v-if="selectedPeriodId && reportData">
      <v-col cols="12">
        <base-card title="รายละเอียดตามหัวข้อ" icon="mdi-format-list-checks">
          <v-expansion-panels>
            <v-expansion-panel v-for="topic in reportData.topics" :key="topic.topic_id">
              <v-expansion-panel-title>
                <h4>{{ topic.topic_name }} - {{ topic.topic_score }} คะแนน</h4>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-for="indicator in topic.indicators" :key="indicator.indicator_id" class="mb-4">
                  <h5>{{ indicator.indicator_name }}</h5>
                  <p><strong>คะแนนตนเอง:</strong> {{ indicator.self_score }}</p>
                  <p><strong>คะแนนกรรมการ:</strong> {{ indicator.evaluator_score }}</p>
                  <p><strong>ความเห็น:</strong> {{ indicator.comment || '-' }}</p>
                  <v-divider class="my-2"></v-divider>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </base-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import ScoreDisplay from '@/components/common/ScoreDisplay.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import periodService from '@/services/periodService';
import reportService from '@/services/reportService';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const periods = ref([]);
const selectedPeriodId = ref(null);
const reportData = ref(null);

const loadPeriods = async () => {
  try {
    const response = await periodService.getAll();
    periods.value = response.data.data;
    if (periods.value.length > 0 && !selectedPeriodId.value) {
      selectedPeriodId.value = periods.value[0].id;
      loadReport();
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรอบการประเมินได้');
  }
};

const loadReport = async () => {
  if (!selectedPeriodId.value) return;
  try {
    const response = await reportService.getIndividual(authStore.user.id, selectedPeriodId.value);
    reportData.value = response.data.data;
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดรายงานได้');
    reportData.value = null;
  }
};

const exportPDF = () => {
  window.print();
};

onMounted(() => {
  loadPeriods();
});
</script>
