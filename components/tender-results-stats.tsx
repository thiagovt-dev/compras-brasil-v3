"use client";

import { useEffect, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TenderResultsStatsProps {
  tenderId: string;
}

export function TenderResultsStats({ tenderId }: TenderResultsStatsProps) {
  const supabase = createClientSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>({});
  const [activeTab, setActiveTab] = useState("proposals");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch tender statistics
      const { data: statsData, error: statsError } = await supabase
        .from("tender_statistics")
        .select("*")
        .eq("tender_id", tenderId);

      if (statsError) {
        console.error("Error fetching statistics:", statsError);
        setLoading(false);
        return;
      }

      // Process statistics data
      const processedStats: any = {};

      statsData?.forEach((stat) => {
        processedStats[stat.statistic_type] = stat.statistic_value;
      });

      // If no statistics exist, fetch raw data and calculate
      if (Object.keys(processedStats).length === 0) {
        // Fetch proposals
        const { data: proposalsData } = await supabase
          .from("proposals")
          .select(
            `
            *,
            lot:tender_lots(number, description)
          `
          )
          .eq("tender_id", tenderId);

        // Fetch lots
        const { data: lotsData } = await supabase
          .from("tender_lots")
          .select("*")
          .eq("tender_id", tenderId);

        // Calculate proposals per lot
        const proposalsPerLot =
          lotsData?.map((lot) => {
            const lotProposals = proposalsData?.filter((p) => p.lot_id === lot.id) || [];
            return {
              name: `Lote ${lot.number}`,
              value: lotProposals.length,
              lotId: lot.id,
            };
          }) || [];

        // Calculate suppliers per lot
        const suppliersPerLot =
          lotsData?.map((lot) => {
            const lotProposals = proposalsData?.filter((p) => p.lot_id === lot.id) || [];
            const uniqueSuppliers = new Set(lotProposals.map((p) => p.supplier_id));
            return {
              name: `Lote ${lot.number}`,
              value: uniqueSuppliers.size,
              lotId: lot.id,
            };
          }) || [];

        // Calculate proposal status distribution
        const statusCounts: Record<string, number> = {};
        proposalsData?.forEach((proposal) => {
          statusCounts[proposal.status] = (statusCounts[proposal.status] || 0) + 1;
        });

        const proposalStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
        }));

        processedStats.proposals_per_lot = proposalsPerLot;
        processedStats.suppliers_per_lot = suppliersPerLot;
        processedStats.proposal_status_distribution = proposalStatusDistribution;
      }

      setStatistics(processedStats);
      setLoading(false);
    };

    fetchData();
  }, [tenderId, supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="proposals">Propostas por Lote</TabsTrigger>
        <TabsTrigger value="suppliers">Fornecedores por Lote</TabsTrigger>
        <TabsTrigger value="status">Status das Propostas</TabsTrigger>
      </TabsList>

      <TabsContent value="proposals">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistics.proposals_per_lot || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Propostas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suppliers">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statistics.suppliers_per_lot || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Fornecedores" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="status">
        <Card>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.proposal_status_distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">
                    {(statistics.proposal_status_distribution || []).map(
                      (entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
