"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, FileText, Filter } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Sample data - in a real app, this would come from an API
const monthlyData = [
  { month: "Jan", tenders: 12, value: 1200000, completed: 8 },
  { month: "Feb", tenders: 15, value: 1500000, completed: 10 },
  { month: "Mar", tenders: 18, value: 1800000, completed: 12 },
  { month: "Apr", tenders: 14, value: 1400000, completed: 9 },
  { month: "May", tenders: 21, value: 2100000, completed: 15 },
  { month: "Jun", tenders: 25, value: 2500000, completed: 18 },
  { month: "Jul", tenders: 22, value: 2200000, completed: 16 },
  { month: "Aug", tenders: 19, value: 1900000, completed: 14 },
  { month: "Sep", tenders: 23, value: 2300000, completed: 17 },
  { month: "Oct", tenders: 27, value: 2700000, completed: 20 },
  { month: "Nov", tenders: 24, value: 2400000, completed: 18 },
  { month: "Dec", tenders: 20, value: 2000000, completed: 15 },
]

const categoryData = [
  { category: "IT Services", count: 45, value: 4500000 },
  { category: "Construction", count: 32, value: 8200000 },
  { category: "Medical Supplies", count: 28, value: 3600000 },
  { category: "Office Supplies", count: 22, value: 1100000 },
  { category: "Consulting", count: 18, value: 2700000 },
  { category: "Transportation", count: 15, value: 1900000 },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value)
}

export default function AgencyStatisticsPage() {
  const [year, setYear] = useState("2023")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Licitações</h1>
        <div className="flex items-center gap-4">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Licitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">240</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao ano anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(24000000)}</div>
            <p className="text-xs text-muted-foreground">+8% em relação ao ano anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licitações Concluídas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">172</div>
            <p className="text-xs text-muted-foreground">72% de taxa de conclusão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Estimada</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(3600000)}</div>
            <p className="text-xs text-muted-foreground">15% do valor total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="category">Por Categoria</TabsTrigger>
          <TabsTrigger value="status">Por Status</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Licitações por Mês</CardTitle>
              <CardDescription>Número de licitações e valor total por mês no ano {year}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  tenders: {
                    label: "Licitações",
                    color: "hsl(var(--chart-1))",
                  },
                  completed: {
                    label: "Concluídas",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="tenders" stroke="var(--color-tenders)" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor Total por Mês</CardTitle>
              <CardDescription>Valor total das licitações por mês no ano {year}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  value: {
                    label: "Valor (R$)",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-value)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Licitações por Categoria</CardTitle>
              <CardDescription>Distribuição de licitações por categoria no ano {year}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  count: {
                    label: "Quantidade",
                    color: "hsl(var(--chart-4))",
                  },
                  value: {
                    label: "Valor (R$)",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <Separator className="my-6" />
              <ChartContainer
                config={{
                  value: {
                    label: "Valor (R$)",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${value / 1000000}M`} />
                    <YAxis dataKey="category" type="category" width={120} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-value)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Licitações por Status</CardTitle>
              <CardDescription>Distribuição de licitações por status no ano {year}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Dados por status serão implementados em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
