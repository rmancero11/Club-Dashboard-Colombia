import { z } from 'zod'
import { Origins } from '@/app/types/feedback'

//   Origins is an enum, use each value as a key and use the same shape as marketing
const origins = Object.keys(Origins) as (keyof typeof Origins)[]

const socialChanels = origins.reduce((acc, key) => {
  return {
    ...acc,
    [key]: z.number().min(0, {
      message: 'El valor debe ser mayor a 0'
    })
  }
}
, {} as Record<Origins, z.ZodNumber>)

export const roiCalcSchema = () => z.object({
  marketing: z.number().min(0, {
    message: 'El valor debe ser mayor a 0'
  }),
  ...socialChanels
})

export type RoiCalcSchemaProps = z.infer<ReturnType<typeof roiCalcSchema>>;

type FilteredOrigins = Omit<RoiCalcSchemaProps, 'Referred' | 'New client' | 'Nouvelle cliente' | 'Référé'>

export const DEFAULT_VALUES: FilteredOrigins = {
  marketing: 0,
  Maps: 0,
  TikTok: 0,
  Facebook: 0,
  WhatsApp: 0,
  Instagram: 0,
  Referido: 0,
  'Cliente nuevo': 0
}