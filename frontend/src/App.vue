<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <!-- Global Notification -->
    <base-alert
      v-model="notificationStore.show"
      :message="notificationStore.message"
      :type="notificationStore.type"
      :timeout="notificationStore.timeout"
    />
  </v-app>
</template>

<script setup>
import { useNotificationStore } from '@/stores/notification';
import BaseAlert from '@/components/base/BaseAlert.vue';

const notificationStore = useNotificationStore();
</script>
