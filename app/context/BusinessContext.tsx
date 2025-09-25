'use client'

import { redirect } from 'next/navigation'
import Loader from '@/app/components/Loader'
import { useContext, useEffect, useState } from 'react'
import { Business } from '@/app/types/business'
import { useGetFeedbackData } from '../hooks/business'
import React, { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ROUTE_LOGIN } from '../constants/routes'
import axios from 'axios'

interface BusinessContextProps {
  filteredBusinessData: Business | undefined
  isClientInitialized: boolean
}

export const BusinessContext = React.createContext<BusinessContextProps | undefined>(undefined)

export function useBusinessDataContext() {
  return useContext(BusinessContext)
}

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: businessFeedbacks } = useGetFeedbackData()
  const { user } = useAuth();

  const [filteredBusinessData, setFilteredBusinessData] = useState<Business | undefined>()
  const [isClientInitialized, setIsClientInitialized] = useState<boolean>(false); // Persist success state

  useEffect(() => {
    if (!user) {
      redirect(ROUTE_LOGIN);
    }
  }, [user]);

  useEffect(() => {
    const initializeClient = async () => {
      if (filteredBusinessData?.sessionId && !isClientInitialized) {
        try {
          const response = await axios.post(`https://8d5f-2800-bf0-10b-f69-41d-a7ef-8a49-92cc.ngrok-free.app/api/create-client/${filteredBusinessData.sessionId}`, {
            headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status != 500) {
          setIsClientInitialized(true)
        } else {
          alert("Error al crear el cliente: " + response.statusText);
        }
      } catch (error) {
        setIsClientInitialized(true)
        console.error("Error en la solicitud:", error);
      }
    }}
    initializeClient();
  }, [filteredBusinessData?.sessionId, isClientInitialized]);

  useEffect(() => {
    setFilteredBusinessData(businessFeedbacks);
    setIsClientInitialized(false);
  }, [businessFeedbacks]);

  const businessContextValue: BusinessContextProps = {
    filteredBusinessData,
    isClientInitialized
  }

  return (
    !businessFeedbacks ? <Loader />
      : <BusinessContext.Provider value={businessContextValue}>{children}</BusinessContext.Provider>
  )
}
