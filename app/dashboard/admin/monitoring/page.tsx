"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle, CheckCircle, Clock, Database, HardDrive, RefreshCw, Server, Zap } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data - in a real app, this would come from an API
const cpuUsageData = [
  { time: "00:00", usage: 42 },
  { time: "01:00", usage: 38 },
  { time: "02:00", usage: 35 },
  { time: "03:00", usage: 30 },
  { time: "04:00", usage: 32 },
  { time: "05:00", usage: 35 },
  { time: "06:00", usage: 45 },
  { time: "07:00", usage: 52 },
  { time: "08:00", usage: 68 },
  { time: "09:00", usage: 75 },
  { time: "10:00", usage: 82 },
  { time: "11:00", usage: 78 },
  { time: "12:00", usage: 75 },
  { time: "13:00", usage: 72 },
  { time: "14:00", usage: 68 },
  { time: "15:00", usage: 65 },
  { time: "16:00", usage: 62 },
  { time: "17:00", usage: 58 },
  { time: "18:00", usage: 55 },
  { time: "19:00", usage: 48 },
  { time: "20:00", usage: 45 },
  { time: "21:00", usage: 42 },
  { time: "22:00", usage: 40 },
  { time: "23:00", usage: 38 },
]

const memoryUsageData = [
  { time: "00:00", usage: 55 },
  { time: "01:00", usage: 54 },
  { time: "02:00", usage: 52 },
  { time: "03:00", usage: 50 },
  { time: "04:00", usage: 48 },
  { time: "05:00", usage: 50 },
  { time: "06:00", usage: 52 },
  { time: "07:00", usage: 58 },
  { time: "08:00", usage: 65 },
  { time: "09:00", usage: 72 },
  { time: "10:00", usage: 78 },
  { time: "11:00", usage: 75 },
  { time: "12:00", usage: 72 },
  { time: "13:00", usage: 70 },
  { time: "14:00", usage: 68 },
  { time: "15:00", usage: 65 },
  { time: "16:00", usage: 62 },
  { time: "17:00", usage: 60 },
  { time: "18:00", usage: 58 },
  { time: "19:00", usage: 55 },
  { time: "20:00", usage: 52 },
  { time: "21:00", usage: 50 },
  { time: "22:00", usage: 48 },
  { time: "23:00", usage: 45 },
]

const recentAlerts = [
  { id: 1, type: "warning", message: "High CPU usage detected on API server", time: "15 minutes ago" },
  { id: 2, type: "error", message: "Database connection timeout", time: "45 minutes ago" },
  { id: 3, type: "info", message: "System backup completed successfully", time: "2 hours ago" },
  { id: 4, type: "warning", message: "Memory usage above 80% threshold", time: "3 hours ago" },
  { id: 5, type: "error", message: "Failed login attempts from suspicious IP", time: "5 hours ago" },
]

const services = [
  { id: 1, name: "API Server", status: "operational", uptime: "99.98%", lastIncident: "3 days ago" },
  { id: 2, name: "Database", status: "operational", uptime: "99.95%", lastIncident: "1 week ago" },
  { id: 3, name: "Authentication Service", status: "operational", uptime: "99.99%", lastIncident: "2 weeks ago" },
  { id: 4, name: "Storage Service", status: "degraded", uptime: "98.75%", lastIncident: "Ongoing" },
  { id: 5, name: "Email Service", status: "operational", uptime: "99.90%", lastIncident: "5 days ago" },
  { id: 6, name: "Search Service", status: "operational", uptime: "99.92%", lastIncident: "4 days ago" },
]

export default function AdminMonitoringPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Monitoramento do Sistema</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Última atualização: {currentTime.toLocaleTimeString()}</div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+12% em relação à média</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memória</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <Progress value={72} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">+8% em relação à média</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <Progress value={45} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Normal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125ms</div>
            <Progress value={25} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">-5ms em relação à média</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Uso de CPU</CardTitle>
                <CardDescription>Uso de CPU nas últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    usage: {
                      label: "Uso (%)",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="usage"
                        stroke="var(--color-usage)"
                        fill="var(--color-usage)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Pico de 82% às 10:00</p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Memória</CardTitle>
                <CardDescription>Uso de memória nas últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={{
                    usage: {
                      label: "Uso (%)",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memoryUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="usage"
                        stroke="var(--color-usage)"
                        fill="var(--color-usage)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">Pico de 78% às 10:00</p>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>Últimos 5 alertas do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.type === "error" ? "destructive" : alert.type === "warning" ? "default" : "outline"}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                      {alert.type === "error" ? "Erro" : alert.type === "warning" ? "Aviso" : "Informação"}
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Serviços</CardTitle>
              <CardDescription>Status atual e tempo de atividade dos serviços do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Último Incidente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {service.status === "operational" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Operacional
                            </Badge>
                          ) : service.status === "degraded" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Clock className="mr-1 h-3 w-3" />
                              Degradado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Inoperante
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.uptime}</TableCell>
                      <TableCell>{service.lastIncident}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configuração de Alertas</CardTitle>
                <CardDescription>Gerencie os alertas e notificações do sistema</CardDescription>
              </div>
              <Button size="sm">Adicionar Alerta</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerta de CPU</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando o uso de CPU exceder 80% por mais de 5 minutos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerta de Memória</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando o uso de memória exceder 85% por mais de 10 minutos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerta de Banco de Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando o tempo de resposta do banco de dados exceder 500ms
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerta de Disco</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando o espaço em disco for menor que 10%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerta de Falha de Login</h4>
                      <p className="text-sm text-muted-foreground">
                        Notificar quando houver mais de 5 falhas de login consecutivas para um usuário
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
