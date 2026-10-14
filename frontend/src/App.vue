<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import SeatPicker from './components/SeatPicker.vue'

interface Movie {
  id: number
  title: string
  duration: number
  genre: string
  description: string
  poster: string | null
}

const movies = ref<Movie[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const selectedMovie = ref<Movie | null>(null)

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.value.filter((movie) =>
    movie.title.toLowerCase().includes(query),
  )
})

onMounted(async () => {
  try {
    const response = await fetch('/api/movies')

    if (!response.ok) {
      throw new Error(`Mistake downloading: HTTP ${response.status}`)
    }

    const data: unknown = await response.json()

    if (!Array.isArray(data)) {
      throw new Error('The server returned an unexpected data format')
    }

    movies.value = data as Movie[]
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Couldnt download movies"
  } finally { 
    loading.value = false 
  }
})

function posterUrl(url: string) {
  return url.replace(/^http:\/\//, 'https://')
}
</script>

<template>
  <header class="header">
    <a class="logo" href="/">BOOBLICKI</a>
    <span>Your evening starts here</span>
  </header>

  <main>
    <p class="label">CINEMA ON THE BIG SCREEN</p>
    <h1>Poster</h1>
    <p class="intro">Movies in theaters · Apollo Kino data</p>

<input
  v-model="search"
  class="search"
  type="search"
  placeholder="Find movie..."
  aria-label="Search for movie"
/>
<section v-if="selectedMovie" class="movie-details">
  <button class="details-button" @click="selectedMovie = null">
    Close details
  </button>

  <h2>{{ selectedMovie.title }}</h2>
  <p>{{ selectedMovie.genre }} · {{ selectedMovie.duration }} мин</p>
  <p>{{ selectedMovie.description || 'Description not available yet.' }}</p>
</section>
    <p v-if="loading" role="status">Downloading movies…</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <p v-else-if="filteredMovies.length === 0">No films found.</p>

    <section v-else class="movies" aria-label="List of movies">
      <article v-for="movie in filteredMovies" :key="movie.id" class="movie">
        <img
          v-if="movie.poster"
          class="poster-image"
          :src="posterUrl(movie.poster)"
          :alt="movie.title"
          loading="lazy"
        />
        <div v-else class="poster">{{ movie.title }}</div>

        <h2>{{ movie.title }}</h2>
        <p>{{ movie.genre }} · {{ movie.duration }} min</p>
        <button class="details-button" @click="selectedMovie = movie">
          Details
        </button>
      </article>
      <SeatPicker v-if="selectedMovie" :key="selectedMovie.id" />
    </section>
  </main>
</template>

<style scoped>
.poster-image {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 16px;
}
.search {
  width: 100%;
  max-width: 420px;
  margin-top: 16px;
  padding: 14px 18px;
  border: 1px solid #45464d;
  border-radius: 12px;
  background: #202126;
  color: white;
  font-size: 16px;
}
.search:focus {
  outline: 2px solid #e8ff75;
  outline-offset: 2px;
}
</style>
