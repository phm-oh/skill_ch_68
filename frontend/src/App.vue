<template>
  <v-app>
    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Global Notification -->
    <base-alert
      v-if="notificationStore"
      v-model="notificationStore.show"
      :message="notificationStore.message"
      :type="notificationStore.type"
      :timeout="notificationStore.timeout"
    />
  </v-app>
</template>

<script setup>
import { onErrorCaptured } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import BaseAlert from '@/components/base/BaseAlert.vue';

const notificationStore = useNotificationStore();

// ✅ Error boundary to catch errors
onErrorCaptured((err, instance, info) => {
  console.error('[App] Error captured:', err, info);
  return false; // propagate error
});

console.log('[App] App.vue mounted');
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
