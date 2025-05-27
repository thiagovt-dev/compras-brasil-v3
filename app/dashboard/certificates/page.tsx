"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Shield, Upload, Trash2, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [certificateType, setCertificateType] = useState("pfx")
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Carregar certificados do usuário
  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data, error } = await supabase
          .from("digital_certificates")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setCertificates(data || [])
      } catch (error) {
        console.error("Erro ao buscar certificados:", error)
        toast({
          title: "Erro ao carregar certificados",
          description: "Não foi possível carregar seus certificados digitais. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [supabase, router, toast])

  // Fazer upload de certificado
  const uploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!certificateFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo de certificado para fazer upload.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Gerar nome único para o arquivo
      const fileExt = certificateFile.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `certificates/${user.id}/${fileName}`

      // Fazer upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage.from("certificates").upload(filePath, certificateFile, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Obter URL pública do arquivo
      const {
        data: { publicUrl },
      } = supabase.storage.from("certificates").getPublicUrl(filePath)

      // Extrair informações do certificado via API
      const formData = new FormData()
      formData.append("certificate", certificateFile)
      formData.append("password", password)
      formData.append("type", certificateType)

      const response = await fetch("/api/certificates/extract-info", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao extrair informações do certificado")
      }

      const certificateInfo = await response.json()

      // Salvar informações do certificado no banco de dados
      const { error: dbError } = await supabase.from("digital_certificates").insert({
        user_id: user.id,
        file_path: filePath,
        public_url: publicUrl,
        certificate_type: certificateType,
        subject_name: certificateInfo.subject.commonName || certificateInfo.subject.name || "Nome não disponível",
        issuer:
          certificateInfo.issuer.commonName || certificateInfo.issuer.organizationName || "Emissor não disponível",
        valid_from: certificateInfo.validFrom,
        valid_to: certificateInfo.validTo,
        serial_number: certificateInfo.serialNumber,
        thumbprint: certificateInfo.thumbprint,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (dbError) throw dbError

      // Atualizar lista de certificados
      const { data: newCertificates, error } = await supabase
        .from("digital_certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCertificates(newCertificates || [])

      toast({
        title: "Certificado enviado com sucesso",
        description: "Seu certificado digital foi enviado e está disponível para uso.",
      })

      // Limpar formulário
      setCertificateFile(null)
      setPassword("")
      setDialogOpen(false)
    } catch (error: any) {
      console.error("Erro ao fazer upload do certificado:", error)
      toast({
        title: "Erro ao enviar certificado",
        description: error.message || "Ocorreu um erro ao enviar seu certificado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Revogar certificado
  const revokeCertificate = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar este certificado? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("digital_certificates")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      // Atualizar lista de certificados
      setCertificates(
        certificates.map((cert) =>
          cert.id === id ? { ...cert, status: "revoked", updated_at: new Date().toISOString() } : cert,
        ),
      )

      toast({
        title: "Certificado revogado",
        description: "O certificado foi revogado com sucesso e não pode mais ser usado para assinaturas.",
      })
    } catch (error) {
      console.error("Erro ao revogar certificado:", error)
      toast({
        title: "Erro ao revogar certificado",
        description: "Ocorreu um erro ao revogar o certificado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Verificar se o certificado está expirado
  const isCertificateExpired = (validTo: string) => {
    return new Date(validTo) < new Date()
  }

  // Renderizar status do certificado
  const renderCertificateStatus = (certificate: any) => {
    if (certificate.status === "revoked") {
      return (
        <div className="flex items-center text-destructive">
          <XCircle className="mr-1 h-4 w-4" />
          <span>Revogado</span>
        </div>
      )
    }

    if (isCertificateExpired(certificate.valid_to)) {
      return (
        <div className="flex items-center text-amber-500">
          <AlertTriangle className="mr-1 h-4 w-4" />
          <span>Expirado</span>
        </div>
      )
    }

    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="mr-1 h-4 w-4" />
        <span>Ativo</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Certificados Digitais</h2>
          <p className="text-muted-foreground">Gerencie seus certificados para assinatura digital de documentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Adicionar Certificado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Certificado Digital</DialogTitle>
              <DialogDescription>
                Faça upload do seu certificado digital para usar na assinatura de documentos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={uploadCertificate} className="space-y-4">
              <Tabs defaultValue="pfx" onValueChange={(value) => setCertificateType(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pfx">Certificado PFX/P12</TabsTrigger>
                  <TabsTrigger value="pem">Certificado PEM</TabsTrigger>
                </TabsList>
                <TabsContent value="pfx" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pfx-file">Arquivo do Certificado (.pfx ou .p12)</Label>
                    <Input
                      id="pfx-file"
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pfx-password">Senha do Certificado</Label>
                    <Input
                      id="pfx-password"
                      type="password"
                      placeholder="Digite a senha do certificado"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </TabsContent>
                <TabsContent value="pem" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pem-file">Arquivo do Certificado (.pem, .crt ou .cer)</Label>
                    <Input
                      id="pem-file"
                      type="file"
                      accept=".pem,.crt,.cer"
                      onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-file">Arquivo da Chave Privada (opcional)</Label>
                    <Input id="key-file" type="file" accept=".key,.pem" />
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className={certificate.status === "revoked" ? "opacity-70" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{certificate.subject_name}</CardTitle>
                <CardDescription>
                  {certificate.certificate_type.toUpperCase()} • {certificate.issuer}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {renderCertificateStatus(certificate)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Válido até:</span>
                  <span>{new Date(certificate.valid_to).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adicionado:</span>
                  <span>
                    {formatDistanceToNow(new Date(certificate.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Serial:</span>
                  <span className="truncate max-w-[150px]" title={certificate.serial_number}>
                    {certificate.serial_number}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {certificate.status !== "revoked" && !isCertificateExpired(certificate.valid_to) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => revokeCertificate(certificate.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revogar Certificado
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Você ainda não possui certificados digitais. Clique em "Adicionar Certificado" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
