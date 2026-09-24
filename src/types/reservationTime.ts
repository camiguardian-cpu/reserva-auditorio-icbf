export const TIME_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
export const TIME_MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
export const TIME_PERIODS = ['AM', 'PM'] as const

export type TimePeriod = typeof TIME_PERIODS[number]

export type ReservationTimeParts = {
  date: string
  hour: string
  minute: string
  period: TimePeriod
}

export const emptyReservationTime: ReservationTimeParts = {
  date: '',
  hour: '08',
  minute: '00',
  period: 'AM',
}

export const dateToReservationTime = (date: Date | null): ReservationTimeParts => {
  if (!date) {
    return emptyReservationTime
  }

  const hours = date.getHours()
  const period: TimePeriod = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  const pad = (value: number) => String(value).padStart(2, '0')

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    hour: pad(hour),
    minute: pad(Math.floor(date.getMinutes() / 5) * 5),
    period,
  }
}

export const reservationTimeToDate = (value: ReservationTimeParts): Date | null => {
  if (!value.date || !value.hour || !value.minute) {
    return null
  }

  let hours = Number(value.hour) % 12
  if (value.period === 'PM') {
    hours += 12
  }

  const date = new Date(`${value.date}T${String(hours).padStart(2, '0')}:${value.minute}:00`)
  return Number.isNaN(date.getTime()) ? null : date
}