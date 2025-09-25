import { Preset } from '@/app/types/general'
import startOfMonth from 'date-fns/startOfMonth'
import format from 'date-fns/format'

// INITIAL_DATE_FROM one month ago from now
const currentDate = new Date()
export const INITIAL_DATE_FROM = startOfMonth(currentDate)

export const INITIAL_DATE_TO = currentDate

export const INITIAL_PRESET = 'all'

export const PRESETS: Preset[] = [
  { name: 'today', label: 'Hoy' },
  { name: 'yesterday', label: 'Ayer' },
  { name: 'last7', label: 'Últimos 7 días' },
  { name: 'last14', label: 'Últimos 14 días' },
  { name: 'last30', label: 'Últimos 30 días' },
  { name: 'thisWeek', label: 'Esta semana' },
  { name: 'lastWeek', label: 'Semana anterior' },
  { name: 'thisMonth', label: 'Este mes' },
  { name: 'lastMonth', label: 'Mes anterior' },
  { name: INITIAL_PRESET, label: 'Histórico' }
]

export const PRESETS_EN: Preset[] = [
  { name: 'today', label: 'Today' },
  { name: 'yesterday', label: 'Yesterday' },
  { name: 'last7', label: 'Last 7 days' },
  { name: 'last14', label: 'Last 14 days' },
  { name: 'last30', label: 'Last 30 days' },
  { name: 'thisWeek', label: 'This week' },
  { name: 'lastWeek', label: 'Last week' },
  { name: 'thisMonth', label: 'This month' },
  { name: 'lastMonth', label: 'Last month' },
  { name: INITIAL_PRESET, label: 'Historical' }
]

type PastPresets = {
  [key: string]: string;
};

export const PAST_PRESETS: PastPresets = {
  Hoy: 'ayer',
  Ayer: 'anteayer',
  'Últimos 7 días': 'semana anterior',
  'Últimos 14 días': 'últimos 14 días anteriores',
  'Esta semana': 'la semana anterior',
  'Semana anterior': 'la semana anterior a esa',
  'Este mes': 'el mes pasado',
  'Mes anterior': 'el mes anterior a ese'
}

export const PAST_PRESETS_EN: PastPresets = {
  Today: 'yesterday',
  Yesterday: 'the day before yesterday',
  'Last 7 days': 'last week',
  'Last 14 days': 'last 14 days previous',
  'This week': 'last week',
  'Last week': 'the week before that',
  'This month': 'last month',
  'Last month': 'the month before that'
}

export const formatDate = (date: Date, dateFormat = 'dd/MM/yyyy') => format(date, dateFormat)