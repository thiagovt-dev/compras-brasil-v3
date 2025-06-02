"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ, Calendar, Clock } from "lucide-react";

interface TenderSortProps {
  onSortChange: (sort: { field: string; direction: "asc" | "desc" }) => void;
  currentSort: { field: string; direction: "asc" | "desc" };
}

export function TenderSort({ onSortChange, currentSort }: TenderSortProps) {
  const sortOptions = [
    { value: "opening_date", label: "Data de Abertura", icon: Calendar },
    { value: "proposal_deadline", label: "Prazo de Proposta", icon: Clock },
    {
      value: "title",
      label: "Título",
      icon: currentSort.direction === "asc" ? ArrowUpAZ : ArrowDownAZ,
    },
    { value: "created_at", label: "Data de Criação", icon: Calendar },
  ];

  const toggleDirection = () => {
    onSortChange({
      field: currentSort.field,
      direction: currentSort.direction === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[1rem] text-muted-foreground">Ordenar por:</span>
      <Select
        value={currentSort.field}
        onValueChange={(value) => onSortChange({ field: value, direction: currentSort.direction })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <option.icon className="h-4 w-4" />
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={toggleDirection}>
        {currentSort.direction === "asc" ? (
          <ArrowUpAZ className="h-4 w-4" />
        ) : (
          <ArrowDownAZ className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
