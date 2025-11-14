<!-- frontend/pages/admin/periods.vue -->
<!-- 📋 หน้าจัดการรอบการประเมิน (Admin Only) -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({  layout: 'dashboard' })

const auth = useAuthStore()
const config = useRuntimeConfig()

// ============= STATE =============
const items = ref([])
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedIndex = ref(-1)
const editedItem = ref({
  id: null,
  code: '',
  name_th: '',
  buddhist_year: new Date().getFullYear() + 543,
  start_date: '',
  end_date: '',
  is_active: 1
})
const defaultItem = {
  id: null,
  code: '',
  name_th: '',
  buddhist_year: new Date().getFullYear() + 543,
  start_date: '',
  end_date: '',
  is_active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อรอบ', key: 'name_th', sortable: true },
  { title: 'ปีการศึกษา', key: 'buddhist_year', sortable: true },
  { title: 'เริ่มต้น', key: 'start_date', sortable: true },
  { title: 'สิ้นสุด', key: 'end_date', sortable: true },
  { title: 'สถานะ', key: 'is_active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

// ============= COMPUTED =============
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มรอบการประเมิน' : 'แก้ไขรอบการประเมิน'
})

// ============= METHODS =============
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/periods`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    items.value = res.items || []
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openDialog(item = null) {
  if (item) {
    editedIndex.value = items.value.indexOf(item)
    editedItem.value = Object.assign({}, item)
  } else {
    editedIndex.value = -1
    editedItem.value = Object.assign({}, defaultItem)
  }
  dialog.value = true
  errorMsg.value = ''
  successMsg.value = ''
}

function closeDialog() {
  dialog.value = false
  setTimeout(() => {
    editedItem.value = Object.assign({}, defaultItem)
    editedIndex.value = -1
  }, 300)
}

function openDeleteDialog(item) {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = Object.assign({}, item)
  dialogDelete.value = true
}

function closeDeleteDialog() {
  dialogDelete.value = false
  setTimeout(() => {
    editedItem.value = Object.assign({}, defaultItem)
    editedIndex.value = -1
  }, 300)
}

async function save() {
  errorMsg.value = ''
  successMsg.value = ''

  // Validation
  if (!editedItem.value.code || !editedItem.value.name_th || !editedItem.value.start_date || !editedItem.value.end_date) {
    errorMsg.value = 'กรุณากรอกข้อมูลให้ครบถ้วน'
    return
  }

  loading.value = true
  try {
    if (editedIndex.value > -1) {
      // Update
      await $fetch(`${config.public.apiBase}/api/periods/${editedItem.value.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: {
          code: editedItem.value.code,
          name_th: editedItem.value.name_th,
          buddhist_year: editedItem.value.buddhist_year,
          start_date: editedItem.value.start_date,
          end_date: editedItem.value.end_date,
          is_active: editedItem.value.is_active ? 1 : 0
        }
      })
      successMsg.value = 'แก้ไขข้อมูลสำเร็จ'
    } else {
      // Create
      await $fetch(`${config.public.apiBase}/api/periods`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: {
          code: editedItem.value.code,
          name_th: editedItem.value.name_th,
          buddhist_year: editedItem.value.buddhist_year,
          start_date: editedItem.value.start_date,
          end_date: editedItem.value.end_date,
          is_active: editedItem.value.is_active ? 1 : 0
        }
      })
      successMsg.value = 'เพิ่มข้อมูลสำเร็จ'
    }
    closeDialog()
    await loadData()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'บันทึกไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function deleteItem() {
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch(`${config.public.apiBase}/api/periods/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    successMsg.value = 'ลบข้อมูลสำเร็จ'
    closeDeleteDialog()
    await loadData()
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || 'ลบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function getStatusColor(isActive) {
  return isActive ? 'success' : 'grey'
}

function getStatusText(isActive) {
  return isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
}

// ============= LIFECYCLE =============
onMounted(() => {
  // ตรวจสิทธิ์ Admin
  if (auth.user?.role !== 'admin') {
    navigateTo('/')
  }
  loadData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h5">จัดการรอบการประเมิน</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        เพิ่มรอบการประเมิน
      </v-btn>
    </div>

    <!-- Alert Messages -->
    <v-alert v-if="errorMsg" type="error" variant="tonal" closable class="mb-4" @click:close="errorMsg = ''">
      {{ errorMsg }}
    </v-alert>
    <v-alert v-if="successMsg" type="success" variant="tonal" closable class="mb-4" @click:close="successMsg = ''">
      {{ successMsg }}
    </v-alert>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        loading-text="กำลังโหลด..."
        no-data-text="ไม่มีข้อมูล"
        items-per-page-text="แสดงต่อหน้า"
        class="elevation-1"
      >
        <!-- Status Column -->
        <template #item.is_active="{ item }">
          <v-chip :color="getStatusColor(item.is_active)" size="small" variant="flat">
            {{ getStatusText(item.is_active) }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="openDeleteDialog(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h6 bg-primary">
          {{ formTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.code"
                  label="รหัสรอบ *"
                  hint="เช่น Y2568-1"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.buddhist_year"
                  label="ปีการศึกษา (พ.ศ.) *"
                  type="number"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name_th"
                  label="ชื่อรอบการประเมิน *"
                  hint="เช่น รอบที่ 1 ปีการศึกษา 2568"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.start_date"
                  label="วันที่เริ่มต้น *"
                  type="date"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.end_date"
                  label="วันที่สิ้นสุด *"
                  type="date"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editedItem.is_active"
                  label="เปิดใช้งาน"
                  color="success"
                  :true-value="1"
                  :false-value="0"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-container>

          <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-2">
            {{ errorMsg }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" :loading="loading" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">ยืนยันการลบ</v-card-title>
        <v-card-text>
          คุณต้องการลบรอบการประเมิน <strong>{{ editedItem.name_th }}</strong> ใช่หรือไม่?
          <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
            การลบจะไม่สามารถกู้คืนได้!
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">ยกเลิก</v-btn>
          <v-btn color="error" variant="flat" :loading="loading" @click="deleteItem">ลบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* เพิ่ม padding ให้ card title */
.v-card-title {
  padding: 16px 24px !important;
}
</style>