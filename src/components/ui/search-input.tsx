"use client"

import * as React from "react"
import { Icon } from "@/components/icon"

import { cn } from "@/lib/utils"

/**
 * SearchInput — top-bar search field per Figma frame `57:23937`.
 *   `bg-input rounded-[10px] h-[48px]` with a 24×24 search icon at left:12,
 *   placeholder text in `text-p3-r text-muted-foreground`.
 */
function SearchInput({
  className,
  iconClassName,
  placeholder,
  ...props
}: React.ComponentProps<"input"> & { iconClassName?: string }) {
  return (
    <div className={cn("relative h-12 w-full", className)}>
      <Icon
        name="search-02-stroke-rounded"
        size={24}
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          iconClassName
        )}
      />
      <input
        type="search"
        data-slot="search-input"
        placeholder={placeholder}
        className={cn(
          "h-full w-full rounded-md bg-input pl-12 pr-4 text-p3-r text-foreground placeholder:text-muted-foreground border border-border-strong outline-none transition-[border-color] duration-[140ms]",
          "focus-visible:border-primary"
        )}
        {...props}
      />
    </div>
  )
}

export { SearchInput }
