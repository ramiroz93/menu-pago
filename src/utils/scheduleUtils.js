const DAYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const DAY_LABELS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

export function isRestaurantOpen(restaurant) {
  if (!restaurant.schedule) return restaurant.is_open ?? false
  if (restaurant.is_open === false) return false

  const bolivia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }))
  const daySchedule = restaurant.schedule[DAYS[bolivia.getDay()]]

  if (!daySchedule) return false

  const current = bolivia.getHours() * 60 + bolivia.getMinutes()
  const shifts = Array.isArray(daySchedule) ? daySchedule : [daySchedule]

  return shifts.some((shift) => {
    const [openH, openM] = shift.open.split(':').map(Number)
    const [closeH, closeM] = shift.close.split(':').map(Number)
    return current >= openH * 60 + openM && current < closeH * 60 + closeM
  })
}

// Returns { text, soon } when closed, or null when open / no schedule
export function getNextOpenInfo(restaurant) {
  if (!restaurant.schedule) return null

  const bolivia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }))
  const currentMinutes = bolivia.getHours() * 60 + bolivia.getMinutes()
  const todayIdx = bolivia.getDay()

  for (let d = 0; d < 7; d++) {
    const dayIdx = (todayIdx + d) % 7
    const daySchedule = restaurant.schedule[DAYS[dayIdx]]
    if (!daySchedule) continue

    const shifts = (Array.isArray(daySchedule) ? daySchedule : [daySchedule])
      .slice()
      .sort((a, b) => toMin(a.open) - toMin(b.open))

    for (const shift of shifts) {
      const openMin = toMin(shift.open)
      if (d === 0 && openMin <= currentMinutes) continue // turno ya pasó hoy

      const minutesUntil = d === 0 ? openMin - currentMinutes : null
      const soon = minutesUntil !== null && minutesUntil <= 60

      if (d === 0) return { text: `Abre hoy a las ${shift.open}`, soon }
      if (d === 1) return { text: `Abre mañana a las ${shift.open}`, soon: false }
      return { text: `Abre el ${DAY_LABELS[dayIdx]} a las ${shift.open}`, soon: false }
    }
  }

  return null
}
