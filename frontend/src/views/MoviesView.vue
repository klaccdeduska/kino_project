<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  description: string
}

const movies: Movie[] = [
  {
    id: 1,
    title: 'Dune: Part Two',
    genre: 'Science fiction',
    duration: 166,
    description: 'Paul Atreides joins the Fremen on the planet Arrakis.',
  },
  {
    id: 2,
    title: 'Interstellar',
    genre: 'Science fiction',
    duration: 169,
    description: 'A team of explorers searches for a new home for humanity.',
  },
  {
    id: 3,
    title: 'Oppenheimer',
    genre: 'Drama',
    duration: 180,
    description: 'The story of physicist J. Robert Oppenheimer.',
  },
]

const search = ref('')
const selectedMovieId = ref<number | null>(null)

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.filter((movie) =>
    movie.title.toLowerCase().includes(query),
  )
})

function toggleDetails(movieId: number) {
  selectedMovieId.value =
    selectedMovieId.value === movieId ? null : movieId
}
</script>

<template>
  <main>
    <h1>BOOBLICKI</h1>
    <h2>Movies</h2>
    <p>Demonstration movie list.</p>

    <label for="movie-search">Search movies:</label>
    <input
      id="movie-search"
      v-model="search"
      type="search"
      placeholder="Movie title"
    />

    <p v-if="filteredMovies.length === 0">
      No movies found.
    </p>

    <article v-for="movie in filteredMovies" :key="movie.id">
      <h2>{{ movie.title }}</h2>
      <p>{{ movie.genre }} · {{ movie.duration }} min</p>

      <button
        type="button"
        :aria-expanded="selectedMovieId === movie.id"
        @click="toggleDetails(movie.id)"
      >
        {{ selectedMovieId === movie.id ? 'Hide details' : 'Details' }}
      </button>

      <p v-if="selectedMovieId === movie.id">
        {{ movie.description }}
      </p>

      <p>
        <RouterLink
          :to="{ name: 'booking', params: { movieId: movie.id } }"
        >
          Choose seats
        </RouterLink>
      </p>

      <hr />
    </article>
  </main>
</template>