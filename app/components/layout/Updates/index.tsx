import { ScrollArea } from '../../ui/ScrollArea'
import { Separator } from '../../ui/Separator'
import { dashboardUpdates } from './updates'

const VITE_APP_VERSION = process.env.NEXT_PUBLIC_VITE_APP_VERSION
const VITE_APP_DATE_VERSION = process.env.NEXT_PUBLIC_VITE_APP_DATE_VERSION

function Updates () {
  return (
    <ScrollArea className='h-4/5 text-sm mt-2'>
      <div className='space-y-1 text-muted-foreground'>
        <p>
          El sistema ha sido actualizado a la versión {VITE_APP_VERSION} ({VITE_APP_DATE_VERSION}).
        </p>
        <p> Las actualizaciones incluyen:</p>
      </div>
      <ul className=' px-4 md:pl-8 pt-2 text-popover-foreground text-xs md:text-sm'>
        {dashboardUpdates.map(({ description, updates, id }) => (
          <div key={id}>
            <li className='list-disc'>
              {description}
            </li>
            {updates?.map((update, idx) => (
              <li key={idx} className='list-disc ml-4'>
                {update.description}
              </li>
            )
            )}
            <Separator className='my-2' />
          </div>
        ))}
      </ul>
    </ScrollArea>
  )
}

export default Updates
