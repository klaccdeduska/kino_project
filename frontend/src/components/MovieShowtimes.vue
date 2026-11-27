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
    role="region"
    aria-labelledby="movie-sessions-title"
    class="movie-sessions"
  >
    <h2 id="movie-sessions-title">Showtimes</h2>

    <div v-if="sessions.length" class="session-dates" role="group" aria-label="Session weeks">
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

    <label v-if="sessions.length" class="session-date-filter">
      Date:
      <input v-model="selectedDate" type="date" />
    </label>

    <p v-if="sessionsLoading" role="status">Loading sessions...</p>

    <p v-else-if="sessionsError" role="alert">
      Could not load showtimes. Refresh to try again.
    </p>

    <p v-else-if="filteredSessions.length === 0">
      {{
        selectedDate
          ? 'No sessions available for this date.'
          : selectedWeek
            ? 'No sessions available for this week.'
            : 'No upcoming showtimes for this movie.'
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
  padding-top: 12px;
  border-top: 1px solid #303036;
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

.session-dates button,
.session-date-filter input {
  padding: 8px 12px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: inherit;
  font: inherit;
}
.session-dates button { cursor: pointer; }
.session-dates .date-button--selected { background: #c4b5fd; color: #171320; }
.session-dates .date-button--selected:hover { background: #d4c8ff; }
</style>
