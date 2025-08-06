"use client";

import React from "react";
import { Input, InputProps } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value"> {
  onChange?: (value: number | null) => void;
  value?: number | null;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ onChange, value, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [rawValue, setRawValue] = React.useState("");

    // Inicializa o valor
    React.useEffect(() => {
      if (value !== null && value !== undefined && !isNaN(value)) {
        const intValue = Math.round(value);
        setRawValue(intValue.toString());
      } else {
        setRawValue("");
      }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, "");
      let newValue = input;

      // Limita a 12 dígitos (R$ 9.999.999.999,99)
      if (newValue.length > 12) {
        newValue = newValue.substring(0, 12);
      }

      setRawValue(newValue);

      // Converte para número (em centavos)
      const numericValue = newValue ? parseInt(newValue, 10) : null;
      if (onChange) {
        onChange(numericValue);
      }
    };

    const formatDisplayValue = () => {
      if (!rawValue) return "";

      // Garante pelo menos 3 dígitos (0,00)
      const paddedValue = rawValue.length < 3 ? rawValue.padStart(3, "0") : rawValue;

      const reaisPart = paddedValue.slice(0, -2) || "0";
      const centsPart = paddedValue.slice(-2);

      // Formata reais com separadores de milhar
      const formattedReais = Number(reaisPart).toLocaleString("pt-BR");

      return `R$ ${formattedReais},${centsPart}`;
    };

    return (
      <Input
        {...props}
        ref={(el) => {
          if (el) inputRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        type="text"
        inputMode="numeric"
        value={formatDisplayValue()}
        onChange={handleChange}
        placeholder="R$ 0,00"
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
