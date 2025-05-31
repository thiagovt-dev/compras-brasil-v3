"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/supabase/auth-context";
import { Loader2 } from "lucide-react";

interface MeEppTiebreakerProps {
  tenderId: string;
  lotId: string;
  bestPrice: number;
  currentPrice: number;
  onSubmit: () => void;
}

export function MeEppTiebreaker({
  tenderId,
  lotId,
  bestPrice,
  currentPrice,
  onSubmit,
}: MeEppTiebreakerProps) {
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newPrice, setNewPrice] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar uma proposta.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = Number.parseFloat(newPrice.replace(",", "."));

    if (isNaN(priceValue) || priceValue >= bestPrice) {
      toast({
        title: "Preço inválido",
        description: `O novo preço deve ser menor que ${bestPrice.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update proposal with new price
      const { data: existingProposal, error: checkError } = await supabase
        .from("proposals")
        .select("*")
        .eq("tender_id", tenderId)
        .eq("lot_id", lotId)
        .eq("supplier_id", profile.id)
        .single();

      if (checkError) throw checkError;

      // Calculate percentage reduction
      const percentageReduction = ((currentPrice - priceValue) / currentPrice) * 100;

      // Update proposal
      await supabase
        .from("proposals")
        .update({
          total_value: priceValue,
          me_epp_tiebreaker: true,
          me_epp_tiebreaker_date: new Date().toISOString(),
          me_epp_tiebreaker_reduction: percentageReduction,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProposal.id);

      toast({
        title: "Proposta atualizada",
        description: "Sua proposta foi atualizada com sucesso no desempate ficto.",
      });

      onSubmit();
    } catch (error) {
      console.error("Error submitting tiebreaker proposal:", error);
      toast({
        title: "Erro ao enviar proposta",
        description: "Ocorreu um erro ao enviar sua proposta de desempate.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempate Ficto - ME/EPP</CardTitle>
        <CardDescription>
          Como ME/EPP, você tem direito a apresentar uma nova proposta com valor inferior à melhor
          classificada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Melhor Preço Atual</Label>
              <div className="text-lg font-bold">
                {bestPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
            <div>
              <Label>Seu Preço Atual</Label>
              <div className="text-lg font-bold">
                {currentPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3">
            <div className="flex justify-between items-center">
              <span className="text-[1rem] font-medium">Tempo Restante para Desempate</span>
              <span className="text-[1rem] font-bold">{formatTime(timeLeft)}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(timeLeft / 300) * 100}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-price">Novo Preço (R$)</Label>
              <Input
                id="new-price"
                type="text"
                placeholder="0,00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
              <p className="text-[1rem] text-muted-foreground">
                Digite um valor menor que{" "}
                {bestPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading || timeLeft === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : timeLeft === 0 ? (
                "Tempo Esgotado"
              ) : (
                "Enviar Nova Proposta"
              )}
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter className="text-[1rem] text-muted-foreground">
        Conforme Lei Complementar 123/2006, Art. 44 e 45
      </CardFooter>
    </Card>
  );
}
