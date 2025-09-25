import { getFirebase } from '@/app/lib/firebase'
import { DASHBOARD_COLLECTION_NAME } from '@/app/constants/general'
import { collection, doc, getDocs } from 'firebase/firestore'

class WaitersService {
  getWaitersByBusiness = async ({ businessId }: { businessId: string }) => {
    const businessDocRef = doc(getFirebase()?.db, DASHBOARD_COLLECTION_NAME, businessId)
    const waiters = await getDocs(collection(businessDocRef, 'meseros'))
    const result = waiters?.docs?.map((item) => {
      const data = item?.data()
      const waiter = {
        id: item?.id,
        ...data
      }
      return waiter
    })
    // eslint-disable-next-line no-undef
    return result as WaiterI[]
  }

  getWaitersBySucursales = async ({ businessId }: { businessId: string }) => {
    const businessDocRef = doc(getFirebase()?.db, DASHBOARD_COLLECTION_NAME, businessId)
    const sucursalesDocRef = collection(businessDocRef, 'sucursales')
    const sucursalesSnapshot = await getDocs(sucursalesDocRef)

    // eslint-disable-next-line no-undef
    const waiters: Record<string, WaiterSucursalI[]> = {}
    sucursalesSnapshot?.docs?.forEach(async (sucursal) => {
      const sucursalId = sucursal?.id as string
      const sucursalData = sucursal?.data()
      const waitersRef = collection(sucursal?.ref, 'meseros')
      const waitersSucursalSnapshot = await getDocs(waitersRef)
      const waitersSucursal = waitersSucursalSnapshot?.docs?.map((item) => {
        return {
          id: item.id,
          sucursalId,
          sucursal: sucursalData,
          ...item?.data()
        }
      })

      // eslint-disable-next-line no-undef
      waiters[sucursalId] = waitersSucursal as unknown as WaiterSucursalI[]
    })

    return waiters
  }
}

export const waitersService = new WaitersService()
