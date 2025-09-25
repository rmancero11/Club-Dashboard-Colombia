import { Card, CardContent } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { DateRange, Preset } from '@/app/types/general'
import { HTMLAttributes } from 'react'

import { format, isSameDay } from 'date-fns'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import Image from 'next/image'

type NumberOfDeliveriesProps = {
  numberOfDeliveries: number | null;
  preset: Preset | undefined;
  dateRange: DateRange
};

const NumberOfDeliveries = ({
  numberOfDeliveries,
  preset,
  dateRange,
  className
}: NumberOfDeliveriesProps & HTMLAttributes<HTMLDivElement>) => {
  const hasPreset = preset !== undefined
  const { from, to = new Date() } = dateRange
  const isSameRangeDate = isSameDay(new Date(from), new Date(to))
  const formattedFromDate = format(new Date(from), 'MMM dd yyyy')
  const formattedToDate = format(new Date(to), 'MMM dd yyyy')
  const customRangeDate = isSameRangeDate ? `${formattedFromDate}` : `${formattedFromDate} - ${formattedToDate}`
  const queryRangeDate = hasPreset ? preset?.label : customRangeDate

  const currentMonth = getCurrentMonth()

  const subtitle = queryRangeDate || `${capitalizeFirstLetter(currentMonth)} ${new Date().getFullYear()}`
  return (
    <>
      <Card className={cn('pt-8', className)}>
        <CardContent>
          {numberOfDeliveries && (
            <div>
              <h2 className='text-center text-black font-medium text-lg'>
                {`Número de pedidos a domicilio (${subtitle})`}
              </h2>
              <div className='flex justify-center items-center'>
                <Image
                  className='object-cover relative'
                  src='/delivery.webp'
                  alt='A domicilio'
                  width={314}
                  height={315}
                />
                <p className='text-green-500 text-7xl font-bold absolute mt-10 mr-5'>
                  {numberOfDeliveries}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>

  )
}

export default NumberOfDeliveries
