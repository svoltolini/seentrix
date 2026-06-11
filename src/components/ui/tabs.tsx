"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Tabs — Nask underlined style is the default (matches Detail Dashboard
 * "Kanban / Comment / Attachment" tab strip in `41:1171`). The legacy
 * pill-style `default` variant is preserved as `pills` for code that hasn't
 * been migrated yet.
 */

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-4 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center text-muted-foreground group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // Underlined: a hairline along the bottom edge with the active tab
        // marked by a thicker primary underline.
        line:
          "gap-6 border-b border-border bg-transparent group-data-horizontal/tabs:h-[42px] group-data-vertical/tabs:h-fit",
        // Filled-pill style (legacy): white card surface, active = primary fill.
        pills:
          "rounded-md bg-muted p-1 group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit gap-1",
      },
    },
    defaultVariants: {
      variant: "line",
    },
  }
)

function TabsList({
  className,
  variant = "line",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-l6 text-muted-foreground transition-colors outline-none",
        "hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Underlined variant — primary text + animated underline on active.
        "group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:px-1 group-data-[variant=line]/tabs-list:data-active:text-primary",
        "after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-primary after:opacity-0 after:transition-opacity",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        // Pill variant
        "group-data-[variant=pills]/tabs-list:h-7 group-data-[variant=pills]/tabs-list:rounded group-data-[variant=pills]/tabs-list:px-3 group-data-[variant=pills]/tabs-list:data-active:bg-card group-data-[variant=pills]/tabs-list:data-active:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-p2 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
