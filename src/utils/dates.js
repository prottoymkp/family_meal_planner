const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}

export function getWeekDays(weekStart) {
  const start = new Date(weekStart + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return {
      date: formatDate(d),
      dayShort: DAY_SHORT[d.getDay()],
      dayNum: d.getDate(),
      dayName: DAY_NAMES[d.getDay()],
      isToday: formatDate(d) === formatDate(new Date()),
    }
  })
}

export function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function formatWeekRange(weekStart) {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} — ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
}

export function getToday() {
  return formatDate(new Date())
}
