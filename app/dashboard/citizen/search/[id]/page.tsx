"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Building,
  FileText,
  Download,
  Eye,
  MapPin,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data - em produção viria do Supabase
const mockTender = {
  id: "1",
  title: "Aquisição de equipamentos de informática",
  number: "Pregão Eletrônico nº 001/2025",
  description:
    "Processo para aquisição de equipamentos de informática para modernização do parque tecnológico da administração pública municipal, incluindo computadores, notebooks, impressoras e equipamentos de rede.",
  agency: {
    name: "Ministério da Educação",
    cnpj: "00.394.445/0001-07",
    address: "Esplanada dos Ministérios, Bloco L - Brasília/DF",
  },
  modality: "Pregão Eletrônico",
  category: "Aquisição de bens",
  status: "Publicada",
  publicationDate: "2025-06-05T10:00:00",
  openingDate: "2025-06-20T10:00:00",
  closingDate: "2025-06-19T17:00:00",
  clarificationDeadline: "2025-06-15T17:00:00",
  impugnationDeadline: "2025-06-15T17:00:00",
  estimatedValue: 1500000,
  isValueSecret: false,
  exclusiveMeEpp: true,
  lots: [
    {
      id: "1",
      number: 1,
      description: "Computadores Desktop",
      items: [
        {
          id: "1",
          number: 1,
          description: "Computador Desktop Intel Core i5, 8GB RAM, 256GB SSD",
          quantity: 50,
          unit: "unidade",
          estimatedValue: 2500,
        },
        {
          id: "2",
          number: 2,
          description: "Monitor LED 24 polegadas Full HD",
          quantity: 50,
          unit: "unidade",
          estimatedValue: 800,
        },
      ],
    },
    {
      id: "2",
      number: 2,
      description: "Notebooks",
      items: [
        {
          id: "3",
          number: 1,
          description: "Notebook Intel Core i7, 16GB RAM, 512GB SSD",
          quantity: 30,
          unit: "unidade",
          estimatedValue: 4500,
        },
      ],
    },
  ],
  documents: [
    {
      id: "1",
      name: "Edital Completo",
      type: "edital",
      size: "2.5 MB",
      uploadDate: "2025-06-05T10:00:00",
    },
    {
      id: "2",
      name: "Termo de Referência",
      type: "termo_referencia",
      size: "1.8 MB",
      uploadDate: "2025-06-05T10:00:00",
    },
    {
      id: "3",
      name: "Planilha de Preços",
      type: "planilha",
      size: "0.5 MB",
      uploadDate: "2025-06-05T10:00:00",
    },
  ],
};

export default function CitizenTenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const [tender] = useState(mockTender);
  const [activeTab, setActiveTab] = useState("overview");

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; color: string }> = {
      Publicada: { label: "Publicada", variant: "default", color: "bg-green-100 text-green-800" },
      "Aguardando abertura": {
        label: "Aguardando abertura",
        variant: "secondary",
        color: "bg-blue-100 text-blue-800",
      },
      "Em disputa": {
        label: "Em disputa",
        variant: "warning",
        color: "bg-yellow-100 text-yellow-800",
      },
      "Em andamento": {
        label: "Em andamento",
        variant: "default",
        color: "bg-blue-100 text-blue-800",
      },
      Homologada: { label: "Homologada", variant: "success", color: "bg-green-100 text-green-800" },
      Revogada: { label: "Revogada", variant: "destructive", color: "bg-red-100 text-red-800" },
      Anulada: { label: "Anulada", variant: "destructive", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline",
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${config.color} border-0 px-3 py-1 font-medium`}>{config.label}</Badge>
    );
  };

  const getTotalValue = () => {
    return tender.lots.reduce((total, lot) => {
      return (
        total +
        lot.items.reduce((lotTotal, item) => {
          return lotTotal + item.quantity * item.estimatedValue;
        }, 0)
      );
    }, 0);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{tender.title}</h1>
            <p className="text-lg text-gray-600">{tender.number}</p>
          </div>
          {getStatusBadge(tender.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Publicação</p>
                  <p className="text-sm text-gray-600">{formatDate(tender.publicationDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Abertura</p>
                  <p className="text-sm text-gray-600">{formatDate(tender.openingDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Valor Estimado</p>
                  <p className="text-sm text-gray-600">
                    {tender.isValueSecret ? "Sigiloso" : formatCurrency(getTotalValue())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Modalidade</p>
                  <p className="text-sm text-gray-600">{tender.modality}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="lots">Lotes e Itens</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-600">{tender.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Categoria</h4>
                    <p className="text-gray-600">{tender.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Modalidade</h4>
                    <p className="text-gray-600">{tender.modality}</p>
                  </div>
                </div>

                {tender.exclusiveMeEpp && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Exclusivo para ME/EPP</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Esta licitação é exclusiva para Microempresas e Empresas de Pequeno Porte.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Órgão Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Nome</h4>
                  <p className="text-gray-600">{tender.agency.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">CNPJ</h4>
                  <p className="text-gray-600">{tender.agency.cnpj}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Endereço</h4>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-600">{tender.agency.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prazos Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Publicação</h4>
                  <p className="text-sm text-gray-600">{formatDate(tender.publicationDate)}</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Esclarecimentos até</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(tender.clarificationDeadline)}
                  </p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Impugnações até</h4>
                  <p className="text-sm text-gray-600">{formatDate(tender.impugnationDeadline)}</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">Abertura</h4>
                  <p className="text-sm text-gray-600">{formatDate(tender.openingDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lots" className="space-y-6">
          {tender.lots.map((lot) => (
            <Card key={lot.id}>
              <CardHeader>
                <CardTitle>
                  Lote {lot.number}: {lot.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lot.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Item {item.number}: {item.description}
                          </h4>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Quantidade</p>
                          <p className="font-medium">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Valor Unitário Estimado</p>
                          <p className="font-medium">{formatCurrency(item.estimatedValue)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Valor Total do Item:</span>{" "}
                          {formatCurrency(item.quantity * item.estimatedValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos da Licitação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tender.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-600">
                          {doc.size} • Enviado em {formatDate(doc.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma da Licitação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Publicação do Edital</h4>
                    <p className="text-sm text-gray-600">{formatDate(tender.publicationDate)}</p>
                    <p className="text-sm text-green-600 font-medium">Concluído</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Prazo para Esclarecimentos</h4>
                    <p className="text-sm text-gray-600">
                      Até {formatDate(tender.clarificationDeadline)}
                    </p>
                    <p className="text-sm text-yellow-600 font-medium">Em andamento</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Prazo para Impugnações</h4>
                    <p className="text-sm text-gray-600">
                      Até {formatDate(tender.impugnationDeadline)}
                    </p>
                    <p className="text-sm text-yellow-600 font-medium">Em andamento</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Prazo para Propostas</h4>
                    <p className="text-sm text-gray-600">Até {formatDate(tender.closingDate)}</p>
                    <p className="text-sm text-gray-500 font-medium">Aguardando</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Abertura da Sessão Pública</h4>
                    <p className="text-sm text-gray-600">{formatDate(tender.openingDate)}</p>
                    <p className="text-sm text-gray-500 font-medium">Aguardando</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
