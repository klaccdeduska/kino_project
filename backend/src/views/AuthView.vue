<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isRegister = computed(() => route.name === 'register')

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
    error.value = ''
    loading.value = true

    try {
        const action = isRegister.value ? 'register' : 'login'
        const response = await fetch(`http://localhost:3000/api/auth/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.value,
                password: password.value,
            }),
        })
        const result = await response.json()

        if (!response.ok) {
            throw new Error(
                Array.isArray(result.message)
                    ? result.message.join(', ')
                    : result.message || 'Request failed',
            )
        }

        if (isRegister.value) {
            await router.push({ name: 'login' })
            return
        }

        localStorage.setItem('kino-account', JSON.stringify(result))
        await router.push({ name: 'movies' })
    } catch (requestError) {
        error.value = requestError instanceof Error
            ? requestError.message
            : 'Could not connect to the server'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main>
        <h1>{{ isRegister ? 'Create account' : 'Sign in' }}</h1>

        <form @submit.prevent="submit">
            <label for="email">Email</label>
            <input
                id="email"
                v-model.trim="email"
                type="email"
                autocomplete="email"
                required
            >

            <label for="password">Password</label>
            <input
                id="password"
                v-model="password"
                type="password"
                :autocomplete="isRegister ? 'new-password' : 'current-password'"
                minlength="8"
                required
            >

            <p v-if="error" role="alert">{{ error }}</p>

            <button type="submit" :disabled="loading">
                {{ loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign in' }}
            </button>
        </form>

        <p v-if="isRegister">
            Already registered?
            <RouterLink to="/login">Sign in</RouterLink>
        </p>
        <p v-else>
            No account yet?
            <RouterLink to="/register">Register</RouterLink>
        </p>
    </main>
</template>
