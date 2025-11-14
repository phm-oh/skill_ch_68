<!-- frontend/pages/admin/topics.vue -->
<!-- 📋 หน้าจัดการหัวข้อการประเมิน (Admin Only) -->
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
  title_th: '',
  description: '',
  weight: 0,
  order: 1,
  active: 1
})
const defaultItem = {
  id: null,
  code: '',
  title_th: '',
  description: '',
  weight: 0,
  order: 1,
  active: 1
}
const errorMsg = ref('')
const successMsg = ref('')

// ============= TABLE CONFIG =============
const headers = [
  { title: 'รหัส', key: 'code', sortable: true },
  { title: 'ชื่อหัวข้อ', key: 'title_th', sortable: true },
  { title: 'น้ำหนัก', key: 'weight', sortable: true, align: 'center' },
  { title: 'ลำดับ', key: 'order', sortable: true, align: 'center' },
  { title: 'สถานะ', key: 'active', sortable: false },
  { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' }
]

// ============= COMPUTED =============
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'เพิ่มหัวข้อการประเมิน' : 'แก้ไขหัวข้อการประเมิน'
})

// ============= METHODS =============
async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/api/topics`, {
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
  if (!editedItem.value.code || !editedItem.value.title_th) {
    errorMsg.value = 'กรุณากรอกรหัสและชื่อหัวข้อ'
    return
  }

  loading.value = true
  try {
    if (editedIndex.value > -1) {
      // Update
      await $fetch(`${config.public.apiBase}/api/topics/${editedItem.value.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: {
          code: editedItem.value.code,
          title_th: editedItem.value.title_th,
          description: editedItem.value.description || null,
          weight: editedItem.value.weight || 0,
          order: editedItem.value.order || 1,
          active: editedItem.value.active ? 1 : 0
        }
      })
      successMsg.value = 'แก้ไขข้อมูลสำเร็จ'
    } else {
      // Create
      await $fetch(`${config.public.apiBase}/api/topics`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: {
          code: editedItem.value.code,
          title_th: editedItem.value.title_th,
          description: editedItem.value.description || null,
          weight: editedItem.value.weight || 0,
          order: editedItem.value.order || 1,
          active: editedItem.value.active ? 1 : 0
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
    await $fetch(`${config.public.apiBase}/api/topics/${editedItem.value.id}`, {
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

function getStatusColor(active) {
  return active ? 'success' : 'grey'
}

function getStatusText(active) {
  return active ? 'ใช้งาน' : 'ปิด'
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
      <div>
        <h1 class="text-h5">จัดการหัวข้อการประเมิน</h1>
        <p class="text-caption text-grey mt-1">กำหนดหัวข้อและน้ำหนักคะแนน</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
        เพิ่มหัวข้อ
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
        <!-- Weight Column -->
        <template #item.weight="{ item }">
          <v-chip color="primary" size="small" variant="flat">
            {{ item.weight }}%
          </v-chip>
        </template>

        <!-- Status Column -->
        <template #item.active="{ item }">
          <v-chip :color="getStatusColor(item.active)" size="small" variant="flat">
            {{ getStatusText(item.active) }}
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
                  label="รหัสหัวข้อ *"
                  hint="เช่น TOP1"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.order"
                  label="ลำดับที่ *"
                  type="number"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.title_th"
                  label="ชื่อหัวข้อ *"
                  hint="เช่น ด้านการจัดการเรียนรู้"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="รายละเอียด"
                  rows="2"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.weight"
                  label="น้ำหนักคะแนน (%)"
                  type="number"
                  hint="รวมทุกหัวข้อต้องเท่ากับ 100%"
                  persistent-hint
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="editedItem.active"
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
          คุณต้องการลบหัวข้อ <strong>{{ editedItem.title_th }}</strong> ใช่หรือไม่?
          <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
            การลบจะไม่สามารถกู้คืนได้! และจะส่งผลต่อตัวชี้วัดที่เชื่อมโยงอยู่
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
.v-card-title {
  padding: 16px 24px !important;
}
</style>