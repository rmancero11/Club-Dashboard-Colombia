import { ReactNode, ButtonHTMLAttributes } from 'react'
import { Icon } from '@iconify/react'

const variants = {
  primary: 'bg-primary text-white hover:bg-white hover:text-primary hover:border border-primary w-full',
  warning: 'bg-warning text-white hover:bg-white hover:text-warning hover:border border-warning w-full',
  error: 'btn btn-error text-white w-full'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  disabled?: boolean
  variant?: keyof typeof variants
  loadingReplaceChildren?: boolean
  onClick?: () => void
}
//
export const Spinner = ({ size = 20 } = {}) => <Icon icon='gg:spinner' className='animate-spin' fontSize={size} />

export const Button = ({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  variant = 'primary',
  loadingReplaceChildren = false,
  onClick
}: ButtonProps) => {
  const loadingClassName = loading ? 'disabled:bg-gray-600 disabled:text-white' : ''
  const variantClassName = variants[variant]
  const baseClassName = `${variantClassName}  flex justify-center gap-2  px-4 py-3 cursor-pointer rounded-md duration-200`
  const colorClassName = ''
  const buttonClassName = `${baseClassName} ${colorClassName} ${loadingClassName}`
  return (
    <button type={type} disabled={loading || disabled} className={buttonClassName} onClick={onClick}>
      {!!loadingReplaceChildren && loading && <Spinner />}
      {!!loadingReplaceChildren && !loading && <>{children}</>}
      {!loadingReplaceChildren && loading && (
        <>
          <Spinner /> {children}
        </>
      )}
      {!loadingReplaceChildren && !loading && <>{children}</>}
    </button>
  )
}
