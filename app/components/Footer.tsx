import Image from "next/image"

function Footer () {
    return (
      <footer className='py-4 flex justify-center items-center border-t'>
        <div className='flex justify-center items-center space-x-1 sm:space-x-2'>
          <a
            href='https://qikstarts.com/' target='_blank' rel='noopener noreferrer'
          >
            <Image
              src='/qik.png'
              alt='Qik starts'
              width={220}
              height={127}
            />
          </a>
        </div>
      </footer>
    )
  }

  export default Footer
