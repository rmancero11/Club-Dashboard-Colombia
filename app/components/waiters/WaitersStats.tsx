import { Waiter } from '@/app/types/business'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'

import Image from 'next/image'
import RatingScore from './RatingScore';

type IWaiterProps = {
  waiters: Waiter[]
}

const topWaitersIcons: Record<number, string> = {
  0: '/gold.png',
  1: '/silver.png',
  2: '/bronze.png',
}

const WaitersStats = ({ waiters }: IWaiterProps) => {

  return (
    <div className='flex flex-no-wrap overflow-x-auto scrolling-touch snap-proximity items-start mb-8 pt-6 space-x-8'>
      {
          waiters
          .sort((a, b) => b.numberOfSurveys - a.numberOfSurveys)
          .map((waiter, idx) => (
            <div
              key={idx} className='flex justify-center items-center flex-col rounded-xl min-w-fit border-[1px] border-qik py-3 px-6 mb-4 relative'
            >
               {[0, 1, 2].includes(idx) && (
                <Image
                className='w-10 h-auto absolute md: top-[-23.33px] left-[calc(50%-20px)]'
                src={topWaitersIcons[idx]}
                alt={`Rating de ${idx}`}
                width={40}
                height={40}
              />
               )}
              <div className='rounded-full bg-qik text-center py-1 text-white px-3 mt-5'>
                {waiter.numberOfSurveys || 0} reseñas
              </div>
              <div className='flex justify-center relative items-center mt-3'>
                <Image
                  className='relative w-32 h-32 sm:w-44 sm:h-44'
                  src={`${waiter.gender === 'masculino' ? '/male-dashboard.webp' : '/female-dashboard.webp'}`}
                  alt={`${waiter.gender === 'masculino' ? 'Icono de mesero' : 'Icono de mesera'}`}
                  width={176}
                  height={176}
                />
                <div className='flex flex-col bg-qik justify-center items-center absolute lg:mt-40 mt-28
                rounded-full p-3 w-14'
                >
                  <FontAwesomeIcon icon={faStar} color='#f6d91e' />
                  <span className='text-xs text-white font-extrabold'>
                    {waiter.ratingAverage || 0}
                  </span>
                </div>
              </div>
              <p className='text-center text-gray-500 font-normal mt-8'>
                {waiter.name}
              </p>
              <RatingScore waiter={waiter} className='flex flex-row gap-2 mt-4' />
            </div>
          ))
        }
    </div>
  )
}

export default WaitersStats
