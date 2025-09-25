import { useContext } from 'react'
import { BusinessContext } from '@/app/context/BusinessContext'

export const useFilteredBusinessData = () => {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useFilteredBusinessData debe ser usado dentro de un BusinessProvider')
  }
  return context
}
