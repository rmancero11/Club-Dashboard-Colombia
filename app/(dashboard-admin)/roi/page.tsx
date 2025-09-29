'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import RoiCalculator from '../../components/roi/RoiCalculator'
import { Input } from '../../components/ui/Input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/Form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'

import type { Business } from '@/app/types/business'
import { Origins } from '@/app/types/feedback'
import { PRESETS } from '@/app/constants/dates'
import { DEFAULT_VALUES, RoiCalcSchemaProps, roiCalcSchema } from '@/app/validators/roiCalculatorSchema'
import { AccordionItem } from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionTrigger } from '../../components/ui/Accordion'
import { Switch } from '../../components/ui/Switch'
import { RoiUnderstandingDialog } from '../../components/roi/RoiUnderstandingDialog'
import QikRoi from '../../components/roi/QikRoi'
import RoiByOriginChart from '../../components/roi/RoiByOriginChart'
import { redirect } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useBusinessDataContext } from '@/app/context/BusinessContext'

import { ROUTE_LOGIN } from '@/app/constants/routes'
import RangeFeedbackSelector from '@/app/components/common/RangeFeedbackSelector';
import useDateRangePicker from '@/app/hooks/useDateRangePicker';

function Roi () {
  const form = useForm < RoiCalcSchemaProps >({
    resolver: zodResolver(roiCalcSchema()),
    defaultValues: DEFAULT_VALUES
  })

  // Agrega un estado para controlar la habilitación de la inversión en marketing
  const [marketingEnabled, setMarketingEnabled] = useState(true)
  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({}) // Estado para gestionar cada canal

  const { user } = useAuth()
  const [businessData, setBusinessData] = useState<Business | null>()
  const businessDataContext = useBusinessDataContext()

  const { dateRange, presetName, setDateRange, setPresetName } = useDateRangePicker();
  const preset = PRESETS.find(({ name }) => name === presetName)
  const investmentValues = form.watch()

  const origins = Object.values(Origins)

  useEffect(() => {
    if (!user) {
      return redirect(ROUTE_LOGIN);
    }
  }, [user]);

  useEffect(() => {
    setBusinessData(businessDataContext?.filteredBusinessData)
  }, [businessDataContext]);

  return (
    <div className='container my-8'>
      <Card className='grid md:grid-cols-2 lg:grid-cols-12 justify-center'>
        <CardHeader className='col-span-12 lg:col-span-4 lg:border-r '>
          <CardTitle>
            <div className='flex justify-between items-center'>
              Mide a tu negocio
              <RoiUnderstandingDialog tooltipContent='Conoce cómo funciona el ROI' />
            </div>
          </CardTitle>
          <CardDescription>
            Ingresa las fechas y valores que invertirás en marketing y mide tu retorno.
          </CardDescription>
          <div className='flex flex-col space-y-4'>
            <div className=' mt-4'>
            <RangeFeedbackSelector 
              setDateRange={setDateRange} 
              setPresetName={setPresetName} 
              dateRange={dateRange}
            />
            </div>
            <Form {...form}>
              <form>
                <h2 className='text-base font-medium'>Inversión en marketing</h2>
                <p className='text-sm text-muted-foreground'>Define el presupuesto global de tu negocio.</p>
                <FormField
                  control={form.control}
                  name='marketing'
                  render={({ field }) => (
                    <FormItem className='flex items-center mt-1 mb-4 space-x-3'>
                      <FormLabel className='mt-2'>Marketing</FormLabel>
                      <span className='flex items-center bg-grey-lighter rounded rounded-r-none font-bold text-grey-darker'>$</span>
                      <FormControl>
                        <Input
                          type='number' placeholder='1000' min={0} {...field} disabled={!marketingEnabled}
                        />
                      </FormControl>
                      <Switch
                        id={field.name}
                        checked={marketingEnabled}
                        onCheckedChange={() => setMarketingEnabled(!marketingEnabled)}
                        disabled={Object.values(channelEnabled).some((value) => value)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Accordion type='single' collapsible className='w-full'>
                  <AccordionItem value='item-1'>
                    <AccordionTrigger>Presupuesto por canal</AccordionTrigger>
                    <AccordionContent>
                      Conoce el retorno de inversión por canal.
                      {origins
                        .filter((key) => key !== 'Nouvelle cliente' && key !== 'Referred' && key !== 'Référé' && key !== 'New client')
                        .map((origin) => (
                          <FormField
                            key={origin}
                            control={form.control}
                            name={origin}
                            render={({ field }) => (
                              <FormItem className='grid md:grid-cols-12 items-center mb-4 gap-3'>
                                <FormLabel className='col-span-4 mt-2'>{origin}</FormLabel>
                                <div className='flex items-center col-span-8 space-x-3'>
                                  <span className='flex items-center bg-grey-lighter rounded rounded-r-none font-bold text-grey-darker'>$</span>
                                  <FormControl>
                                    <Input type='number' placeholder='1000' min={0} {...field} disabled={!channelEnabled[origin]} />
                                  </FormControl>
                                  <Switch
                                    id='marketing'
                                    onCheckedChange={() => setChannelEnabled((prev) => ({ ...prev, [origin]: !prev[origin] }))}
                                    disabled={marketingEnabled}
                                  />
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </form>
            </Form>
          </div>
        </CardHeader>
        <CardContent className='col-span-12 lg:col-span-8 grid grid-cols-2 gap-4 lg:pt-6'>
          <RoiCalculator
            businessData={businessData}
            dateRange={dateRange}
            preset={preset}
            investmentValues={investmentValues}
            className='col-span-2 lg:col-span-1'
          />
          <QikRoi
            businessData={businessData}
            dateRange={dateRange}
            preset={preset}
            investmentValues={investmentValues}
            className='col-span-2 lg:col-span-1 text-white'
          />
          <RoiByOriginChart
            businessData={businessData}
            dateRange={dateRange}
            className='col-span-2 lg:col-span-2'
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Roi
