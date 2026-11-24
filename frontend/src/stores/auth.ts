import { ref } from 'vue'

export interface UserProfile {
  id: number
  email: string
  name: string | null
  dateOfBirth: string | null
  language: 'et' | 'ru' | 'en'
}

export const currentUser = ref<UserProfile | null>(null)
export const authLoading = ref(false)

export async function loadCurrentUser() {
  authLoading.value = true

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    })

    if (!response.ok) {
      currentUser.value = null
      return
    }

    currentUser.value = await response.json()
  } catch {
    currentUser.value = null
  } finally {
    authLoading.value = false
  }
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })

  currentUser.value = null
}
