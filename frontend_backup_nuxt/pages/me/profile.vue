<!-- frontend/pages/me/profile.vue -->
<!-- 📋 หน้าโปรไฟล์ส่วนตัว (Evaluatee) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const user = ref(null)
const loading = ref(false)
const editing = ref(false)
const form = ref({
  name: '',
  email: '',
  phone: '',
  position: ''
})
const errorMsg = ref('')
const successMsg = ref('')

// ============= METHODS =============
async function fetchProfile() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/users/${auth.user.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    user.value = res.data
    form.value = {
      name: user.value.name || '',
      email: user.value.email || '',
      phone: user.value.phone || '',
      position: user.value.position || ''
    }
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await $fetch(`${config.public.apiBase}/api/users/${auth.user.id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: form.value
    })
    successMsg.value = 'บันทึกสำเร็จ'
    editing.value = false
    await fetchProfile()
    
    // อัปเดต auth store
    auth.user.name = form.value.name
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  editing.value = false
  form.value = {
    name: user.value.name || '',
    email: user.value.email || '',
    phone: user.value.phone || '',
    position: user.value.position || ''
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="pa-4">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">My Profile</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">ข้อมูลส่วนตัว</p>
      </div>
    </div>

    <!-- Messages -->
    <v-alert v-if="errorMsg" type="error" class="mb-4" closable @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" class="mb-4" closable @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Profile Card -->
    <v-card v-if="user">
      <v-card-text>
        <v-row>
          <!-- Avatar Section -->
          <v-col cols="12" md="3" class="text-center">
            <v-avatar size="120" color="primary">
              <v-img v-if="user.avatar_url" :src="user.avatar_url" alt="Avatar" />
              <span v-else class="text-h3 text-white">
                {{ user.name?.charAt(0).toUpperCase() || '?' }}
              </span>
            </v-avatar>
            <div class="mt-4">
              <div class="text-h6">{{ user.name }}</div>
              <v-chip size="small" :color="getRoleColor(user.role)" class="mt-2">
                {{ getRoleText(user.role) }}
              </v-chip>
            </div>
          </v-col>

          <!-- Info Section -->
          <v-col cols="12" md="9">
            <div class="d-flex justify-space-between align-center mb-4">
              <h3 class="text-h6">ข้อมูลส่วนตัว</h3>
              <v-btn
                v-if="!editing"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-pencil"
                @click="editing = true"
              >
                แก้ไข
              </v-btn>
            </div>

            <v-form v-if="editing">
              <v-text-field
                v-model="form.name"
                label="ชื่อ-นามสกุล *"
                density="comfortable"
                variant="outlined"
                class="mb-2"
              />
              <v-text-field
                v-model="form.email"
                label="อีเมล"
                type="email"
                density="comfortable"
                variant="outlined"
                disabled
                class="mb-2"
              />
              <v-text-field
                v-model="form.phone"
                label="เบอร์โทรศัพท์"
                density="comfortable"
                variant="outlined"
                class="mb-2"
              />
              <v-text-field
                v-model="form.position"
                label="ตำแหน่ง"
                density="comfortable"
                variant="outlined"
                class="mb-4"
              />

              <div class="d-flex gap-2">
                <v-btn color="primary" @click="saveProfile" :loading="loading">
                  บันทึก
                </v-btn>
                <v-btn variant="text" @click="cancelEdit">
                  ยกเลิก
                </v-btn>
              </div>
            </v-form>

            <div v-else>
              <v-row>
                <v-col cols="12" sm="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">ชื่อ-นามสกุล</div>
                    <div class="text-body-1">{{ user.name || '-' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">อีเมล</div>
                    <div class="text-body-1">{{ user.email || '-' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">เบอร์โทรศัพท์</div>
                    <div class="text-body-1">{{ user.phone || '-' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="mb-4">
                    <div class="text-caption text-medium-emphasis">ตำแหน่ง</div>
                    <div class="text-body-1">{{ user.position || '-' }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
function getRoleColor(role) {
  const colors = {
    'admin': 'error',
    'evaluator': 'warning',
    'evaluatee': 'info',
    'user': 'info'
  }
  return colors[role] || 'default'
}

function getRoleText(role) {
  const texts = {
    'admin': 'ผู้ดูแลระบบ',
    'evaluator': 'กรรมการ',
    'evaluatee': 'ผู้ถูกประเมิน',
    'user': 'ผู้ถูกประเมิน'
  }
  return texts[role] || role
}
</script>