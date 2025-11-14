<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-4">จัดการผู้ใช้</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <base-card title="รายการผู้ใช้" icon="mdi-account-group">
          <template #actions>
            <v-btn color="primary" @click="openDialog()">
              <v-icon icon="mdi-plus" start></v-icon>
              เพิ่มผู้ใช้
            </v-btn>
          </template>

          <base-table
            :headers="headers"
            :items="users"
            :loading="loading"
          >
            <template #item.role="{ item }">
              <v-chip :color="getRoleColor(item.role)" size="small">
                {{ getRoleName(item.role) }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)"></v-btn>
            </template>
          </base-table>
        </base-card>
      </v-col>
    </v-row>

    <!-- Dialog -->
    <base-dialog
      v-model="dialog"
      :title="editMode ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'"
      icon="mdi-account"
      @confirm="saveUser"
      :loading="saving"
    >
      <v-form ref="userForm">
        <v-text-field
          v-model="formData.name_th"
          label="ชื่อ-สกุล"
          :rules="[rules.required]"
        ></v-text-field>

        <v-text-field
          v-model="formData.email"
          label="อีเมล"
          type="email"
          :rules="[rules.required, rules.email]"
        ></v-text-field>

        <v-text-field
          v-if="!editMode"
          v-model="formData.password"
          label="รหัสผ่าน"
          type="password"
          :rules="[rules.required]"
        ></v-text-field>

        <v-select
          v-model="formData.role"
          label="บทบาท"
          :items="roles"
          item-title="text"
          item-value="value"
          :rules="[rules.required]"
        ></v-select>
      </v-form>
    </base-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseTable from '@/components/base/BaseTable.vue';
import BaseDialog from '@/components/base/BaseDialog.vue';
import userService from '@/services/userService';
import { useNotificationStore } from '@/stores/notification';
import { required, email } from '@/utils/validators';

const notificationStore = useNotificationStore();

const loading = ref(false);
const saving = ref(false);
const dialog = ref(false);
const editMode = ref(false);
const users = ref([]);
const userForm = ref(null);
const formData = ref({});

const headers = [
  { title: 'ชื่อ-สกุล', key: 'name_th' },
  { title: 'อีเมล', key: 'email' },
  { title: 'บทบาท', key: 'role' },
  { title: 'จัดการ', key: 'actions', sortable: false }
];

const roles = [
  { text: 'ฝ่ายบุคลากร', value: 'admin' },
  { text: 'ผู้รับการประเมิน', value: 'evaluatee' },
  { text: 'กรรมการ', value: 'evaluator' }
];

const rules = { required, email };

const getRoleColor = (role) => {
  const colors = { admin: 'purple', evaluatee: 'blue', evaluator: 'orange' };
  return colors[role] || 'grey';
};

const getRoleName = (role) => {
  const names = { admin: 'ฝ่ายบุคลากร', evaluatee: 'ผู้รับการประเมิน', evaluator: 'กรรมการ' };
  return names[role] || role;
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await userService.getAll();
    users.value = response.data.items || [];
  } catch (error) {
    notificationStore.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
  } finally {
    loading.value = false;
  }
};

const openDialog = (user = null) => {
  editMode.value = !!user;
  formData.value = user ? { ...user } : { role: 'evaluatee' };
  dialog.value = true;
};

const saveUser = async () => {
  const { valid } = await userForm.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (editMode.value) {
      await userService.update(formData.value.id, formData.value);
      notificationStore.success('อัปเดตผู้ใช้สำเร็จ');
    } else {
      await userService.create(formData.value);
      notificationStore.success('เพิ่มผู้ใช้สำเร็จ');
    }
    dialog.value = false;
    loadUsers();
  } catch (error) {
    notificationStore.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (user) => {
  if (confirm(`ต้องการลบผู้ใช้ "${user.name_th}" หรือไม่?`)) {
    try {
      await userService.delete(user.id);
      notificationStore.success('ลบผู้ใช้สำเร็จ');
      loadUsers();
    } catch (error) {
      notificationStore.error('ไม่สามารถลบผู้ใช้ได้');
    }
  }
};

onMounted(() => {
  loadUsers();
});
</script>
