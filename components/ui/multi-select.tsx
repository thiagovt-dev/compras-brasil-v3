"use client"

import * as React from "react"
import { X, Check, ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Option = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelect({ options, selected, onSelectedChange, placeholder }: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = React.useCallback(
    (value: string) => {
      const newSelected = selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]
      onSelectedChange(newSelected)
      setInputValue("")
    },
    [selected, onSelectedChange],
  )

  const handleRemove = React.useCallback(
    (value: string) => {
      onSelectedChange(selected.filter((s) => s !== value))
    },
    [selected, onSelectedChange],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" && inputValue === "" && selected.length > 0) {
        handleRemove(selected[selected.length - 1])
      }
    },
    [inputValue, selected, handleRemove],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex min-h-[36px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1">
            {selected.map((value) => {
              const option = options.find((o) => o.value === value)
              return (
                <Badge key={value} variant="secondary">
                  {option?.label || value}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRemove(value)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )
            })}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={selected.length === 0 ? placeholder || "Selecione..." : ""}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {selected.includes(option.value) && <Check className="h-4 w-4 text-green-500" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
