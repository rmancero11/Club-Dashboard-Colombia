import { useEffect, useState } from 'react'
import { Business } from '@/app/types/business'
import { useAuth } from './useAuth'
import { getBusinessDataFromUser } from '../services/business'
import { User } from 'firebase/auth'

function useBusinessData () {
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState<Business | null>(null)
  const { user } = useAuth()
  const userData: User = user as User
  const { uid } = userData || { uid: null }

  useEffect(() => {
    if (!uid) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = (await getBusinessDataFromUser(uid)) as Business
        setBusinessData(res)
        setIsDemo(res?.Name === 'Hanami Tumbaco')
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [uid])

  return {
    loading,
    businessData,
    isDemo
  }
}

export default useBusinessData
