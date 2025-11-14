// plugins/piniaPersist.client.js
// ✅ Auto-persist all Pinia stores to localStorage
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia || nuxtApp.pinia

  if (!pinia) {
    console.error('[PiniaPersist] Pinia not found')
    return
  }

  pinia.use(({ store }) => {
    const key = `pinia-${store.$id}`

    // ✅ Restore state from localStorage (ทำงานทันทีตอน store initialize)
    if (process.client) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          store.$patch(parsed)
          console.log(`[PiniaPersist] Restored store "${store.$id}" from localStorage`)
        } catch (e) {
          console.error(`[PiniaPersist] Failed to restore "${store.$id}":`, e)
          // ลบ corrupted data ออก
          localStorage.removeItem(key)
        }
      }
    }

    // ✅ Subscribe to changes and save to localStorage
    store.$subscribe((_mutation, state) => {
      if (process.client) {
        try {
          localStorage.setItem(key, JSON.stringify(state))
          console.log(`[PiniaPersist] Saved store "${store.$id}" to localStorage`)
        } catch (e) {
          console.error(`[PiniaPersist] Failed to save "${store.$id}":`, e)
        }
      }
    }, { detached: true })
  })
})
