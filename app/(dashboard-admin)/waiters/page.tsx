'use client'

import type { Business, Waiter } from '@/app/types/business'
import type { DateRange } from '@/app/types/general'
import { getAllWaitersDataPerPeriod, getTotalWaitersDataPerPeriod, groupWaitersByBusinessName } from '@/app/helpers'
import WaitersStats from '../../components/waiters/WaitersStats'
import { redirect, useSearchParams } from 'next/navigation'

import { useEffect, useState } from 'react'
import { INITIAL_DATE_FROM, INITIAL_DATE_TO } from '@/app/constants/dates'
import { DateRangePicker } from '../../components/ui/DateRangePicker'
import { EmptyContent } from '../../components/layout/EmptyContent'
import { IconSearch } from '@tabler/icons-react'
import { DEFAULT_SORT_CRITERION } from '@/app/constants/waiters'
import { useAuth } from '@/app/hooks/useAuth'
import { useBusinessDataContext } from '@/app/context/BusinessContext'

import { ROUTE_LOGIN } from '@/app/constants/routes'
import Top3Waiters from '@/app/components/waiters/Top3Waiters';
import Filters from '@/app/components/waiters/Filters';
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';

function Waiters() {
  const { user } = useAuth()
  const [businessData, setBusinessData] = useState<Business | null>()
  const [waitersData, setWaitersData] = useState<Waiter[] | null>()
  const businessDataContext = useBusinessDataContext()

  const searchParams = useSearchParams()
  const branch = searchParams.get('sucursal')
  const isMatriz = branch === 'todas'
  const businessName = businessData?.name || ''

  const [orderBy, setOrderBy] = useState<keyof Waiter>(DEFAULT_SORT_CRITERION)
  const [query, setQuery] = useState<string>('')
  const { dateRange, presetName, setDateRange, setPresetName } = useDateRangePicker();

  const sortWaiters = (criterion: keyof Waiter) => {
    setOrderBy(criterion)
  }

  const filterWaiters = (query: string) => {
    setQuery(query)
  }

  const getFilteredWaiters = (waiters: Waiter[]) => {
    return waiters.filter(waiter => waiter.name.toLowerCase().includes(query.toLowerCase()))
  }

  const groupedWaitersData = groupWaitersByBusinessName(waitersData || [])

  const sortData = (orderBy: keyof Waiter) => {
    const sortedData = Object.entries(groupedWaitersData).sort(([branch1, waiters1], [branch2, waiters2]) => {
      const totalValue1 = waiters1.reduce((acc, waiter) => acc + Number(waiter[orderBy]), 0);
      const totalValue2 = waiters2.reduce((acc, waiter) => acc + Number(waiter[orderBy]), 0);

      return totalValue2 - totalValue1;
    });

    return sortedData;
  };

  const sortedData = sortData(orderBy);


  useEffect(() => {
    if (!user) {
      return redirect(ROUTE_LOGIN);
    }
  }, [user]);

  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData)
  }, [businessDataContext]);

  useEffect(() => {
    const waiters =
      branch !== 'todas'
        ? getAllWaitersDataPerPeriod(businessData, dateRange)
        : getTotalWaitersDataPerPeriod(businessData, dateRange)
    setWaitersData(waiters)
  }, [branch, businessData, dateRange])

  return (
    <>
      <div className='my-8'>
        <div className='mb-1'>
          <RangeFeedbackSelector
            setDateRange={setDateRange}
            setPresetName={setPresetName}
            dateRange={dateRange}
          />
        </div>
        <h2 className='text-center font-medium text-xl text-gray-500 my-5'>
          Mide e incentiva a tu personal 😉📈
        </h2>
        {isMatriz && (
          <Top3Waiters waiters={waitersData || []} businessName={businessName} />
        )}
        {waitersData && waitersData.length > 0
          ? (
            <div>
              <Filters
                filterWaiters={filterWaiters}
                query={query}
                sortWaiters={sortWaiters}
              />
              <h2 className='text-xl font-bold my-8'>Top 3 meseros por cada sucursal</h2>

              {
                sortedData.map(([businessName, waiters]) => {
                  const filteredWaiters = getFilteredWaiters(waiters)
                  const hasFilteredWaiters = filteredWaiters.length > 0
                  return (
                    <div key={businessName} className='space-y-4 lg:space-y-8'>
                      {hasFilteredWaiters && (
                        <div key={businessName} className='space-y-5'>
                          <h2 className='text-left font-medium text-xl text-gray-500 mt-5'>
                            {businessName}
                          </h2>
                          <WaitersStats waiters={filteredWaiters} />
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          )
          : (
            <EmptyContent
              title='No hay datos para mostrar'
              description='Intenta cambiando el rango de fechas, o seleccionando otra sucursal.'
              icon={<IconSearch />}
            />
          )}

      </div>
    </>
  )
}

export default Waiters
