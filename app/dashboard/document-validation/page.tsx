"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Download,
  Eye,
} from "lucide-react"

// Mock document types
const documentTypes = [
  { id: "1", name: "Certidão Negativa de Débitos Federais" },
  { id: "2", name: "Certidão Negativa de Débitos Estaduais" },
  { id: "3", name: "Certidão Negativa de Débitos Municipais" },
  { id: "4", name: "Certidão de Regularidade do FGTS" },
  { id: "5", name: "Certidão Negativa de Débitos Trabalhistas" },
  { id: "6", name: "Contrato Social" },
  { id: "7", name: "Balanço Patrimonial" },
  { id: "8", name: "Atestado de Capacidade Técnica" },
]

// Mock validation history
const validationHistory = [
  {
    id: "1",
    documentName: "Certidão Negativa de Débitos Federais",
    status: "valid",
    date: "15/05/2025",
    time: "14:30",
    validUntil: "15/08/2025",
  },
  {
    id: "2",
    documentName: "Certidão Negativa de Débitos Estaduais",
    status: "valid",
    date: "14/05/2025",
    time: "09:15",
    validUntil: "14/08/2025",
  },
  {
    id: "3",
    documentName: "Certidão Negativa de Débitos Municipais",
    status: "expired",
    date: "10/02/2025",
    time: "11:20",
    validUntil: "10/05/2025",
  },
  {
    id: "4",
    documentName: "Certidão de Regularidade do FGTS",
    status: "invalid",
    date: "12/05/2025",
    time: "16:45",
    error: "Documento com informações inconsistentes",
  },
  {
    id: "5",
    documentName: "Contrato Social",
    status: "pending",
    date: "15/05/2025",
    time: "15:10",
  },
]

export default function DocumentValidationPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocumentType, setSelectedDocumentType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para upload.",
        variant: "destructive",
      })
      return
    }

    if (!selectedDocumentType) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de documento.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)

      setTimeout(() => {
        setIsUploading(false)
        setSelectedFile(null)
        setSelectedDocumentType("")

        toast({
          title: "Upload concluído",
          description: "O documento foi enviado para validação com sucesso.",
        })
      }, 500)
    }, 3000)
  }

  const filteredHistory = validationHistory.filter((item) =>
    item.documentName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Válido
          </Badge>
        )
      case "invalid":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">
            <XCircle className="mr-1 h-3 w-3" />
            Inválido
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Expirado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validação de Documentos</h1>
          <p className="text-muted-foreground">Valide documentos para participação em licitações</p>
        </div>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documento</CardTitle>
              <CardDescription>Envie um documento para validação automática</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <select
                    id="documentType"
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione o tipo de documento</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedDocumentType}>
                      {isUploading ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, JPG, JPEG, PNG. Tamanho máximo: 10MB.
                  </p>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Progresso do upload</span>
                      <span className="text-sm">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Validação Automática</h3>
                  <p className="text-sm text-muted-foreground">
                    Nosso sistema validará automaticamente seu documento após o upload. O processo pode levar alguns
                    minutos dependendo do tipo de documento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos Necessários</CardTitle>
              <CardDescription>Lista de documentos necessários para participação em licitações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentTypes.map((type) => {
                  const doc = validationHistory.find((item) => item.documentName === type.name)

                  return (
                    <div key={type.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{type.name}</h4>
                          {doc && (
                            <p className="text-sm text-muted-foreground">
                              {doc.status === "valid" && `Válido até ${doc.validUntil}`}
                              {doc.status === "expired" && `Expirado em ${doc.validUntil}`}
                              {doc.status === "invalid" && doc.error}
                              {doc.status === "pending" && "Em análise"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc ? (
                          <>
                            {getStatusBadge(doc.status)}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="mr-1 h-4 w-4" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Validações</CardTitle>
              <CardDescription>Visualize o histórico de validações de documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {filteredHistory.length > 0 ? (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div
                        className={`rounded-full p-2 ${
                          item.status === "valid"
                            ? "bg-green-100"
                            : item.status === "invalid"
                              ? "bg-red-100"
                              : item.status === "expired"
                                ? "bg-amber-100"
                                : "bg-blue-100"
                        }`}
                      >
                        {item.status === "valid" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : item.status === "invalid" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : item.status === "expired" ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-medium">{item.documentName}</h3>
                          <div className="mt-1 sm:mt-0">{getStatusBadge(item.status)}</div>
                        </div>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                          <span>
                            Enviado em {item.date} às {item.time}
                          </span>
                          {item.validUntil && (
                            <>
                              <div className="hidden sm:block">•</div>
                              <span>
                                {item.status === "expired"
                                  ? `Expirou em ${item.validUntil}`
                                  : `Válido até ${item.validUntil}`}
                              </span>
                            </>
                          )}
                          {item.error && (
                            <>
                              <div className="hidden sm:block">•</div>
                              <span className="text-red-500">{item.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileCheck className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Nenhum documento encontrado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? "Nenhum documento corresponde à sua pesquisa."
                      : "Você ainda não enviou nenhum documento para validação."}
                  </p>
                  {searchTerm && (
                    <Button className="mt-4" variant="outline" onClick={() => setSearchTerm("")}>
                      Limpar pesquisa
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
