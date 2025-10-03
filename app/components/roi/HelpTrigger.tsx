import * as React from 'react'
import { Button, type ButtonProps } from '../ui/Button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/ToolTip'

type HelpTriggerProps = ButtonProps & {
  tooltip: string
}

export const HelpTrigger = React.forwardRef<HTMLButtonElement, HelpTriggerProps>(
  ({ tooltip, children, ...btnProps }, ref) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button ref={ref} {...btnProps}>
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)

HelpTrigger.displayName = 'HelpTrigger'
