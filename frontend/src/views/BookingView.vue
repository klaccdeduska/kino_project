<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import SeatPicker from '../components/SeatPicker.vue'

const route = useRoute()
</script>

<template>
  <main>
    <RouterLink to="/">Back to movies</RouterLink>

    <h1>Choose your seats</h1>
    <p>Movie ID: {{ route.params.movieId }}</p>
    <p>Demonstration hall. Your selection is not saved.</p>

    <SeatPicker :key="String(route.params.movieId)" />
  </main>
</template>