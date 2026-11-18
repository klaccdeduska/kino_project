export function formatSessionDate(date: string) {
  const [year, month, day] = date.split('-')

  return `${day}.${month}.${year}`
}

export function getSessionWeekStart(date: string) {
  const monday = new Date(`${date}T00:00:00Z`)
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
  return monday.toISOString().slice(0, 10)
}

export function formatSessionWeek(start: string) {
  const sunday = new Date(`${start}T00:00:00Z`)
  sunday.setUTCDate(sunday.getUTCDate() + 6)
  return `${formatSessionDate(start)} – ${formatSessionDate(sunday.toISOString().slice(0, 10))}`
}

export function getSessionEndTime(time: string, duration: number) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  const endMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(endMinutes / 60) % 24
  const remainingMinutes = endMinutes % 60

  return `${String(endHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

export function endsNextDay(time: string, duration: number) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  return hours * 60 + minutes + duration >= 24 * 60
}
