<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getSessions, type Session } from '../api'
import {
  endsNextDay,
  formatSessionDate,
  formatSessionWeek,
  getSessionEndTime,
  getSessionWeekStart,
} from '../utils/session'

const props = defineProps<{ movieId: number; duration: number }>()
const sessions = ref<Session[]>([])
const sessionsLoading = ref(true)
const sessionsError = ref(false)
const selectedWeek = ref('')
const selectedDate = ref('')

function selectWeek(week: string) {
  selectedWeek.value = week
  selectedDate.value = ''
}

const availableWeeks = computed(() =>
  [...new Set(sessions.value.map((session) => getSessionWeekStart(session.date)))].sort(),
)

const availableDates = computed(() =>
  [...new Set(sessions.value
    .filter((session) => !selectedWeek.value || getSessionWeekStart(session.date) === selectedWeek.value)
    .map((session) => session.date))].sort(),
)

const weekday = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' })

function formatDay(date: string) {
  return weekday.format(new Date(date + 'T00:00:00Z'))
}

const filteredSessions = computed(() => {
  if (selectedDate.value) {
    return sessions.value.filter((session) => session.date === selectedDate.value)
  }
  return sessions.value.filter(
    (session) => !selectedWeek.value || getSessionWeekStart(session.date) === selectedWeek.value,
  )
})

watch(
  () => props.movieId,
  async (id, _previous, onCleanup) => {
    let current = true
    onCleanup(() => { current = false })
    sessions.value = []
    selectWeek('')
    sessionsLoading.value = true
    sessionsError.value = false

    try {
      const result = await getSessions(id)
      if (current) sessions.value = result
    } catch {
      if (current) sessionsError.value = true
    } finally {
      if (current) sessionsLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <section
    id="sessions"
    tabindex="-1"
    role="region"
    aria-labelledby="movie-sessions-title"
    class="movie-sessions"
  >
    <h2 id="movie-sessions-title">Showtimes</h2>

    <div v-if="sessions.length" class="session-dates" role="group" aria-label="Session weeks">
      <button
        type="button"
        :aria-pressed="selectedWeek === ''"
        @click="selectWeek('')"
      >
        All weeks
      </button>
      <button
        v-for="week in availableWeeks"
        :key="week"
        type="button"
        :aria-pressed="selectedWeek === week"
        @click="selectWeek(week)"
      >
        {{ formatSessionWeek(week) }}
      </button>
    </div>

    <div v-if="sessions.length" class="session-days" role="group" aria-label="Screening dates">
      <button type="button" :aria-pressed="selectedDate === ''" @click="selectedDate = ''">
        All dates
      </button>
      <button
        v-for="date in availableDates"
        :key="date"
        type="button"
        :aria-pressed="selectedDate === date"
        @click="selectedDate = date"
      >
        <strong>{{ formatDay(date) }}</strong>
        <span>{{ formatSessionDate(date) }}</span>
      </button>
    </div>

    <p v-if="sessionsLoading" role="status">Loading sessions...</p>

    <p v-else-if="sessionsError" role="alert">
      Could not load showtimes. Refresh to try again.
    </p>

    <div v-else-if="!sessions.length" class="schedule-empty">
      <h3>No upcoming showtimes</h3>
      <p>There are no screenings scheduled for this film.</p>
      <RouterLink class="session-book" :to="{ name: 'movies' }">
        Browse movies
      </RouterLink>
    </div>

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
            {{ getSessionEndTime(session.time, duration) }}
            <small v-if="endsNextDay(session.time, duration)">
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
            params: { movieId: movieId },
            query: { sessionId: session.id },
          }"
        >
          Choose seats
        </RouterLink>
      </div>
    </template>
  </section>
</template>

<style scoped>
.movie-sessions {
  margin-top: 32px;
  padding: clamp(16px, 3vw, 28px);
  border: 1px solid #38313f;
  border-radius: 20px;
  background: #15121a;
  scroll-margin-top: 16px;
}

.movie-sessions h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.session-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.session-days {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 4px 12px;
}

.session-days button {
  display: grid;
  place-content: center;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 96px;
  min-height: 60px;
}

.session-days span { font-size: 12px; }
.schedule-empty {
  padding: 24px;
  border: 1px dashed #51425f;
  border-radius: 14px;
}
.schedule-empty h3 { margin: 0; }
.schedule-empty p { color: #c8c0d4; margin: 8px 0 18px; }

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
  display: inline-block;
  padding: 10px 18px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #c4b5fd;
  color: #20152f;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
}

.session-book:hover {
  background: #ded5ff;
}

.session-dates button,
.session-days button {
  padding: 8px 12px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.movie-sessions button[aria-pressed="true"] {
  background: #c4b5fd;
  color: #171320;
}
</style>
