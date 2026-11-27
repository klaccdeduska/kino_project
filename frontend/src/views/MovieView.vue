<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiError, getMovie, type Movie } from '../api'
import MovieShowtimes from '../components/MovieShowtimes.vue'
import movieBackdrops from '../data/movieBackdrops.json'

const props = defineProps<{ movieId: string }>()
const movie = ref<Movie | null>(null)
const status = ref<'loading' | 'missing' | 'error' | 'ready'>('loading')
const backdrops: Record<string, { src: string; position: string }> = movieBackdrops
const backdrop = computed(() => (movie.value ? backdrops[movie.value.title] : undefined))

watch(
  () => props.movieId,
  async (id, _previous, onCleanup) => {
    let current = true
    onCleanup(() => { current = false })
    movie.value = null
    status.value = 'loading'

    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      status.value = 'missing'
      return
    }

    try {
      const result = await getMovie(id)
      if (!current) return
      movie.value = result
      status.value = 'ready'
    } catch (error) {
      if (!current) return
      status.value = error instanceof ApiError && error.status === 404 ? 'missing' : 'error'
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="movie-page">
    <RouterLink class="catalog-back" :to="{ name: 'movies', hash: '#movies' }">
      ← All movies
    </RouterLink>

    <p v-if="status === 'loading'" role="status">Loading movie…</p>
    <h1 v-else-if="status === 'missing'">Movie not found</h1>
    <p v-else-if="status === 'error'" role="alert">Could not load the movie. Refresh to try again.</p>
    <template v-else-if="movie">
      <section class="movie-hero" :class="{ 'has-poster': movie.poster }" aria-labelledby="movie-title">
        <img
          v-if="backdrop"
          class="movie-backdrop"
          :src="backdrop.src"
          :style="{ objectPosition: backdrop.position }"
          alt=""
        />
        <img v-if="movie.poster" class="movie-poster" :src="movie.poster" alt="" />
        <div class="movie-copy">
          <h1 id="movie-title">{{ movie.title }}</h1>
          <ul class="movie-meta" aria-label="Movie information">
            <li>{{ movie.genre }}</li>
            <li>{{ movie.duration }} min</li>
            <li>{{ movie.releaseYear }}</li>
            <li>{{ movie.ageRating }}</li>
          </ul>
          <p class="movie-director">Director: {{ movie.director }}</p>
          <p>{{ movie.description }}</p>
        </div>
      </section>
      <MovieShowtimes :movie-id="movie.id" :duration="movie.duration" />
    </template>
  </main>
</template>

<style scoped>
.movie-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 40px);
}
.catalog-back {
  display: inline-block;
  margin-bottom: 20px;
  color: #d5c7ff;
  text-underline-offset: 4px;
}
.movie-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(110px, 220px) minmax(0, 1fr);
  align-items: end;
  gap: clamp(20px, 4vw, 48px);
  min-height: 360px;
  padding: clamp(20px, 4vw, 52px);
  border: 1px solid #44364f;
  border-radius: 24px;
  background: #19141f;
}
.movie-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.movie-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(0deg, #15111c 3%, #15111cd9 55%, #15111c66);
}
.movie-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 12px;
}
.movie-copy { grid-column: 2; line-height: 1.6; overflow-wrap: anywhere; }
.movie-hero:not(.has-poster) .movie-copy { grid-column: 1 / -1; }
.movie-copy h1 { margin: 0 0 16px; font-size: clamp(30px, 5vw, 58px); line-height: 1.05; }
.movie-meta { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; }
.movie-meta li { padding: 4px 10px; background: #221a2de6; border-radius: 8px; }
.movie-director { color: #c4b6d5; }
@media (max-width: 600px) {
  .movie-hero { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .movie-poster { width: min(42%, 140px); }
  .movie-copy { grid-column: 1; }
}
</style>
