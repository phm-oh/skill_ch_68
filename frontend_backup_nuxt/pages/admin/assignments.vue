<!-- frontend/pages/admin/assignments.vue -->
<!-- ✨ แก้ไข FINAL: สลับตัวแปร evaluators/evaluatees -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const items = ref([])
const periods = ref([])
const evaluators = ref([])
const evaluatees = ref([])
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedItem = ref({
  evaluator_id: null,
  evaluatee_id: null,
  period_id: null
})
const defaultItem = {
  evaluator_id: null,
  evaluatee_id: null,
  period_id: null
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รอบการประเมิน', key: 'period_name', sortable: true },
  { title: 'กรรมการ', key: 'evaluator_name', sortable: true },
  { title: 'ผู้ถูกประเมิน', key: 'evaluatee_name', sortable: true },
  { title: 'วันที่มอบหมาย', key: 'created_at', sortable: true },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

// ============= METHODS =============
async function fetchItems() {
  loading.value = true
  errorMsg.value = ''
  try {
    console.log('🔍 Fetching assignments from:', `${config.public.apiBase}/api/assignments`)
    const res = await $fetch(`${config.public.apiBase}/api/assignments`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    console.log('✅ API Response:', res)
    items.value = res.items || []
    console.log('📋 Assignments loaded:', items.value.length, 'items', items.value)
  } catch (e) {
    console.error('❌ Fetch assignments error:', e)
    errorMsg.value = e.data?.message || e.message || 'Load failed'
  } finally {
    loading.value = false
  }
}

async function fetchPeriods() {
  try {
    console.log('🔍 Fetching periods...')
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    periods.value = res.items || []
    console.log('✅ PERIODS loaded:', periods.value.length, 'periods')
  } catch (e) {
    console.error('❌ Load periods failed:', e)
  }
}

// ✨✨✨ แก้ไข: เปลี่ยนลำดับการเก็บตัวแปร! ✨✨✨
async function fetchUsers() {
  try {
    console.log('🔍 Fetching users...')

    // ดึงกรรมการ
    const resEvaluators = await $fetch(`${config.public.apiBase}/api/users/role/evaluator`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    evaluators.value = resEvaluators.items || []
    console.log('✅ EVALUATORS loaded:', evaluators.value.length, 'users', evaluators.value)

    // ดึงผู้ถูกประเมิน
    const resEvaluatees = await $fetch(`${config.public.apiBase}/api/users/role/evaluatee`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    evaluatees.value = resEvaluatees.items || []
    console.log('✅ EVALUATEES loaded:', evaluatees.value.length, 'users', evaluatees.value)
  } catch (e) {
    console.error('❌ Load users failed:', e)
    errorMsg.value = 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ'
  }
}

function deleteItem(item) {
  editedItem.value = { ...item }
  dialogDelete.value = true
}

async function deleteItemConfirm() {
  try {
    await $fetch(`${config.public.apiBase}/api/assignments/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบสำเร็จ'
    await fetchItems()
  } catch (e) {
    errorMsg.value = e.data?.message || e.message || 'Delete failed'
  } finally {
    closeDelete()
  }
}

function close() {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
  }, 300)
}

function closeDelete() {
  dialogDelete.value = false
  setTimeout(() => {
    editedItem.value = { ...defaultItem }
  }, 300)
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!editedItem.value.period_id || !editedItem.value.evaluator_id || !editedItem.value.evaluatee_id) {
    errorMsg.value = 'กรุณาเลือกข้อมูลให้ครบ'
    return
  }

  try {
    console.log('💾 Saving assignment:', editedItem.value)
    const result = await $fetch(`${config.public.apiBase}/api/assignments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      },
      body: editedItem.value
    })
    console.log('✅ Assignment saved:', result)
    successMsg.value = 'มอบหมายสำเร็จ'
    await fetchItems()
    close()
  } catch (e) {
    console.error('❌ Save assignment error:', e)
    errorMsg.value = e.data?.message || e.message || 'Save failed'
  }
}

// ============= LIFECYCLE =============
onMounted(() => {
  fetchPeriods()
  fetchUsers()
  fetchItems()
})
</script>

<template>
  <div class="pa-4">
    <!-- Header with Home Button -->
    <div class="d-flex align-center mb-4">
      <v-btn icon size="small" variant="text" @click="$router.push('/')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <h1 class="text-h5 ml-2">มอบหมายกรรมการ</h1>
    </div>

    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-h6">รายการมอบหมาย</span>
        <v-spacer />
        <v-btn color="primary" @click="dialog = true">
          <v-icon left>mdi-account-plus</v-icon>
          มอบหมาย
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="errorMsg" type="error" dismissible @click:close="errorMsg = ''">
          {{ errorMsg }}
        </v-alert>
        <v-alert v-if="successMsg" type="success" dismissible @click:close="successMsg = ''">
          {{ successMsg }}
        </v-alert>

        <v-data-table
          :headers="headers"
          :items="items"
          :loading="loading"
          class="elevation-1"
        >
          <template #item.created_at="{ item }">
            {{ new Date(item.created_at).toLocaleDateString('th-TH') }}
          </template>

          <template #item.actions="{ item }">
            <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog มอบหมาย -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>มอบหมายกรรมการ</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.period_id"
                  :items="periods"
                  item-title="name_th"
                  item-value="id"
                  label="รอบการประเมิน *"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.evaluator_id"
                  :items="evaluators"
                  item-title="name_th"
                  item-value="id"
                  label="กรรมการ *"
                  required
                  hint="ผู้ทำการประเมิน"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.evaluatee_id"
                  :items="evaluatees"
                  item-title="name_th"
                  item-value="id"
                  label="ผู้ถูกประเมิน *"
                  required
                  hint="ผู้ที่จะถูกประเมิน"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="close">ยกเลิก</v-btn>
          <v-btn color="primary" variant="elevated" @click="save">มอบหมาย</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ยืนยันลบ -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title>ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการยกเลิกการมอบหมายนี้ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="closeDelete">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>