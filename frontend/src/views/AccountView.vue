<script setup lang="ts">
import { ref, watch } from 'vue'
import { currentUser } from '../stores/auth'

const name = ref('')
const email = ref('')
const dateOfBirth = ref('')
const language = ref<'et' | 'ru' | 'en'>('et')
const message = ref('')
const error = ref('')

watch(
  currentUser,
  (user) => {
    if (!user) return
    name.value = user.name ?? ''
    email.value = user.email
    dateOfBirth.value = user.dateOfBirth ?? ''
    language.value = user.language
  },
  { immediate: true },
)

async function saveProfile() {
  error.value = ''
  message.value = ''

  const response = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: name.value,
      dateOfBirth: dateOfBirth.value,
      language: language.value,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    error.value = result.message ?? 'Could not save profile'
    return
  }

  Object.assign(currentUser.value ?? {}, result)
  message.value = 'Profile saved'
}
</script>

<template>
  <main>
    <h1>My profile</h1>

    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>

    <form @submit.prevent="saveProfile">
      <label
        >Name
        <input v-model="name" maxlength="100" />
      </label>

      <label
        >Email
        <input :value="email" type="email" disabled />
      </label>

      <label
        >Date of birth
        <input v-model="dateOfBirth" type="date" />
      </label>

      <label
        >Language
        <select v-model="language">
          <option value="et">Eesti</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </label>

      <button type="submit">Save profile</button>
    </form>
  </main>
</template>
