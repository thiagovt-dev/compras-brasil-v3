"use client";

import { useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingDown, BarChart3, Percent } from "lucide-react";

interface TenderResultsSavingsProps {
  tenderId: string;
  results?: any;
}

export function TenderResultsSavings({ tenderId, results }: TenderResultsSavingsProps) {
  const supabase = createClientSupabaseClient();
  const [loading, setLoading] = useState(!results);
  const [savingsData, setSavingsData] = useState<any>(results || null);

  useEffect(() => {
    if (results) {
      setSavingsData(results);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch tender results
      const { data, error } = await supabase
        .from("tender_results")
        .select("*")
        .eq("tender_id", tenderId)
        .single();

      if (error) {
        console.error("Error fetching results:", error);

        // If no results exist, fetch tender and calculate
        const { data: tender } = await supabase
          .from("tenders")
          .select("*")
          .eq("id", tenderId)
          .single();

        if (tender) {
          // Fetch winning proposals
          const { data: proposals } = await supabase
            .from("proposals")
            .select("*")
            .eq("tender_id", tenderId)
            .eq("status", "winner");

          const totalValue = proposals?.reduce((sum, p) => sum + (p.total_value || 0), 0) || 0;
          const estimatedValue = tender.estimated_value || 0;
          const savedValue = estimatedValue > totalValue ? estimatedValue - totalValue : 0;
          const savedPercentage = estimatedValue > 0 ? (savedValue / estimatedValue) * 100 : 0;

          setSavingsData({
            total_value: totalValue,
            estimated_value: estimatedValue,
            saved_value: savedValue,
            saved_percentage: savedPercentage,
          });
        }
      } else {
        setSavingsData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [tenderId, results, supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-6 w-[100px]" />
              </div>
              <Skeleton className="h-2 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!savingsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Não há dados de economia disponíveis para esta licitação.
        </p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 p-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-[1rem] font-medium">Valor Estimado</span>
              </div>
              <span className="text-lg font-bold">
                {formatCurrency(savingsData.estimated_value || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-[1rem] font-medium">Valor Final</span>
              </div>
              <span className="text-lg font-bold">
                {formatCurrency(savingsData.total_value || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-purple-100 p-2">
                <TrendingDown className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-[1rem] font-medium">Economia Gerada</span>
            </div>
            <span className="text-lg font-bold">
              {formatCurrency(savingsData.saved_value || 0)}
            </span>
          </div>
          <Progress value={savingsData.saved_percentage || 0} className="h-2" />
          <div className="flex justify-end mt-1">
            <span className="text-[1rem] text-muted-foreground">
              {formatPercentage(savingsData.saved_percentage || 0)} do valor estimado
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-yellow-100 p-2">
                <Percent className="h-4 w-4 text-yellow-600" />
              </div>
              <span className="text-[1rem] font-medium">Percentual de Economia</span>
            </div>
            <span className="text-lg font-bold">
              {formatPercentage(savingsData.saved_percentage || 0)}
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-500"
              style={{ width: `${Math.min(savingsData.saved_percentage || 0, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
