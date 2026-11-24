<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  getMovies,
  getSessions,
  type CatalogMovie as Movie,
  type Session,
} from '../api'
import movieBackdrops from '../data/movieBackdrops.json'
import {
  formatSessionDate,
  formatSessionWeek,
  getSessionWeekStart,
  getSessionEndTime,
  endsNextDay,
} from '../utils/session'
onMounted(() => {
  void loadMovies()
})

const backdrops: Record<string, { src: string; position: string }> =
  movieBackdrops

function getMovieBackdrop(movie: Movie) {
  return backdrops[movie.title]?.src ?? movie.poster
}

function getMovieBackdropPosition(movie: Movie) {
  return backdrops[movie.title]?.position ?? 'center center'
}

const movies = ref<Movie[]>([])
const topMovieIds = [2, 1, 3, 4, 9, 12]

const topMovies = computed(() => {
  const moviesById = new Map(movies.value.map((movie) => [movie.id, movie]))

  return topMovieIds
    .map((id) => moviesById.get(id))
    .filter((movie): movie is Movie => movie !== undefined)
})
const search = ref('')
const selectedGenres = ref<string[]>([])
const catalogMode = ref<'all' | 'now'>('all')
const nowShowingCount = computed(
  () => movies.value.filter((movie) => movie.hasUpcomingSessions).length,
)

function toggleGenre(genre: string) {
  if (selectedGenres.value.includes(genre)) {
    selectedGenres.value = selectedGenres.value.filter((item) => item !== genre)
  } else {
    selectedGenres.value.push(genre)
  }
}
const loading = ref(true)
const error = ref('')
const moviesTrack = ref<HTMLDivElement | null>(null)
const topMoviesTrack = ref<HTMLDivElement | null>(null)

function scrollTopMovies(direction: number) {
  const track = topMoviesTrack.value
  const card = track?.querySelector<HTMLElement>('.top-movie-card')
  if (!track || !card) return
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  track.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  })
}
const sessionsPanel = ref<HTMLElement | null>(null)
const featuredMovies = ref<Movie[]>([])
const featuredIndex = ref(0)
const featuredDirection = ref(1)
const featuredMoving = ref(false)
const featuredMovie = computed(() => featuredMovies.value[featuredIndex.value])

function selectFeaturedMovies() {
  // Pick once after loading; searching and clicking arrows do not reshuffle.
  const pool = [...movies.value]
  const selection: Movie[] = []

  while (pool.length > 0 && selection.length < 4) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    const [movie] = pool.splice(randomIndex, 1)
    if (movie) selection.push(movie)
  }

  featuredMovies.value = selection
  featuredIndex.value = 0
}

function changeFeatured(direction: number) {
  const count = featuredMovies.value.length
  if (count < 2 || featuredMoving.value) return
  featuredDirection.value = direction
  featuredMoving.value = true
  featuredIndex.value = (featuredIndex.value + direction + count) % count
}

function goToFeatured(index: number) {
  if (index === featuredIndex.value || featuredMoving.value) return
  featuredDirection.value = index > featuredIndex.value ? 1 : -1
  featuredMoving.value = true
  featuredIndex.value = index
}

const sessionsMovieId = ref<number | null>(null)
const sessions = ref<Session[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const cinemaDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Tallinn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const currentWeek = ref(getSessionWeekStart(cinemaDate.format()))
const selectedWeek = ref(currentWeek.value)
const selectedDate = ref('')

function selectWeek(week: string) {
  selectedWeek.value = week
  selectedDate.value = ''
}

const sessionsMovie = computed(() => {
  return movies.value.find((movie) => movie.id === sessionsMovieId.value)
})
function getGenres(genre: string) {
  return genre
    .split(/[\/,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const genres = computed(() => {
  const allGenres = movies.value.flatMap((movie) => getGenres(movie.genre))

  return [...new Set(allGenres)].sort()
})

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.value.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(query) ||
      movie.genre.toLowerCase().includes(query) ||
      movie.description.toLowerCase().includes(query)

    const matchesCategory =
      selectedGenres.value.length === 0 ||
      getGenres(movie.genre).some((genre) =>
        selectedGenres.value.includes(genre),
      )

    const matchesSchedule =
      catalogMode.value === 'all' || movie.hasUpcomingSessions
    return matchesSearch && matchesCategory && matchesSchedule
  })
})

const moviePages = computed(() => {
  const pages: Movie[][] = []

  for (let i = 0; i < filteredMovies.value.length; i += 4) {
    pages.push(filteredMovies.value.slice(i, i + 4))
  }

  return pages
})

const availableWeeks = computed(() => {
  const weeks = sessions.value.map((session) =>
    getSessionWeekStart(session.date),
  )

  return [...new Set([currentWeek.value, ...weeks])].sort()
})

const filteredSessions = computed(() => {
  if (selectedDate.value) {
    return sessions.value.filter(
      (session) => session.date === selectedDate.value,
    )
  }

  if (selectedWeek.value === '') {
    return sessions.value
  }

  return sessions.value.filter(
    (session) => getSessionWeekStart(session.date) === selectedWeek.value,
  )
})

function scrollMovies(direction: number) {
  const track = moviesTrack.value
  if (!track || moviePages.value.length === 0) return

  const pageWidth = track.clientWidth
  if (pageWidth === 0) return

  const currentPage = Math.round(track.scrollLeft / pageWidth)
  const lastPage = moviePages.value.length - 1
  const nextPage = Math.max(0, Math.min(currentPage + direction, lastPage))

  track.scrollTo({
    left: nextPage * pageWidth,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  })
}

async function loadMovies() {
  loading.value = true
  error.value = ''

  try {
    movies.value = await getMovies()
    selectFeaturedMovies()
  } catch (err) {
    error.value = 'Could not load movies from the server.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function toggleSessions(movieId: number) {
  if (sessionsMovieId.value === movieId) {
    sessionsMovieId.value = null
    return
  }

  sessionsMovieId.value = movieId
  currentWeek.value = getSessionWeekStart(cinemaDate.format())
  selectWeek(currentWeek.value)
  sessions.value = []
  sessionsError.value = ''
  sessionsLoading.value = true

  try {
    const data = await getSessions(movieId)

    if (sessionsMovieId.value === movieId) {
      sessions.value = data
      const firstSession = data[0]
      if (
        firstSession &&
        !selectedDate.value &&
        selectedWeek.value === currentWeek.value
      ) {
        selectWeek(getSessionWeekStart(firstSession.date))
      }
    }
  } catch (err) {
    if (sessionsMovieId.value === movieId) {
      sessionsError.value = 'Could not load sessions.'
    }

    console.error(err)
  } finally {
    if (sessionsMovieId.value === movieId) {
      sessionsLoading.value = false
    }
  }
}

async function showFeaturedSessions(movieId: number) {
  // Reveal a movie even when the active search/category excludes it.
  if (!filteredMovies.value.some((movie) => movie.id === movieId)) {
    catalogMode.value = 'all'
    search.value = ''
    selectedGenres.value = []
  }
  if (sessionsMovieId.value !== movieId) void toggleSessions(movieId)
  await nextTick()
  const track = moviesTrack.value
  const index = filteredMovies.value.findIndex((movie) => movie.id === movieId)
  if (!track || index < 0) return

  track.scrollTo({
    left: Math.floor(index / 4) * track.clientWidth,
    behavior: 'instant',
  })
  const card = track.querySelector<HTMLElement>(`#movie-card-${movieId}`)
  card?.focus({ preventScroll: true })
  card?.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: 'instant',
  })
}
</script>

<template>
  <main>
    <h1 class="visually-hidden">BUBLIKI Cinema</h1>
    <section
      v-if="featuredMovie"
      class="featured-movie"
      aria-label="Featured movies"
      aria-roledescription="carousel"
      :style="{ '--slide-direction': featuredDirection }"
    >
      <Transition
        name="featured-motion"
        @after-enter="featuredMoving = false"
        @enter-cancelled="featuredMoving = false"
      >
        <div
          :key="featuredMovie.id"
          class="featured-slide"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${featuredIndex + 1} of ${featuredMovies.length}`"
        >
          <img
            v-if="getMovieBackdrop(featuredMovie)"
            class="featured-background"
            :src="getMovieBackdrop(featuredMovie) ?? undefined"
            :style="{ objectPosition: getMovieBackdropPosition(featuredMovie) }"
            alt=""
            fetchpriority="high"
          />
          <div class="featured-copy">
            <span class="featured-label">Featured movie</span>
            <h2 id="featured-title">{{ featuredMovie.title }}</h2>
            <p class="featured-meta">
              {{ featuredMovie.genre }} · {{ featuredMovie.duration }} min
            </p>
            <div class="featured-badges">
              <span>{{ featuredMovie.ageRating }}</span>
              <span>{{ featuredMovie.releaseYear }}</span>
            </div>
            <p class="featured-description">{{ featuredMovie.description }}</p>
          </div>
          <button
            type="button"
            class="featured-action"
            @click="showFeaturedSessions(featuredMovie.id)"
          >
            Show sessions
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </Transition>

      <template v-if="featuredMovies.length > 1">
        <button
          type="button"
          class="featured-arrow featured-arrow--previous"
          aria-label="Previous featured movie"
          @click="changeFeatured(-1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          class="featured-arrow featured-arrow--next"
          aria-label="Next featured movie"
          @click="changeFeatured(1)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
        <div
          class="featured-dots"
          role="group"
          aria-label="Choose featured movie"
        >
          <button
            v-for="(movie, index) in featuredMovies"
            :key="movie.id"
            type="button"
            class="featured-dot"
            :aria-label="`Show ${movie.title}`"
            :aria-pressed="featuredIndex === index"
            @click="goToFeatured(index)"
          >
            <span></span>
          </button>
        </div>
      </template>
      <p class="featured-status" role="status">
        {{ featuredIndex + 1 }} / {{ featuredMovies.length }} —
        {{ featuredMovie.title }}
      </p>
    </section>
    <section
      v-if="topMovies.length > 0"
      class="top-movies"
      aria-labelledby="top-movies-title"
    >
      <div class="top-movies-heading">
        <h2 id="top-movies-title">Top movies</h2>
        <span>Our picks</span>
        <div
          class="top-movies-controls"
          role="group"
          aria-label="Browse top movies"
        >
          <button
            type="button"
            aria-label="Previous top movie"
            aria-controls="top-movies-track"
            @click="scrollTopMovies(-1)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next top movie"
            aria-controls="top-movies-track"
            @click="scrollTopMovies(1)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        id="top-movies-track"
        ref="topMoviesTrack"
        class="top-movies-track"
        tabindex="0"
        role="region"
        aria-label="Top movies"
      >
        <article
          v-for="movie in topMovies"
          :key="movie.id"
          class="top-movie-card"
        >
          <div class="top-movie-image">
            <img
              v-if="getMovieBackdrop(movie)"
              :src="getMovieBackdrop(movie) ?? undefined"
              :style="{ objectPosition: getMovieBackdropPosition(movie) }"
              :alt="movie.title + ' scene'"
              loading="lazy"
            />
            <span v-else class="top-movie-placeholder">No poster</span>

            <span class="top-movie-rating">
              {{ movie.ageRating }}
            </span>
          </div>

          <div class="top-movie-info">
            <h3>
              <button
                type="button"
                class="top-movie-title"
                @click="showFeaturedSessions(movie.id)"
              >
                {{ movie.title }}
              </button>
            </h3>

            <p class="top-movie-director">{{ movie.director }}</p>
            <p>{{ movie.genre }}</p>
          </div>
        </article>
      </div>
    </section>
    <section class="catalog-heading" aria-labelledby="movies">
      <div>
        <p class="catalog-eyebrow">FIND YOUR NEXT FILM</p>
        <h2 id="movies" tabindex="-1">Explore the cinema</h2>
      </div>
      <div class="catalog-switch" role="group" aria-label="Movie availability">
        <button
          type="button"
          :aria-pressed="catalogMode === 'all'"
          @click="catalogMode = 'all'"
        >
          All movies <span>{{ movies.length }}</span>
        </button>
        <button
          type="button"
          :aria-pressed="catalogMode === 'now'"
          @click="catalogMode = 'now'"
        >
          <i class="now-dot" aria-hidden="true"></i>
          Now showing <span>{{ nowShowingCount }}</span>
        </button>
      </div>
    </section>

    <div class="movie-search">
      <label for="movie-search">Search movies:</label>
      <input
        id="movie-search"
        v-model="search"
        type="search"
        placeholder="Movie title or genre"
      />
    </div>
    <div
      v-if="!loading && !error"
      class="genre-filters"
      role="group"
      aria-label="Filter by genres"
    >
      <button
        type="button"
        class="genre-button"
        :aria-pressed="selectedGenres.length === 0"
        @click="selectedGenres = []"
      >
        All genres
      </button>

      <button
        v-for="genre in genres"
        :key="genre"
        type="button"
        class="genre-button"
        :aria-pressed="selectedGenres.includes(genre)"
        @click="toggleGenre(genre)"
      >
        {{ genre }}
      </button>
    </div>

    <p v-if="loading" role="status">Loading movies...</p>

    <p v-else-if="error" role="alert">
      {{ error }}
    </p>

    <p
      v-else-if="filteredMovies.length === 0"
      class="catalog-empty"
      role="status"
    >
      {{
        catalogMode === 'now'
          ? 'No upcoming screenings match your selection. Try other genres, clear the search, or choose All movies.'
          : 'No movies match your selection. Try other genres or clear the search.'
      }}
    </p>

    <div v-else class="movies-carousel">
      <button
        class="carousel-arrow"
        type="button"
        aria-label="Previous movies"
        aria-controls="movies-track"
        :disabled="moviePages.length <= 1"
        @click="scrollMovies(-1)"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>

      <div
        id="movies-track"
        :key="JSON.stringify([search, selectedGenres, catalogMode])"
        ref="moviesTrack"
        class="movies-grid"
        tabindex="0"
        role="region"
        aria-label="Movie catalogue"
      >
        <div
          v-for="(page, pageIndex) in moviePages"
          :key="pageIndex"
          class="movies-page"
        >
          <article
            v-for="movie in page"
            :key="movie.id"
            class="movie-card"
            :id="`movie-card-${movie.id}`"
            tabindex="-1"
            :class="{ 'movie-card--selected': sessionsMovieId === movie.id }"
          >
            <img
              v-if="movie.poster"
              :src="movie.poster"
              :alt="movie.title + ' poster'"
              class="movie-poster"
            />

            <div v-else class="movie-poster poster-placeholder">No poster</div>

            <h3>{{ movie.title }}</h3>
            <p class="movie-director">{{ movie.director }}</p>
            <p>{{ movie.genre }} · {{ movie.duration }} min</p>
            <p>{{ movie.description }}</p>
            <p>{{ movie.releaseYear }} · {{ movie.ageRating }}</p>

            <button
              class="sessions-toggle"
              type="button"
              :aria-expanded="sessionsMovieId === movie.id"
              @click="toggleSessions(movie.id)"
            >
              {{
                sessionsMovieId === movie.id ? 'Hide sessions' : 'Show sessions'
              }}
            </button>
          </article>
        </div>
      </div>

      <button
        class="carousel-arrow"
        type="button"
        aria-label="Next movies"
        aria-controls="movies-track"
        :disabled="moviePages.length <= 1"
        @click="scrollMovies(1)"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>
    <div
      v-if="sessionsMovie"
      role="region"
      aria-labelledby="movie-sessions-title"
      ref="sessionsPanel"
      class="movie-sessions"
      tabindex="-1"
    >
      <h4 id="movie-sessions-title">Sessions: {{ sessionsMovie.title }}</h4>

      <div class="session-dates" role="group" aria-label="Session weeks">
        <button
          type="button"
          :class="{
            'date-button--selected': !selectedDate && selectedWeek === '',
          }"
          :aria-pressed="!selectedDate && selectedWeek === ''"
          @click="selectWeek('')"
        >
          All weeks
        </button>
        <button
          v-for="week in availableWeeks"
          :key="week"
          type="button"
          :class="{
            'date-button--selected': !selectedDate && selectedWeek === week,
          }"
          :aria-pressed="!selectedDate && selectedWeek === week"
          @click="selectWeek(week)"
        >
          {{ formatSessionWeek(week) }}
        </button>
      </div>

      <label class="session-date-filter">
        Date:
        <input v-model="selectedDate" type="date" />
      </label>

      <p v-if="sessionsLoading" role="status">Loading sessions...</p>

      <p v-else-if="sessionsError" role="alert">
        {{ sessionsError }}
      </p>

      <p v-else-if="filteredSessions.length === 0">
        {{
          selectedDate
            ? 'No sessions available for this date.'
            : selectedWeek
              ? 'No sessions available for this week.'
              : 'No sessions available.'
        }}
      </p>

      <template v-else>
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="session-item"
        >
          <div class="session-time">
            <strong>{{ session.time }}</strong>

            <span>
              Until
              {{ getSessionEndTime(session.time, sessionsMovie.duration) }}
              <small v-if="endsNextDay(session.time, sessionsMovie.duration)">
                (next day)
              </small>
            </span>
          </div>

          <div class="session-info">
            <span>{{ formatSessionDate(session.date) }}</span>
            <span>{{ session.hallName }} · {{ session.format }}</span>
            <span>Language: {{ session.language }}</span>
            <span>Subtitles: {{ session.subtitles ?? 'Not specified' }}</span>
          </div>

          <RouterLink
            class="session-book"
            :to="{
              name: 'booking',
              params: { movieId: sessionsMovie.id },
              query: { sessionId: session.id },
            }"
          >
            Choose seats
          </RouterLink>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.genre-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
}

.genre-filters .genre-button {
  padding: 8px 16px;
  border: 1px solid #50505c;
  border-radius: 999px;
  background: #1c1c23;
  color: #c5c5cf;
  font-size: 14px;
  cursor: pointer;
}

.genre-filters .genre-button:hover {
  background: #30283f;
  border-color: #b6a0ff;
}

.genre-filters .genre-button[aria-pressed='true'] {
  background: #c4b5fd;
  border-color: #c4b5fd;
  color: #171320;
  box-shadow: 0 0 0 2px #c4b5fd26;
}

.genre-filters .genre-button[aria-pressed='true']:hover {
  background: #d4c8ff;
}

.featured-movie {
  position: relative;
  height: 560px;
  margin: 24px 0 40px;
  overflow: hidden;
  border: 1px solid #44364f;
  border-radius: 24px;
  background: #19141f;
}

.featured-slide {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 32px;
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  padding: 64px 76px 84px;
  background: radial-gradient(ellipse at 75% 40%, #392849, #141019 75%);
}

.featured-background {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 18%;
}

.featured-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, #100d16e6 0%, #100d16a6 45%, #100d1626 100%),
    linear-gradient(0deg, #100d16e6, transparent 70%);
}

.featured-copy {
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-wrap: anywhere;
  max-width: 620px;
}

.featured-label {
  display: inline-block;
  padding: 7px 12px;
  border: 1px solid #c4b5fd66;
  border-radius: 8px;
  background: #30233f;
  color: #dfd5ff;
  font-size: 13px;
  font-weight: 700;
}

.featured-copy h2 {
  margin: 20px 0 12px;
  color: #fff;
  font-size: clamp(32px, 5vw, 60px);
  line-height: 1.05;
  letter-spacing: -1px;
  overflow-wrap: anywhere;
}

.featured-meta {
  margin: 0 0 16px;
  color: #d4cddd;
  line-height: 1.5;
}

.featured-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.featured-badges span {
  padding: 6px 10px;
  border: 1px solid #ffffff40;
  border-radius: 8px;
  background: #15121bc9;
  color: #eeeaf4;
  font-size: 13px;
}

.featured-description {
  max-width: 52ch;
  margin: 0 0 24px;
  color: #e0d8ea;
  line-height: 1.6;
}

.featured-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 13px 22px;
  border: 1px solid #c4b5fd;
  border-radius: 12px;
  background: #c4b5fd;
  color: #20152f;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.featured-action:hover:not(:disabled) {
  background: #ded5ff;
}

@media (max-width: 600px) {
  .featured-movie {
    height: 600px;
    border-radius: 16px;
  }

  .featured-slide {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 16px;
    padding: 44px 48px 76px;
  }

  .featured-slide::before {
    background: linear-gradient(
      0deg,
      #100d16fa 0%,
      #100d16db 65%,
      #100d1680 100%
    );
  }

  .featured-background {
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    object-position: center 15%;
  }
}

.featured-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid #ffffff55;
  border-radius: 50%;
  background: #17131d99;
  color: #fff;
}

.featured-arrow--previous {
  left: 12px;
}

.featured-arrow--next {
  right: 12px;
}

.featured-arrow svg {
  width: 22px;
  height: 22px;
}

.featured-arrow:hover:not(:disabled) {
  background: #64527e;
  border-color: #c4b5fd;
}

.featured-dots {
  position: absolute;
  right: 76px;
  bottom: 24px;
  display: flex;
  gap: 4px;
}

.featured-dot {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
}

.featured-dot span {
  width: 8px;
  height: 8px;
  border: 1px solid #ddd5e8;
  border-radius: 50%;
}

.featured-dot[aria-pressed='true'] span {
  background: #c4b5fd;
  border-color: #c4b5fd;
}

.featured-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.featured-motion-enter-active,
.featured-motion-leave-active {
  transition: transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
}

.featured-motion-leave-active {
  pointer-events: none;
}

.featured-motion-enter-from {
  transform: translateX(calc(var(--slide-direction) * 100%));
}

.featured-motion-leave-to {
  transform: translateX(calc(var(--slide-direction) * -100%));
}

@media (max-width: 600px) {
  .featured-arrow {
    width: 32px;
    height: 40px;
  }

  .featured-arrow--previous {
    left: 6px;
  }

  .featured-arrow--next {
    right: 6px;
  }

  .featured-dots {
    right: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .featured-motion-enter-active,
  .featured-motion-leave-active {
    transition: none;
  }

  .featured-motion-enter-from,
  .featured-motion-leave-to {
    transform: none;
  }
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f2f3;
  font-family: Arial, sans-serif;
}

.movie-search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin: 48px 0 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #34303e;
}

.catalog-eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #b8a6d9;
}

.catalog-heading h2 {
  margin: 0;
  font-size: clamp(24px, 3vw, 32px);
}

.catalog-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  border: 1px solid #38313f;
  border-radius: 16px;
  background: #16121c;
}

.catalog-switch button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #b9b3c4;
  border-radius: 11px;
  font-size: 14px;
}

.catalog-switch button[aria-pressed='true'] {
  background: #c4b5fd;
  color: #20152f;
  border-color: #c4b5fd;
}

.catalog-switch button[aria-pressed='true']:hover {
  background: #ded5ff;
}

.catalog-switch button span {
  padding: 2px 7px;
  border-radius: 6px;
  background: #ffffff12;
  font-size: 12px;
}

.catalog-switch button[aria-pressed='true'] span {
  background: #20152f15;
}

.now-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #89e4bd;
}

.catalog-switch button[aria-pressed='true'] .now-dot {
  background: #226b4a;
}

.catalog-empty {
  padding: 32px;
  border: 1px dashed #51425f;
  border-radius: 16px;
  color: #c8c0d4;
  line-height: 1.6;
}

.movies-carousel {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 12px;
}

.movies-grid {
  display: flex;
  min-width: 0;
  align-items: stretch;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.movies-grid::-webkit-scrollbar {
  display: none;
}

.movies-page {
  box-sizing: border-box;
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 8px 8px 20px;
  scroll-snap-align: start;
}

.movie-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  background: #18181c;
  border: 1px solid #303036;
  border-radius: 12px;
  box-shadow: 0 8px 24px #0004;
  overflow-wrap: anywhere;
}

.movie-poster {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 8px;
}

.poster-placeholder {
  display: grid;
  place-items: center;
  background: #24242b;
  color: #a1a1ad;
}

.movie-card h3 {
  margin: 12px 0 6px;
  font-size: 18px;
  line-height: 1.25;
}

.movie-card p {
  margin: 0 0 8px;
  color: #d4d4da;
  font-size: 14px;
  line-height: 1.4;
}

.movie-card .movie-director {
  color: #a1a1ad;
}

button,
input {
  box-sizing: border-box;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: #f2f2f3;
  font: inherit;
}

input {
  min-width: 0;
  color-scheme: dark;
}

button {
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #353540;
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}

button:focus-visible,
input:focus-visible,
a:focus-visible,
.movies-grid:focus-visible {
  outline: 2px solid #b6a0ff;
  outline-offset: 3px;
}

.sessions-toggle {
  width: 100%;
  margin-top: auto;
  padding: 8px 10px;
  font-size: 14px;
}

.movie-sessions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #303036;
}

.movie-sessions h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.session-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.session-date-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.session-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 16px;
  background: #18181c;
  border: 1px solid #303036;
  border-radius: 10px;
}

.session-time,
.session-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-time {
  min-width: 150px;
}

.session-time strong {
  font-size: 26px;
}

.session-time > span {
  color: #a1a1ad;
  font-size: 14px;
}

.session-info {
  flex: 1;
}

.session-book {
  padding: 10px 18px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: #f2f2f3;
  text-decoration: none;
  text-align: center;
}

.session-book:hover {
  background: #353540;
}

.date-button--selected {
  background: #c4b5fd;
  border-color: #c4b5fd;
  color: #171320;
}

.date-button--selected:hover:not(:disabled) {
  background: #d4c8ff;
}

a {
  color: #c4b5fd;
}

.carousel-arrow {
  display: grid;
  place-items: center;
  width: 44px;
  height: 64px;
  padding: 0;
  border: 1px solid #41414c;
  border-radius: 14px;
  background: #1c1c23;
  color: #f2f2f3;
  box-shadow: 0 6px 20px #0005;
  transition:
    background 160ms,
    border-color 160ms,
    box-shadow 160ms;
}

.carousel-arrow svg {
  width: 24px;
  height: 24px;
}

.carousel-arrow:hover:not(:disabled) {
  background: #30283f;
  border-color: #b6a0ff;
  box-shadow: 0 0 16px #b6a0ff26;
}

.carousel-arrow:active:not(:disabled) {
  background: #443456;
}

@media (max-width: 900px) {
  .movies-page {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  main {
    padding: 12px;
  }

  .movies-carousel {
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 4px;
  }

  .carousel-arrow {
    width: 32px;
    height: 48px;
    border-radius: 10px;
  }

  .movies-page {
    gap: 12px;
  }
}

@media (max-width: 500px) {
  .movies-page {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .carousel-arrow {
    transition: none;
  }
}

.top-movies {
  margin: 40px 0;
}

.top-movies-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.top-movies-heading h2 {
  margin: 0;
}

.top-movies-heading span {
  color: #a1a1ad;
  font-size: 13px;
}

.top-movies-controls {
  display: flex;
  align-self: center;
  gap: 0;
  margin-left: auto;
}

.top-movies-controls button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 0;
}

.top-movies-controls button:first-child {
  border-radius: 10px 0 0 10px;
}

.top-movies-controls button:last-child {
  border-radius: 0 10px 10px 0;
  border-left: 0;
}

.top-movies-controls svg {
  width: 22px;
  height: 22px;
}

.movie-card--selected {
  border-color: #c4b5fd;
  box-shadow: inset 0 0 0 1px #c4b5fd;
}

.movie-card:focus-visible,
.top-movies-track:focus-visible {
  outline: 2px solid #c4b5fd;
  outline-offset: -3px;
}

.top-movies-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 40px) / 3);
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.top-movies-track::-webkit-scrollbar {
  display: none;
}

.top-movie-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #303036;
  border-radius: 14px;
  background: #18181c;
  scroll-snap-align: start;
}

.top-movie-image {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #24202d;
}

.top-movie-image img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center 20%;
}

.top-movie-placeholder {
  color: #a1a1ad;
}

.top-movie-rating {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 4px 7px;
  border: 1px solid #ffffff70;
  border-radius: 5px;
  background: #100d16cc;
  color: #fff;
  font-size: 13px;
}

.top-movie-info {
  padding: 18px;
  overflow-wrap: anywhere;
}

.top-movie-info h3 {
  margin: 0 0 14px;
}

.top-movie-title {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #f2f2f3;
  font-size: 19px;
  font-weight: 700;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.top-movie-title:hover:not(:disabled) {
  background: transparent;
  color: #c4b5fd;
}

.top-movie-info p {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.top-movie-director {
  color: #a1a1ad;
}

@media (max-width: 900px) {
  .top-movies-track {
    grid-auto-columns: calc((100% - 20px) / 2);
  }
}

@media (max-width: 550px) {
  .top-movies-track {
    grid-auto-columns: 85%;
  }
}
</style>
