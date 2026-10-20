
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  description: string
  releaseYear: number
  director: string
  ageRating: string
  poster: string | null
  trailer: string | null
}

const movies = ref<Movie[]>([])
const search = ref('')
const selectedMovieId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.value.filter((movie) =>
    movie.title.toLowerCase().includes(query),
  )
})

function toggleDetails(movieId: number) {
  selectedMovieId.value =
    selectedMovieId.value === movieId ? null : movieId
}

async function loadMovies() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/movies')

    if (!response.ok) {
      throw new Error('Failed to load movies')
    }

    movies.value = await response.json()
  } catch (err) {
    error.value = 'Could not load movies from the server.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadMovies)
</script>

<template>
  <main>
    <h1>BOOBLICKI</h1>
    <h2>Movies</h2>
    <p>Movies loaded from our own database.</p>

    <label for="movie-search">Search movies:</label>
    <input
      id="movie-search"
      v-model="search"
      type="search"
      placeholder="Movie title"
    />

    <p v-if="loading">Loading movies...</p>

    <p v-else-if="error">{{ error }}</p>

    <p v-else-if="filteredMovies.length === 0">
      No movies found.
    </p>

    <template v-else>
      <article v-for="movie in filteredMovies" :key="movie.id">
        <img
          v-if="movie.poster"
          :src="movie.poster"
          :alt="movie.title + ' poster'"
           width="180"
      />
        <h2>{{ movie.title }}</h2>

        <p>
          {{ movie.genre }} · {{ movie.duration }} min
        </p>

        <p>
          {{ movie.releaseYear }} · {{ movie.ageRating }}
        </p>

        <button
          type="button"
          :aria-expanded="selectedMovieId === movie.id"
          @click="toggleDetails(movie.id)"
        >
          {{ selectedMovieId === movie.id ? 'Hide details' : 'Details' }}
        </button>

        <div v-if="selectedMovieId === movie.id">
          <p>{{ movie.description }}</p>
          <p>Director: {{ movie.director }}</p>
        </div>

        <p>
          <RouterLink
            :to="{ name: 'booking', params: { movieId: movie.id } }"
          >
            Choose seats
          </RouterLink>
        </p>

        <hr />
      </article>
    </template>
  </main>
</template>
