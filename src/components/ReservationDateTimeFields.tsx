import type { ChangeEvent } from 'react'

import { TIME_HOURS, TIME_MINUTES, TIME_PERIODS, type ReservationTimeParts } from '../types/reservationTime'

type ReservationDateTimeFieldsProps = {
  label: string
  value: ReservationTimeParts
  onChange: (value: ReservationTimeParts) => void
}

export const ReservationDateTimeFields = ({ label, value, onChange }: ReservationDateTimeFieldsProps) => {
  const update = (field: keyof ReservationTimeParts) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...value, [field]: event.target.value })
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-[#1D1D1B]">{label} <span className="text-red-600">*</span></legend>
      <input required type="date" value={value.date} onChange={update('date')} aria-label={`${label} fecha`} className="w-full rounded-lg border border-gray-200 px-3 py-3 font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30" />
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs font-bold text-gray-500">Hora
          <select required value={value.hour} onChange={update('hour')} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-3 text-sm font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
            {TIME_HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-gray-500">Minutos
          <select required value={value.minute} onChange={update('minute')} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-3 text-sm font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
            {TIME_MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-gray-500">AM/PM
          <select required value={value.period} onChange={update('period')} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-3 text-sm font-normal outline-none focus:border-[#1F8240] focus:ring-2 focus:ring-[#76B82A]/30">
            {TIME_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  )
}