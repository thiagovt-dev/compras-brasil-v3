"use client";

import { useState, useCallback } from "react";

export function useCurrencyMask(initialValue = "") {
  const [value, setValue] = useState(initialValue);

  const formatCurrency = useCallback((value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "");

    if (!numbers) return "";

    // Converte para número e divide por 100 para ter centavos
    const amount = Number.parseInt(numbers) / 100;

    // Formata como moeda brasileira
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }, []);

  const handleChange = useCallback(
    (inputValue: string) => {
      const formatted = formatCurrency(inputValue);
      setValue(formatted);
      return formatted;
    },
    [formatCurrency]
  );

  const getRawValue = useCallback((): number => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? Number.parseInt(numbers) / 100 : 0;
  }, [value]);

  const setFormattedValue = useCallback(
    (newValue: string | number) => {
      if (typeof newValue === "number") {
        const formatted = newValue.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
        });
        setValue(formatted);
      } else {
        setValue(formatCurrency(newValue));
      }
    },
    [formatCurrency]
  );

  return {
    value,
    handleChange,
    getRawValue,
    setFormattedValue,
    setValue,
  };
}
