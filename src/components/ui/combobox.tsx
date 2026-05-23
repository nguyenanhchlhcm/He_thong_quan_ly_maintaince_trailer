"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"

import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

// Cast primitives to any to bypass strict version-specific type mismatches of Base UI
const Root = ComboboxPrimitive.Root as any
const Input = ComboboxPrimitive.Input as any
const Trigger = ComboboxPrimitive.Trigger as any
const Icon = ComboboxPrimitive.Icon as any
const Value = ComboboxPrimitive.Value as any
const Portal = ComboboxPrimitive.Portal as any
const Positioner = ComboboxPrimitive.Positioner as any
const Popup = ComboboxPrimitive.Popup as any
const List = ComboboxPrimitive.List as any
const Item = ComboboxPrimitive.Item as any
const Empty = ComboboxPrimitive.Empty as any

function ComboboxRoot<TValue, Multiple extends boolean | undefined = false>({
  className,
  ...props
}: ComboboxPrimitive.Root.Props<TValue, Multiple> & {
  className?: string
}) {
  return (
    <Root
      data-slot="combobox-root"
      className={className}
      {...props}
    />
  )
}

function ComboboxInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props & {
  className?: string
}) {
  return (
    <Input
      data-slot="combobox-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  )
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  className?: string
}) {
  return (
    <Trigger
      data-slot="combobox-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </Trigger>
  )
}

function ComboboxValue({
  className,
  ...props
}: ComboboxPrimitive.Value.Props & {
  className?: string
}) {
  return (
    <Value
      data-slot="combobox-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function ComboboxPopup({
  className,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  className?: string
}) {
  return (
    <Portal>
      <Positioner className="isolate z-50">
        <Popup
          data-slot="combobox-popup"
          className={cn(
            "relative isolate z-50 max-h-60 w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </Positioner>
    </Portal>
  )
}

function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props & {
  className?: string
}) {
  return (
    <List
      data-slot="combobox-list"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props & {
  className?: string
}) {
  return (
    <Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </span>
    </Item>
  )
}

function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props & {
  className?: string
}) {
  return (
    <Empty
      data-slot="combobox-empty"
      className={cn("px-2 py-4 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

const InputGroup = ComboboxPrimitive.InputGroup as any

function ComboboxInputGroup({
  className,
  ...props
}: ComboboxPrimitive.InputGroup.Props & {
  className?: string
}) {
  return (
    <InputGroup
      data-slot="combobox-input-group"
      className={cn("relative flex items-center w-full", className)}
      {...props}
    />
  )
}

export {
  ComboboxRoot,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxInputGroup,
}
