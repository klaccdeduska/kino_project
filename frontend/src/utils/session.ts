export function formatSessionDate(date: string) {
  const [year, month, day] = date.split('-')

  return `${day}.${month}.${year}`
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
