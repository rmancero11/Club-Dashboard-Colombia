import { Origins } from '@/app/types/feedback'

const QIK_ROI_ORIGINS = ['Maps', 'Referido', 'Cliente nuevo']

const DEFAULT_INVESTMENT_VALUES = {
  marketing: 0,
  [Origins.Maps]: 0,
  [Origins.TikTok]: 0,
  [Origins.Facebook]: 0,
  [Origins.WhatsApp]: 0,
  [Origins.Instagram]: 0,
  [Origins.Referido]: 0,
  [Origins.Referred]: 0,
  [Origins['Référé']]: 0,
  [Origins.ClienteNuevo]: 0,
  [Origins['New client']]: 0,
  [Origins['Nouvelle cliente']]: 0
}

export { DEFAULT_INVESTMENT_VALUES, QIK_ROI_ORIGINS }
