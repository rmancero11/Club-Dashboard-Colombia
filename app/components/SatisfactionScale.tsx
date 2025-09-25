import Image from "next/image"
import { cn } from "../lib/utils"
import { Slider } from "./ui/Slider"

type ISatisfactionScale = {
  allFeedbacksAverageScore: number
}

const SatisfactionScale = ({ allFeedbacksAverageScore }: ISatisfactionScale) => {
  return (
    <>
    <div className='flex items-center justify-center gap-5 my-4'>
      <div className='flex space-x-5'>
        <Image
          src='/iconosnews-05.png'
          alt='experiencia mal'
          className='w-6 h-6 sm:w-10 sm:h-10 scale-110 sm:scale-125'
          width={668}
          height={657} />
        <Image src='/iconosnews-06.png'
          alt='experiencia regular'
          className='w-6 h-6 sm:w-10 sm:h-10 scale-110 sm:scale-125'
          width={668}
          height={657} />
      </div>
      <div className='flex space-x-5'
      >
        <Image
          src='/iconosnews-08.png'
          alt='experiencia bueno'
          className='w-6 h-6 sm:w-10 sm:h-10 scale-110 sm:scale-125'
          width={668}
          height={657} />

        <Image
          src='/iconosnews-07.png'
          alt='experiencia excelente'
          className='w-6 h-6 sm:w-10 sm:h-10 scale-110 sm:scale-125'
          width={668}
          height={657} />
      </div>
    </div>
    <Slider className='mt-3' value={[Number(allFeedbacksAverageScore) || 0]} disabled max={5} />
    </>
  )
}

export default SatisfactionScale
