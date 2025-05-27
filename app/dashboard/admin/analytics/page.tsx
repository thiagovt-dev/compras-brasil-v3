"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// Mock data for charts
const tendersByMonth = [
  { name: "Jan", count: 65 },
  { name: "Fev", count: 59 },
  { name: "Mar", count: 80 },
  { name: "Abr", count: 81 },
  { name: "Mai", count: 56 },
  { name: "Jun", count: 55 },
  { name: "Jul", count: 40 },
  { name: "Ago", count: 70 },
  { name: "Set", count: 90 },
  { name: "Out", count: 110 },
  { name: "Nov", count: 95 },
  { name: "Dez", count: 85 },
]

const userRegistrationData = [
  { name: "Jan", citizen: 40, supplier: 24, agency: 10 },
  { name: "Fev", citizen: 30, supplier: 13, agency: 5 },
  { name: "Mar", citizen: 20, supplier: 28, agency: 12 },
  { name: "Abr", citizen: 27, supplier: 39, agency: 8 },
  { name: "Mai", citizen: 18, supplier: 48, agency: 11 },
  { name: "Jun", citizen: 23, supplier: 38, agency: 9 },
  { name: "Jul", citizen: 34, supplier: 43, agency: 14 },
  { name: "Ago", citizen: 45, supplier: 55, agency: 16 },
  { name: "Set", citizen: 65, supplier: 60, agency: 20 },
  { name: "Out", citizen: 75, supplier: 70, agency: 25 },
  { name: "Nov", citizen: 85, supplier: 75, agency: 30 },
  { name: "Dez", citizen: 95, supplier: 80, agency: 35 },
]

const tenderStatusData = [
  { name: "Em andamento", value: 45, color: "#0ea5e9" },
  { name: "Concluídas", value: 30, color: "#22c55e" },
  { name: "Canceladas", value: 15, color: "#ef4444" },
  { name: "Em preparação", value: 10, color: "#f59e0b" },
]

const tenderCategoryData = [
  { name: "Obras", value: 35 },
  { name: "Serviços", value: 40 },
  { name: "Materiais", value: 25 },
]

const tenderValueData = [
  { name: "Jan", value: 1200000 },
  { name: "Fev", value: 900000 },
  { name: "Mar", value: 1500000 },
  { name: "Abr", value: 1800000 },
  { name: "Mai", value: 1200000 },
  { name: "Jun", value: 2000000 },
  { name: "Jul", value: 1700000 },
  { name: "Ago", value: 2200000 },
  { name: "Set", value: 2500000 },
  { name: "Out", value: 2800000 },
  { name: "Nov", value: 3000000 },
  { name: "Dez", value: 3200000 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('year')
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
            <p className="text-muted-foreground">
              Visualize estatísticas e tendências do sistema
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Licitações
              </CardTitle>
              <CardDescription>Todas as licitações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">831</div>
              <p className="text-xs text-muted-foreground">
                +16.2% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Registrados
              </CardTitle>
              <CardDescription>Total de usuários no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2,543</div>
              <p className="text-xs text-muted-foreground">
                +12.5% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Valor Total
              </CardTitle>
              <CardDescription>Valor total das licitações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">R$ 21.8M</div>
              <p className="text-xs text-muted-foreground">
                +22.5% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conclusão
              </CardTitle>
              <CardDescription>Licitações concluídas com sucesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">78.2%</div>
              <p className="text-xs text-muted-foreground">
                +4.1% em relação ao período anterior
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="tenders">Licitações</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Licitações por Mês</CardTitle>
                  <CardDescription>
                    Número de licitações criadas por mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tendersByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} licitações`, 'Quantidade']} />
                        <Bar dataKey="count" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Status das Licitações</CardTitle>
                  <CardDescription>
                    Distribuição por status atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tenderStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tenderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} licitações`, 'Let\'s create a loading state for the analytics dashboard:']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>\
