
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { value?: number | null }
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-300"
      style={{ 
        transform: `translateX(-${100 - (value ?? 0)}%)`,
        animation: value === null ? 'indeterminate-progress 1.5s ease-in-out infinite' : 'none'
      }}
    />
    <style jsx>{`
      @keyframes indeterminate-progress {
        0% { transform: translateX(-100%) scaleX(0.5); }
        50% { transform: translateX(0) scaleX(0.2); }
        100% { transform: translateX(100%) scaleX(0.5); }
      }
    `}</style>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
