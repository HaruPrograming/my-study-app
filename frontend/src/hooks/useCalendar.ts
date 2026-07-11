export function useCalendar(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const pad = (n: number) => String(n).padStart(2, '0')
  const toKey = (day: number) => `${year}-${pad(month)}-${pad(day)}`

  return { blanks, days, toKey }
}
