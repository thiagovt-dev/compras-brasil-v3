"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function MultiSelect({ options, selected, onSelectedChange, placeholder, disabled }: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = React.useCallback(
    (value: string) => {
      onSelectedChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
      setInputValue("")
    },
    [selected, onSelectedChange],
  )

  const handleRemove = React.useCallback(
    (value: string) => {
      onSelectedChange(selected.filter((item) => item !== value))
    },
    [selected, onSelectedChange],
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" && inputValue === "" && selected.length > 0) {
        onSelectedChange(selected.slice(0, -1))
      }
    },
    [inputValue, selected, onSelectedChange],
  )

  const selectedOptions = options.filter((option) => selected.includes(option.value))
  const availableOptions = options.filter((option) => !selected.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <Badge key={option.value} variant="secondary">
                {option.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleRemove(option.value)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandGroup>
            {availableOptions.length === 0 && <CommandItem disabled>Nenhuma opção disponível.</CommandItem>}
            {availableOptions.map((option) => (
              <CommandItem key={option.value} onSelect={() => handleSelect(option.value)} className="cursor-pointer">
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
