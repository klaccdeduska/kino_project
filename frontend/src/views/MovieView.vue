<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiError, getMovie, type Movie } from '../api'
import MovieShowtimes from '../components/MovieShowtimes.vue'
import movieBackdrops from '../data/movieBackdrops.json'
import movieBanners from '../data/movieBanners.json'
import movieSynopses from '../data/movieSynopses.json'
import movieMedia from '../data/movieMedia.json'

type MovieMedia = { trailerId: string; sourcePage: string; frames: { src: string }[] }
const mediaByTitle: Record<string, MovieMedia> = movieMedia

const props = defineProps<{ movieId: string }>()
const movie = ref<Movie | null>(null)
const synopses: Record<string, string> = movieSynopses
const synopsis = computed(() =>
  movie.value ? synopses[movie.value.title] ?? movie.value.description : '',
)
const status = ref<'loading' | 'missing' | 'error' | 'ready'>('loading')
const backdrops: Record<string, { src: string; position: string }> = movieBackdrops
const backdrop = computed(() => (movie.value ? backdrops[movie.value.title] : undefined))
const banners: Record<string, { src: string; width?: number; height?: number }> = movieBanners
const banner = computed(() =>
  movie.value ? banners[movie.value.title] ?? (backdrop.value && { src: backdrop.value.src }) : undefined,
)
const media = computed(() => (movie.value ? mediaByTitle[movie.value.title] : undefined))
const mediaDialog = ref<HTMLDialogElement | null>(null)
const openMedia = ref<'trailer' | number | null>(null)
const trailerLoading = ref(false)
const trailerUrl = computed(() => {
  const source = movie.value?.trailer
  const fallback = media.value ? `https://www.youtube.com/watch?v=${media.value.trailerId}` : null
  if (!source) return fallback
  try {
    const url = new URL(source)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback
  } catch {
    return fallback
  }
})

const trailerEmbed = computed(() => {
  if (!trailerUrl.value) return null
  const url = new URL(trailerUrl.value)
  const id = url.hostname === 'youtu.be'
    ? url.pathname.slice(1)
    : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)
      ? url.searchParams.get('v') ?? url.pathname.match(/^\/embed\/([^/]+)$/)?.[1]
      : null
  return id && /^[\w-]{11}$/.test(id)
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
    : null
})

const currentFrame = computed(() =>
  typeof openMedia.value === 'number' ? media.value?.frames[openMedia.value] : undefined,
)
const pictureNumber = computed(() =>
  typeof openMedia.value === 'number' ? openMedia.value + 1 : 0,
)

function movePicture(direction: number) {
  const count = media.value?.frames.length ?? 0
  if (typeof openMedia.value !== 'number' || count < 2) return
  openMedia.value = (openMedia.value + direction + count) % count
}

function handleGalleryKeys(event: KeyboardEvent) {
  if (!currentFrame.value || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
  event.preventDefault()
  movePicture(event.key === 'ArrowLeft' ? -1 : 1)
}

function clickedBackdrop(event: PointerEvent) {
  const dialog = mediaDialog.value
  if (!dialog || event.target !== dialog) return false
  const rect = dialog.getBoundingClientRect()
  return event.clientX < rect.left || event.clientX >= rect.right ||
    event.clientY < rect.top || event.clientY >= rect.bottom
}

let pointerStartedOutside = false
function rememberPointer(event: PointerEvent) {
  pointerStartedOutside = clickedBackdrop(event)
}

function closeFromBackdrop(event: PointerEvent) {
  if (pointerStartedOutside && clickedBackdrop(event)) mediaDialog.value?.close()
  pointerStartedOutside = false
}

function showMedia(item: 'trailer' | number) {
  if (!mediaDialog.value) return
  trailerLoading.value = item === 'trailer' && Boolean(trailerEmbed.value)
  openMedia.value = item
  mediaDialog.value.showModal()
}

function jumpToShowtimes(event: MouseEvent) {
  const target = document.getElementById('sessions')
  if (!target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  target.focus({ preventScroll: true })
  target.scrollIntoView({
    block: 'start',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}

watch(
  () => props.movieId,
  async (id, _previous, onCleanup) => {
    let current = true
    onCleanup(() => { current = false })
    mediaDialog.value?.close()
    openMedia.value = null
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
    <div v-if="banner" class="movie-banner">
      <img class="movie-banner-ambient" :src="banner.src" alt="" aria-hidden="true" />
      <img class="movie-banner-art" :src="banner.src" :width="banner.width ?? 1920" :height="banner.height ?? 640" alt="" />
    </div>

    <div class="movie-container">
      <nav class="movie-navigation" aria-label="Movie page">
        <RouterLink :to="{ name: 'movies' }">← All movies</RouterLink>
        <a v-if="movie" href="#sessions" @click="jumpToShowtimes">Showtimes <span aria-hidden="true">↓</span></a>
      </nav>

      <p v-if="status === 'loading'" role="status">Loading movie…</p>
      <h1 v-else-if="status === 'missing'">Movie not found</h1>
      <p v-else-if="status === 'error'" role="alert">Could not load the movie. Refresh to try again.</p>
      <template v-else-if="movie">
        <section class="movie-overview" :class="{ 'has-media': media || movie.poster || trailerUrl }" aria-labelledby="movie-title">
          <div v-if="media || movie.poster || trailerUrl" class="movie-media">
            <button v-if="trailerUrl" type="button" class="movie-trailer" @click="showMedia('trailer')">
              <img v-if="backdrop || movie.poster" :src="backdrop?.src ?? movie.poster ?? undefined" alt="" />
              <span class="trailer-play" aria-hidden="true">▶</span>
              <span class="trailer-label">Watch trailer</span>
            </button>
            <img v-else-if="movie.poster" class="movie-poster" :src="movie.poster" :alt="`${movie.title} poster`" />
            <div v-if="media?.frames.length" class="movie-frames" role="group" aria-label="Film stills">
              <button
                v-for="(frame, index) in media.frames"
                :key="frame.src"
                type="button"
                :aria-label="`Enlarge film still ${index + 1}`"
                @click="showMedia(index)"
              >
                <img :src="frame.src" alt="" loading="lazy" width="1280" height="720" />
              </button>
            </div>
          </div>
          <div class="movie-copy">
            <p class="movie-year">{{ movie.releaseYear }} <span>{{ movie.ageRating }}</span></p>
            <h1 id="movie-title">{{ movie.title }}</h1>
            <dl class="movie-meta">
              <div><dt>Genre</dt><dd>{{ movie.genre }}</dd></div>
              <div><dt>Director</dt><dd>{{ movie.director }}</dd></div>
              <div><dt>Runtime</dt><dd>{{ movie.duration }} min</dd></div>
            </dl>
            <p class="movie-description">{{ synopsis }}</p>
          </div>
        </section>
        <MovieShowtimes :movie-id="movie.id" :duration="movie.duration" />
        <dialog ref="mediaDialog" class="media-dialog" aria-labelledby="media-title"
          @close="openMedia = null" @keydown="handleGalleryKeys"
          @pointerdown="rememberPointer" @pointerup="closeFromBackdrop">
          <header>
            <h2 id="media-title">{{ openMedia === 'trailer' ? `Trailer · ${movie.title}` : `Picture ${pictureNumber}` }}</h2>
            <form method="dialog"><button type="submit" autofocus aria-label="Close">✕</button></form>
          </header>
          <template v-if="openMedia === 'trailer' && trailerUrl">
            <div v-if="trailerEmbed" class="trailer-player" :aria-busy="trailerLoading">
              <iframe
                :src="trailerEmbed"
                :title="`${movie.title} trailer`"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowfullscreen
                @load="trailerLoading = false"
              ></iframe>
            </div>
            <p v-if="trailerLoading" class="trailer-loading" role="status">Loading trailer…</p>
            <a class="trailer-source trailer-external" :href="trailerUrl" target="_blank" rel="noopener noreferrer">
              {{ trailerEmbed ? 'Watch on YouTube ↗' : 'Open trailer in a new tab ↗' }}
            </a>
          </template>
          <template v-else-if="currentFrame">
            <img :src="currentFrame.src" :alt="`Picture ${pictureNumber} from ${movie.title}`" />
            <div v-if="media" class="gallery-footer">
              <a class="trailer-source" :href="media.sourcePage" target="_blank" rel="noopener noreferrer">Image source ↗</a>
              <div v-if="media.frames.length > 1" class="gallery-controls" role="group" aria-label="Gallery navigation">
                <button type="button" aria-label="Previous picture" @click="movePicture(-1)">‹</button>
                <span aria-live="polite">{{ pictureNumber }} / {{ media.frames.length }}</span>
                <button type="button" aria-label="Next picture" @click="movePicture(1)">›</button>
              </div>
            </div>
          </template>
        </dialog>
      </template>
    </div>
  </main>
</template>

<style scoped>
.movie-page {
  background: #0d0d0f;
}

.movie-banner {
  position: relative;
  isolation: isolate;
  height: min(36vw, 520px);
  overflow: hidden;
  background: #0d0d0f;
}

.movie-banner img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.movie-banner-ambient {
  object-fit: cover;
  filter: blur(28px) brightness(.42) saturate(.8);
  transform: scale(1.08);
}

.movie-banner .movie-banner-art {
  object-fit: contain;
  mask-image: linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent);
  /* Fade the edges of the artwork itself, including when it is letterboxed. */
  width: auto;
  max-width: 100%;
  margin-inline: auto;
}

.movie-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, #0d0d0f, transparent 22%),
    radial-gradient(ellipse at 50% 44%, transparent 42%, #0d0d0f99 100%);
  pointer-events: none;
}

@media (max-width: 640px) {
  .movie-banner { height: 56.25vw; }
}

.movie-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 40px) 48px;
}

.movie-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid #38313f;
}

.movie-navigation a,
.trailer-source {
  color: #d5c7ff;
  font-weight: 700;
  text-decoration: none;
}

.trailer-player {
  background: #0d0d0f;
  border-radius: 8px;
}

.trailer-loading { margin: 12px 0 0; color: #c8c0d4; }
.trailer-external {
  padding: 8px 12px;
  border: 1px solid #615472;
  border-radius: 8px;
}

.movie-navigation a:hover,
.trailer-source:hover {
  color: #f2ecff;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.movie-navigation span {
  margin-left: 4px;
}

.movie-overview {
  display: grid;
  gap: clamp(24px, 5vw, 64px);
  margin: clamp(24px, 4vw, 48px) 0;
}

.movie-overview.has-media {
  grid-template-columns: minmax(180px, 0.85fr) minmax(0, 1.15fr);
}

.movie-media {
  display: grid;
  align-self: start;
  min-width: 0;
  gap: 12px;
}

.movie-poster {
  display: block;
  width: min(100%, 172px);
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 12px 26px #0008;
}

.movie-trailer,
.movie-frames button {
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid #494052;
  border-radius: 12px;
  background: #221a2d;
  color: #fff;
  cursor: pointer;
}

.movie-trailer { aspect-ratio: 16 / 9; }
.movie-trailer img,
.movie-frames img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.movie-trailer img { filter: brightness(.72); }
.trailer-play {
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid #d5c7ff;
  border-radius: 50%;
  background: #17131ddd;
}
.movie-trailer:hover .trailer-play { background: #533b70; }
.trailer-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  border-radius: 6px;
  padding: 6px 9px;
  background: #17131ddd;
  font-weight: 700;
}
.movie-frames {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.movie-frames button { aspect-ratio: 16 / 9; }
.movie-frames button:hover, .movie-trailer:hover { border-color: #c4b5fd; }
.media-dialog {
  width: min(960px, calc(100% - 24px));
  max-height: calc(100% - 24px);
  padding: clamp(12px, 3vw, 24px);
  border: 1px solid #615472;
  border-radius: 16px;
  background: #19141f;
  color: #f2f2f3;
}
.media-dialog::backdrop { background: #0d0a11df; }
.media-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.media-dialog h2 { margin: 0; font-size: clamp(16px, 3vw, 22px); }
.media-dialog header button,
.gallery-controls button {
  width: 40px;
  height: 40px;
  border: 1px solid #615472;
  border-radius: 8px;
  background: #272030;
  color: inherit;
  cursor: pointer;
}
.gallery-footer, .gallery-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.gallery-footer {
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 12px;
}
.gallery-footer .trailer-source { margin-top: 0; }
.gallery-controls button { font-size: 24px; }
.gallery-controls button:hover { background: #46325c; }
.media-dialog iframe, .media-dialog > img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: 8px;
}
.trailer-source {
  display: inline-block;
  margin-top: 12px;
}

.movie-copy {
  overflow-wrap: anywhere;
}

.movie-year {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 12px;
  color: #c8c0d4;
  font-size: 14px;
}

.movie-year span {
  padding: 3px 7px;
  border: 1px solid #615472;
  border-radius: 6px;
  color: #e9dfff;
}

.movie-copy h1 {
  margin: 0;
  font-size: clamp(30px, 4.5vw, 54px);
  line-height: 1.08;
}

.movie-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin: 24px 0;
}

.movie-meta div:first-child {
  grid-column: 1 / -1;
}

.movie-meta dt {
  margin-bottom: 5px;
  color: #b7a8c7;
  font-size: 13px;
}

.movie-meta dd {
  margin: 0;
  line-height: 1.4;
}

.movie-description {
  max-width: 62ch;
  margin: 0;
  color: #dfd8e8;
  line-height: 1.65;
}

@media (max-width: 640px) {
  .movie-overview.has-media { grid-template-columns: minmax(0, 1fr); }
  .movie-copy { grid-row: 1; }
}
</style>
