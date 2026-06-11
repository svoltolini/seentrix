import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — Clay surface primitive.
 * Flat white surface defined by a hairline border (no shadow) — the
 * Claude/Clay aesthetic. The `shadow` prop is retained for API compatibility
 * but is a no-op; cards are flat across the app.
 */
function Card({
  className,
  size = "default",
  shadow = "none",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  shadow?: "lg" | "md" | "sm" | "none"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-shadow={shadow}
      className={cn(
        "group/card flex flex-col gap-6 overflow-hidden rounded-lg border border-border bg-card text-card-foreground py-[18px]",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "data-[size=sm]:gap-4 data-[size=sm]:py-4 data-[size=sm]:has-data-[slot=card-footer]:pb-0",
        "*:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-md px-[18px] group-data-[size=sm]/card:px-4",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        "[.border-b]:pb-[18px] group-data-[size=sm]/card:[.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        // 18/700 — matches Nask section header inside cards (Settings "Personal Information").
        "text-h4 text-foreground group-data-[size=sm]/card:text-h5",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-p3 text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[18px] group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-md px-[18px] pb-[18px] pt-0 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:pb-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
