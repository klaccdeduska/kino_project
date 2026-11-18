import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useCheckoutTimer(getDeadline: () => number | undefined) {
  const now = ref(Date.now())
  const updateTime = () => { now.value = Date.now() }
  let timer: number | undefined

  onMounted(() => {
    updateTime()
    timer = window.setInterval(updateTime, 250)
  })
  onUnmounted(() => window.clearInterval(timer))

  const remainingSeconds = computed(() =>
    Math.max(0, Math.ceil(((getDeadline() ?? 0) - now.value) / 1000)),
  )
  const remainingTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = String(remainingSeconds.value % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  return { remainingSeconds, remainingTime, updateTime }
}
