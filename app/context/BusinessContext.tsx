'use client'

import { useRouter } from 'next/navigation'
import Loader from '@/app/components/Loader'
import { useContext, useEffect, useState } from 'react'
import { Business } from '@/app/types/business'
import React, { ReactNode } from 'react'
import { ROUTE_LOGIN } from '../constants/routes'
import axios from 'axios'
import { set } from 'date-fns'

interface BusinessContextProps {
  filteredBusinessData: Business | undefined
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  isLoading: boolean
  isClientInitialized: boolean
}

export const BusinessContext = React.createContext<BusinessContextProps | undefined>(undefined)

export function useBusinessDataContext() {
  return useContext(BusinessContext)
}

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isClientInitialized, setIsClientInitialized] = useState(false);
  const [user, setUser] = useState<BusinessContextProps['user']>(null)
  const [filteredBusinessData, setFilteredBusinessData] = useState<Business | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter() // ✅

  useEffect(() => {
    const fetchUserAndBusiness = async () => {
      try {
        const resUser = await axios.get('/api/auth/me')  
        setUser(resUser.data.user)

        const resBusiness = await axios.get(`/api/business/${resUser.data.user.id}`)
        setFilteredBusinessData(resBusiness.data)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        router.push(ROUTE_LOGIN) // ✅ redirección en cliente
      } finally {
        setIsLoading(false)
        setIsClientInitialized(true)
      }
    }

    fetchUserAndBusiness()
  }, [router]) // ✅ incluye router en deps

  const businessContextValue: BusinessContextProps = {
    filteredBusinessData,
    user,
    isLoading,
    isClientInitialized
  }

  return isLoading ? (
    <Loader />
  ) : (
    <BusinessContext.Provider value={businessContextValue}>
      {children}
    </BusinessContext.Provider>
  )
}

