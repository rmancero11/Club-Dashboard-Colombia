import Image from "next/image"

function Loader () {
    return (
      <div className='grid place-items-center min-h-[92vh]'>
        <Image
          src='/qik.svg'
          className='w-40 sm:w-44 animate-pulse'
          alt='QikStarts'
          width={155}
          height={62}
          priority={true}
        />
      </div>
    )
  }

  export default Loader
