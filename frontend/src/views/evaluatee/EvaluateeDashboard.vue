<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">แดชบอร์ดผู้รับการประเมิน</h1>

    <v-row>
      <v-col cols="12" md="8">
        <base-card title="รอบการประเมินปัจจุบัน" icon="mdi-calendar-clock">
          <div v-if="activePeriod">
            <h3>{{ activePeriod.period_name }}</h3>
            <p class="text-grey mb-4">
              {{ formatDate(activePeriod.start_date) }} - {{ formatDate(activePeriod.end_date) }}
            </p>

            <v-progress-linear
              :model-value="progress"
              color="primary"
              height="25"
              class="mb-4"
            >
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}% เสร็จสิ้น</strong>
              </template>
            </v-progress-linear>

            <div class="d-flex justify-space-between mb-4">
              <div><strong>สถานะ:</strong> <status-chip :status="evaluationStatus"></status-chip></div>
              <div><strong>วันที่เหลือ:</strong> {{ daysRemaining }} วัน</div>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex gap-2">
              <v-btn color="primary" to="/evaluatee/evaluation">ไปประเมินตนเอง</v-btn>
              <v-btn color="secondary" to="/evaluatee/evidence">จัดการหลักฐาน</v-btn>
              <v-btn variant="outlined" to="/evaluatee/report">ดูรายงาน</v-btn>
            </div>
          </div>
          <v-alert v-else type="info" variant="tonal">ไม่มีรอบการประเมินที่เปิดอยู่</v-alert>
        </base-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" color="primary" class="text-white">
          <v-card-text>
            <div class="text-h3 font-weight-bold">{{ completedCount }}/{{ totalCount }}</div>
            <div class="text-subtitle-1">ตัวชี้วัดที่ประเมินแล้ว</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import StatusChip from '@/components/common/StatusChip.vue';
import periodService from '@/services/periodService';
import resultService from '@/services/resultService';
import { formatDate, getDaysRemaining, getProgressPercentage } from '@/utils/helpers';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const activePeriod = ref(null);
const evaluationStatus = ref('draft');
const completedCount = ref(0);
const totalCount = ref(0);

const progress = computed(() => getProgressPercentage(completedCount.value, totalCount.value));
const daysRemaining = computed(() => activePeriod.value ? getDaysRemaining(activePeriod.value.end_date) : 0);

const loadData = async () => {
  try {
    const periodResponse = await periodService.getActive();
    if (periodResponse.data.data.length > 0) {
      activePeriod.value = periodResponse.data.data[0];

      const resultResponse = await resultService.getMyResults(activePeriod.value.id);
      const results = resultResponse.data.data || [];

      totalCount.value = results.length;
      completedCount.value = results.filter(r => r.self_selected_option_id).length;
      evaluationStatus.value = results.some(r => r.submitted_at) ? 'submitted' : 'draft';
    }
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลได้');
  }
};

onMounted(() => {
  loadData();
});
</script>
