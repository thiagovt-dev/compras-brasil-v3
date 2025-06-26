import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

type Group = { label: string; options: string[] };

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export function Combobox({
  value,
  onValueChange,
  onInputChange,
  placeholder,
  children,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (onInputChange) onInputChange(search);
  }, [search, onInputChange]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <span>
            {value
              ? value
              : <span className="text-muted-foreground">{placeholder || "Selecione"}</span>}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="z-50 mt-2 w-[320px] rounded-md border bg-white p-2 shadow-lg"
      >
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="mb-2 w-full rounded border px-2 py-1 text-sm focus:outline-none"
        />
        <div className="max-h-60 overflow-y-auto">{children}</div>
      </Popover.Content>
    </Popover.Root>
  );
}

interface ComboboxGroupProps {
  label: string;
  children: React.ReactNode;
}
Combobox.Group = function ComboboxGroup({ label, children }: ComboboxGroupProps) {
  return (
    <div className="mb-2">
      <div className="p-2 font-bold text-muted-foreground">{label}</div>
      {children}
    </div>
  );
};

interface ComboboxOptionProps {
  value: string;
  children: React.ReactNode;
}
Combobox.Option = function ComboboxOption({ value, children }: ComboboxOptionProps) {
  const ctx = React.useContext(ComboboxContext);
  if (!ctx) throw new Error("Combobox.Option must be used within Combobox");
  const { selected, setSelected, setOpen } = ctx;
  return (
    <div
      className={`flex cursor-pointer items-center px-2 py-1 text-sm rounded hover:bg-primary/10 ${
        selected === value ? "bg-primary/10 font-semibold" : ""
      }`}
      onClick={() => {
        setSelected(value);
        setOpen(false);
      }}
    >
      {selected === value && <Check className="mr-2 h-4 w-4 text-primary" />}
      {children}
    </div>
  );
};

// Contexto para compartilhar estado entre Combobox e Option
const ComboboxContext = React.createContext<{
  selected: string;
  setSelected: (v: string) => void;
  setOpen: (v: boolean) => void;
} | null>(null);

export function ComboboxProvider({
  value,
  onValueChange,
  setOpen,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  setOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <ComboboxContext.Provider
      value={{
        selected: value,
        setSelected: onValueChange,
        setOpen,
      }}
    >
      {children}
    </ComboboxContext.Provider>
  );
}