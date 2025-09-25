import { waitersService } from '@/app/services/waiters'
import useSWR from 'swr'

export const useGetWaitersByBusiness = ({ businessId }: { businessId: string }) => {
  const response = useSWR(businessId ? `/waiters/${businessId}` : null, () =>
    waitersService.getWaitersByBusiness({ businessId })
  )
  return response
}

export const useGetWaitersBySucursales = ({ businessId }: { businessId: string }) => {
  const response = useSWR(businessId ? `/waiters/sucursales/${businessId}` : null, () =>
    waitersService.getWaitersBySucursales({ businessId })
  )
  return response
}
