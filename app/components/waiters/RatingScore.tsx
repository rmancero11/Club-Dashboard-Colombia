import { cn } from '@/app/lib/utils';
import { Waiter } from '@/app/types/business';
import Image from 'next/image';
import React from 'react'

type IEmojis = {
  [key: number]: string
}

const ratingEmojis: IEmojis = {
  1: '/mal.webp',
  2: '/regular.webp',
  4: '/bueno.webp',
  5: '/excelente.webp'
}

type RatingScoreProps = {
  waiter: Waiter
}

function RatingScore({ waiter, className }:RatingScoreProps & React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn(className)}>
    {
      [1, 2, 4, 5].map(idx => (
        <li key={idx} className='text-center'>
          <Image
            className='w-8 h-8 sm:w-10 sm:h-10'
            src={ratingEmojis[idx]}
            alt={`Rating de ${idx}`}
            width={40}
            height={40}
          />
          <span className='text-gray-500 font-normal'>
            {waiter.numberOfFeedbackPerRating[idx] || 0}
          </span>
        </li>
      ))
    }

  </ul>
  )
}

export default RatingScore