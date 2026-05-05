import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    (<textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/25 flex field-sizing-content min-h-20 w-full rounded-[1.25rem] border bg-background/70 px-4 py-3 text-base shadow-[0_12px_30px_-24px_rgba(11,17,22,0.35)] transition-[color,box-shadow,transform] duration-300 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-md",
        className
      )}
      {...props} />)
  );
}

export { Textarea }
