<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { currentUser, loadCurrentUser, logout } from '../stores/auth'

const router = useRouter()
onMounted(() => void loadCurrentUser())

async function signOut() {
  await logout()
  if (router.currentRoute.value.name === 'account') await router.replace('/')
}
</script>

<template>
  <header class="site-header">
    <nav class="site-navigation" aria-label="Main navigation">
      <RouterLink class="site-brand" to="/"
        >BUBLIKI<span>CINEMA</span></RouterLink
      >
      <RouterLink class="catalog-link" to="/#movies">Movies</RouterLink>
      <div v-if="currentUser" class="account-links">
        <RouterLink class="sign-in" to="/my-tickets">My tickets</RouterLink>
        <RouterLink class="sign-in" to="/account">Profile</RouterLink>
        <button type="button" class="sign-in" @click="signOut">Log out</button>
      </div>

      <div v-else class="account-links">
        <RouterLink class="sign-in" to="/login">Sign in</RouterLink>
        <RouterLink class="sign-up" to="/register">Sign up</RouterLink>
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
  margin: 0;
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
.account-links button:focus-visible {
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
    grid-template-columns: auto 1fr auto;
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
    justify-self: center;
  }

  .catalog-link,
  .account-links a,
  .account-links button {
    padding: 8px 6px;
    font-size: 12px;
  }

  .account-links {
    gap: 4px;
  }
}

@media (max-width: 410px) {
  .site-navigation {
    grid-template-columns: 1fr auto;
  }
  .account-links {
    grid-column: 1 / -1;
  }
}

@media print {
  .site-header {
    display: none;
  }
}
</style>
