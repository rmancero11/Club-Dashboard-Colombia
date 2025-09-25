import { Card, CardContent } from '../ui/Card'
import { cn } from '@/app/lib/utils'
import { DateRange, Preset } from '@/app/types/general'
import { HTMLAttributes } from 'react'

import { format, isSameDay } from 'date-fns'

import { getCurrentMonth } from '@/app/helpers/dates.helpers'
import { capitalizeFirstLetter } from '@/app/helpers/strings.helpers'

import Image from 'next/image'

type NumberOfToGoProps = {
  numberOfToGo: number | null;
  preset: Preset | undefined;
  dateRange: DateRange
};

const NumberOfToGo = ({
  numberOfToGo,
  preset,
  dateRange,
  className
}: NumberOfToGoProps & HTMLAttributes<HTMLDivElement>) => {
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
          {numberOfToGo && (
            <div>
              <h2 className='text-center text-black font-medium text-lg'>
                {`Número de pedidos para llevar (${subtitle})`}
              </h2>
              <div className='flex justify-center items-center'>
                <Image
                  className='object-cover relative'
                  src='/bag.webp'
                  alt='Para llevar'
                  width={314}
                  height={315}
                />
                <p className='text-green-500 text-7xl font-bold absolute mt-24'>
                  {numberOfToGo}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>

  )
}

export default NumberOfToGo
