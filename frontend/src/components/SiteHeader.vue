<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { currentUser, loadCurrentUser, logout } from '../stores/auth'
import { setLocale, type Locale } from '../i18n'

const router = useRouter()
const { t, locale } = useI18n()
const localeSaveError = ref(false)
onMounted(() => void loadCurrentUser())

async function changeLocale(event: Event) {
  const selectedLocale = (event.currentTarget as HTMLSelectElement)
    .value as Locale
  setLocale(selectedLocale)
  localeSaveError.value = false

  if (!currentUser.value) return

  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ language: selectedLocale }),
    })

    if (!response.ok) throw new Error('Could not save preferred language')
    currentUser.value.language = selectedLocale
  } catch (error) {
    localeSaveError.value = true
    console.error(error)
  }
}

async function signOut() {
  await logout()
  if (router.currentRoute.value.name === 'account') await router.replace('/')
}
</script>

<template>
  <header class="site-header">
    <nav class="site-navigation" :aria-label="t('nav.mainNavigation')">
      <RouterLink class="site-brand" to="/"
        >BUBLIKI<span>CINEMA</span></RouterLink
      >
      <RouterLink class="catalog-link" to="/#movies">{{ t('nav.movies') }}</RouterLink>
      <div class="account-links">
        <label class="locale-picker">
          <span class="visually-hidden">{{ t('nav.language') }}</span>
          <select
            :value="locale"
            :aria-label="t('nav.language')"
            @change="changeLocale"
          >
            <option value="et">ET</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </label>
        <span v-if="localeSaveError" class="visually-hidden" role="status">
          {{ t('nav.languageSaveFailed') }}
        </span>
        <template v-if="currentUser">
        <RouterLink class="sign-in" to="/my-tickets">{{ t('nav.tickets') }}</RouterLink>
        <RouterLink class="sign-in" to="/account">{{ t('nav.profile') }}</RouterLink>
        <button type="button" class="sign-in" @click="signOut">{{ t('nav.logout') }}</button>
        </template>
        <template v-else>
        <RouterLink class="sign-in" to="/login">{{ t('nav.login') }}</RouterLink>
        <RouterLink class="sign-up" to="/register">{{ t('nav.signUp') }}</RouterLink>
        </template>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid #342b40;
  background: #17131d;
  color: #f2f2f3;
}

.site-navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  min-height: 74px;
  margin: 0 auto;
  padding: 12px 24px;
}

.site-brand {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
}

.site-brand span {
  display: block;
  margin-top: 2px;
  color: #c4b5fd;
  font-size: 9px;
  letter-spacing: 5px;
}

.site-navigation a {
  color: inherit;
  text-decoration: none;
}

.site-navigation a:focus-visible,
.account-links button:focus-visible,
.locale-picker select:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 4px;
}

.catalog-link,
.account-links a,
.account-links button {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.catalog-link:hover,
.sign-in:hover {
  background: #2c2337;
}

.account-links {
  display: flex;
  justify-self: end;
  align-items: center;
  gap: 8px;
}

.account-links button {
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}

.locale-picker select {
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid #5d5068;
  border-radius: 8px;
  color: inherit;
  background: #211a29;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.account-links .sign-up {
  background: #c4b5fd;
  color: #20152f;
  font-weight: 700;
}

.account-links .sign-up:hover {
  background: #d8cdff;
}

@media (max-width: 600px) {
  .site-navigation {
    grid-template-columns: auto 1fr;
    gap: 4px;
    padding: 10px 12px;
  }

  .site-brand {
    font-size: 18px;
  }

  .site-brand span {
    font-size: 8px;
    letter-spacing: 3px;
  }

  .catalog-link {
    justify-self: end;
  }

  .catalog-link,
  .account-links a,
  .account-links button {
    padding: 8px 6px;
    font-size: 12px;
  }

  .account-links {
    grid-column: 1 / -1;
    justify-self: end;
    gap: 4px;
  }

  .locale-picker select {
    min-height: 34px;
    padding: 6px 6px;
    font-size: 11px;
  }
}

@media print {
  .site-header {
    display: none;
  }
}
</style>
