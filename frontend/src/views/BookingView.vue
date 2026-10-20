<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import SeatPicker from '../components/SeatPicker.vue'
import { computed } from 'vue'

const route = useRoute()

const hasSession = computed(() => {
  return Boolean(
    route.query.sessionId &&
    route.query.date &&
    route.query.time
  )
})
</script>

<template>
  <main>
    <RouterLink to="/">Back to movies</RouterLink>

    <h1>Choose your seats</h1>
    <p>Movie ID: {{ route.params.movieId }}</p>
    <p v-if="hasSession">
      Session: {{ route.query.date }} — {{ route.query.time }}
    </p>
    <p v-else>
      Please choose a session from the movie list.
    </p>
    <p>Demonstration hall. Your selection is not saved.</p>

    <SeatPicker v-if="hasSession" :key="`${route.params.movieId}-${route.query.sessionId}`" />
  </main>
</template>