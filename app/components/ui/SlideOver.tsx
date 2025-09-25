import { MouseEventHandler, ReactNode } from 'react'
import { Button } from './Button'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from './Sheet'

type SlideOverProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  content?: ReactNode;
  mainActionText?: string;
  mainActionCallback?: MouseEventHandler<HTMLButtonElement>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  defaultOpen?: boolean;
};

export function SlideOver ({
  children,
  title,
  description,
  content,
  mainActionText,
  mainActionCallback,
  side,
  defaultOpen = false
}: SlideOverProps) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {content}
        <SheetFooter>
          <SheetClose asChild>
            {mainActionText && (
              <Button
                className='bg-blue-500 hover:bg-blue-400 text-white'
                type='submit'
                onClick={mainActionCallback}
              >
                {mainActionText}
              </Button>
            )}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
