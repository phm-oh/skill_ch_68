<template>
  <v-container fluid class="fill-height bg-grey-lighten-4">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="12" rounded="lg">
          <v-card-title class="text-h4 text-center bg-primary pa-6">
            <v-icon icon="mdi-account-circle" size="48" class="mb-2"></v-icon>
            <div>ระบบประเมินบุคลากร</div>
          </v-card-title>

          <v-card-text class="pa-8">
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <v-text-field
                v-model="credentials.email"
                label="อีเมล"
                prepend-inner-icon="mdi-email"
                type="email"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="credentials.password"
                label="รหัสผ่าน"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required]"
                variant="outlined"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mt-4"
              >
                <v-icon icon="mdi-login" start></v-icon>
                เข้าสู่ระบบ
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text class="text-center text-caption text-grey">
            <v-icon icon="mdi-shield-lock" size="16"></v-icon>
            ระบบรักษาความปลอดภัยของข้อมูล
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const loginForm = ref(null);
const credentials = ref({
  email: '',
  password: ''
});
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const rules = {
  required: value => !!value || 'กรุณากรอกข้อมูล'
};

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const user = await authStore.login(credentials.value);
    notificationStore.success(`ยินดีต้อนรับ ${user.name}`);

    // Redirect based on role
    router.push(`/${user.role}`);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ';
  } finally {
    loading.value = false;
  }
};
</script>
