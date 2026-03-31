const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getWeekStart(date = new Date()) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  return formatDate(value)
}

export function getWeekDays(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`)

  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(start)
    value.setDate(value.getDate() + index)
    return {
      date: formatDate(value),
      dayShort: DAY_SHORT[value.getDay()],
      dayNum: value.getDate(),
      dayName: DAY_NAMES[value.getDay()],
      isToday: formatDate(value) === formatDate(new Date()),
    }
  })
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateDisplay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`
}

export function formatWeekRange(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} - ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
}

export function getToday() {
  return formatDate(new Date())
}

export function shiftWeek(weekStart, delta) {
  const value = new Date(`${weekStart}T00:00:00`)
  value.setDate(value.getDate() + delta * 7)
  return formatDate(value)
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 4 && month <= 9) return 'summer'
  return 'winter'
}
