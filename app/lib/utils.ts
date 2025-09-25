import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_VITE_APP_DOMAIN

export const generateRestaurantURL = (businessId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}`
  return url
}

export const generateWaiterURL = (businessId: string, waiterId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}&mesero=${waiterId}`
  return url
}

export const generateRestaurantSucursalURL = (businessId: string, sucursalId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}&sucursal=${sucursalId}`
  return url
}

export const generateWaiterBySucursalURL = (businessId: string, sucursalId: string, waiterId: string) => {
  const url = `${APP_DOMAIN}?id=${businessId}&sucursal=${sucursalId}&mesero=${waiterId}`
  return url
}

export const cleanString = (inputString: string): string => {
  if (!inputString) return ''
  const cleanedString = inputString?.replace(/\s+/g, '')?.toLocaleLowerCase()
  const normalizedString = cleanedString.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '')
  return normalizedString
}

