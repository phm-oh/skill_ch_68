<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useMenu } from '~/composables/useMenu'

const auth = useAuthStore()
const router = useRouter()

// ✅ ดึง role จาก auth store จริง
const role = computed(() => auth.user?.role || 'user')
const { menu } = useMenu(role)
const drawer = ref(true)

// ✅ เพิ่ม logout function
function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-app-bar color="surface" flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>Personnel evaluation system</v-toolbar-title>
      <v-spacer />
      <!-- แสดงชื่อผู้ใช้และบทบาท -->
      <span class="mr-4 text-caption">
        {{ auth.user?.name }} ({{ role }})
      </span>
      <v-btn icon="mdi-account-circle" variant="text" />
      <v-btn @click="logout" color="error" variant="text">Logout</v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" width="260">
      <v-list density="comfortable" nav>
        <template v-for="(section, i) in menu" :key="i">
          <v-list-subheader class="text-caption">{{ section.label }}</v-list-subheader>
          <v-list-item
            v-for="(it, j) in section.items"
            :key="j"
            :to="it.to"
            :href="it.href"
            :target="it.target"
            :prepend-icon="it.icon"
            :title="it.label"
            :value="it.to || it.href"
          />
          <v-divider class="my-2" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="py-6">
        <slot />
      </v-container>
      <v-footer app class="text-caption justify-center">© 2025 VEC Skills</v-footer>
    </v-main>
  </v-app>
</template>
