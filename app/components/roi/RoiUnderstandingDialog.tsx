import { IconHelpCircle, IconInfoCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert'
import { SlideOver } from '../ui/SlideOver'
import { ScrollArea } from '../ui/ScrollArea'
import { HelpTrigger } from './HelpTrigger'

export function RoiUnderstandingDialog({ tooltipContent }: { tooltipContent: string }) {
  return (
    <SlideOver
      title='Entendimiento del ROI'
      description='Mediantes los códigos QR de las encuestas de satisfacción de clientes, recaudamos los siguientes datos para la medición aproximada del ROI.'
      mainActionText='Cerrar'
      content={<Updates />}
      side='top'
    >
      {/* 👇 Hijo directo de SheetTrigger asChild: forwardRef ✅ */}
      <HelpTrigger variant="ghost" size="icon" tooltip={tooltipContent} aria-label="Ver explicación del ROI">
        <IconHelpCircle className="h-4 w-4" />
      </HelpTrigger>
    </SlideOver>
  )
}

function Updates() {
  return (
    <ScrollArea className='h-[66vh] text-sm mt-2'>
      <div className='flex flex-col gap-4 text-muted-foreground pb-4'>
        <div>
          <h3 className='col-span-2 font-medium mb-2'>Ingresos estimados</h3>
          <ul>
            <li className='col-span-2 list-disc'><span className='text-qik'>Fuente de donde llega el cliente:</span> (Facebook, Instagram, TikTok, etc.).</li>
            <p className='col-span-2'><span className='text-qik'>Gasto promedio por persona:</span> ($1 - $5, $5 - $10, $10 - $15, etc.).</p>
            <p className='text-[11px] leading-snug'>Con este análisis evaluamos ingreso por fuente y consumo promedio por cliente.</p>
          </ul>
        </div>
        <div>
          <h3 className='col-span-2 mb-2'>Egresos estimados</h3>
          <p className='col-span-2 text-qik'>Inversión global de marketing</p>
          <p className='col-span-2 text-qik'>Inversión por canal</p>
          <p className='col-span-2 text-qik'>Plan actual</p>
          <p className='text-center text-xl text-qik font-black'>ROI ≈ Ingresos - Egresos</p>
          <p className='text-[11px] leading-snug'>Ofrecemos una perspectiva aproximada del retorno de inversión, destacamos que son valores estimados, no exactos, ya que la presición exacta depende del total de clientes que visitan, y de la facturación actual de tu negocio y de tu punto de venta.</p>
        </div>
        <Alert variant='warning'>
          <IconInfoCircle className='h-4 w-4' />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Incentiva a que tu personal realice la mayor cantidad de encuestas, y así obtendrás un mejor ROI.
          </AlertDescription>
        </Alert>
      </div>
    </ScrollArea>
  )
}
