<script setup lang="ts">
import { RouterView } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
</script>

<template>
  <SiteHeader />
  <RouterView />
</template>

<style>
html {
  color-scheme: dark;
  background: #0d0d0f;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0d0d0f;
  color: #f2f2f3;
}

* {
  box-sizing: border-box;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.account-page {
  max-width: 460px;
  margin: 32px auto;
  padding: clamp(16px, 5vw, 32px);
  border: 1px solid #44364f;
  border-radius: 16px;
  background: #19141f;
}

.account-page h1 {
  margin: 0 0 24px;
}

.account-page form {
  display: grid;
  gap: 10px;
}

.account-page form label:has(input),
.account-page form label:has(select) {
  display: grid;
  gap: 6px;
}

.account-page :is(input, select, button) {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid #5d5068;
  border-radius: 8px;
  color: inherit;
  background: #211a29;
  font: inherit;
}

.account-page button {
  margin-top: 8px;
  background: #c4b5fd;
  color: #20152f;
  font-weight: 700;
  cursor: pointer;
}

.account-page button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.account-page a {
  color: #c4b5fd;
}

.account-page :focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: 3px;
}

@media (max-width: 492px) {
  .account-page {
    margin: 24px 16px;
  }
}
</style>
