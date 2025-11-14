
<!-- frontend/layouts/dashboard.vue -->
<!-- ✨ แก้ไขครั้งที่ 3: แก้สีตัวหนังสือในเมนูให้มองเห็นชัดเจน (เพิ่มส่วนนี้) -->
<template>
  <v-app>
    <!-- Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!smAndDown"
      :temporary="smAndDown"
      app
    >
      <!-- ✨ เพิ่มส่วนนี้: แก้สีตัวหนังสือในเมนู -->
      <v-list density="compact" nav class="menu-list">
        <template v-for="sec in menu" :key="sec.label">
          <v-list-subheader class="text-uppercase text-caption text-grey-darken-2">
            {{ sec.label }}
          </v-list-subheader>

          <template v-for="it in sec.items" :key="it.to || it.href">
            <NuxtLink
              v-if="it.to"
              :to="it.to"
              class="no-underline"
            >
              <v-list-item 
                :title="it.label" 
                :active="route.path.startsWith(it.to)"
                class="menu-item"
              >
                <template #prepend>
                  <v-icon :icon="it.icon || 'mdi-circle-small'" />
                </template>
              </v-list-item>
            </NuxtLink>

            <a v-else :href="it.href" :target="it.target || '_blank'" class="no-underline">
              <v-list-item :title="it.label" class="menu-item">
                <template #prepend>
                  <v-icon :icon="it.icon || 'mdi-circle-small'" />
                </template>
              </v-list-item>
            </a>
          </template>

          <v-divider class="my-2" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar app flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" aria-label="Toggle menu" />
      <v-toolbar-title class="font-semibold">Personnel evaluation system</v-toolbar-title>

      <v-spacer />

      <v-btn icon @click="toggleTheme" :aria-label="`Switch to ${themeName === 'dark' ? 'light':'dark'} theme`">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>

      <!-- Profile -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-avatar size="36">
              <v-img
                v-if="auth.user?.avatar_url"
                :src="auth.user.avatar_url"
                alt="User avatar"
                cover
              />
              <span
                v-else
                class="font-semibold text-white bg-primary w-full h-full flex items-center justify-center"
              >
                {{ initials }}
              </span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            :title="auth.user?.name || 'ไม่ระบุชื่อ'"
            :subtitle="auth.user?.email || '-'"
            prepend-icon="mdi-account"
          />
          <v-divider class="my-2" />
          <NuxtLink to="/me" class="no-underline">
            <v-list-item title="Profile" prepend-icon="mdi-account-cog-outline" />
          </NuxtLink>
          <v-list-item title="Logout" prepend-icon="mdi-logout" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Content -->
    <v-main class="bg-gray-50">
      <div class="p-4 lg:p-6">
        <slot />
      </div>
    </v-main>

    <v-footer app class="text-caption justify-center">
      © {{ year }} VEC Skills
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '~/stores/auth'
import { useMenu } from '~/composables/useMenu'

const route = useRoute()
const { smAndDown } = useDisplay()
const theme = useTheme()

const drawer = ref(!smAndDown.value)
watch(smAndDown, v => { drawer.value = !v })

const auth = useAuthStore()
const role = computed(() => auth?.user?.role ?? 'user')

const initials = computed(() => {
  if (!auth?.user?.name) return '?'
  const parts = auth.user.name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
})

const { menu } = useMenu(role)

const themeName = useState('theme', () => 'light')
function applyTheme (name) {
  theme.global.name.value = name
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', name)
    try { localStorage.setItem('theme', name) } catch {}
  }
}
onMounted(() => {
  let saved = null
  try { saved = localStorage.getItem('theme') } catch {}
  themeName.value = saved || themeName.value
  applyTheme(themeName.value)
})
function toggleTheme () {
  themeName.value = themeName.value === 'dark' ? 'light' : 'dark'
  applyTheme(themeName.value)
}

const year = new Date().getFullYear()

function logout () {
  try { auth.logout() } catch {}
  navigateTo('/login')
}
</script>

<style scoped>
.no-underline { 
  text-decoration: none; 
  color: inherit; 
}

/* ✨ เพิ่มส่วนนี้: แก้สีตัวหนังสือในเมนูให้มองเห็นชัดเจน */
.menu-list .v-list-subheader {
  color: #757575 !important; /* สีเทาสำหรับหัวข้อ */
}

.menu-item {
  color: #424242 !important; /* สีเทาเข้มสำหรับเมนู */
}

.menu-item:hover {
  background-color: #1976D2 !important; /* สีเทาอ่อนเมื่อ hover */
}

.menu-item.v-list-item--active {
  background-color: #E3F2FD !important; /* สีฟ้าอ่อนเมื่อเลือก */
  color: #1976D2 !important; /* สีน้ำเงินเข้มเมื่อเลือก */
}

.v-avatar span {
  font-size: 0.9rem;
  text-transform: uppercase;
}
</style>