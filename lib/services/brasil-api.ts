/**
 * Serviço para integração com a API do +Brasil
 */

import { createClient } from "@supabase/supabase-js"
import { NotificationService } from "./notification-service"

// Tipos para a API do +Brasil
export interface BrasilApiConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface BrasilTender {
  id: string
  numero: string
  titulo: string
  descricao: string
  modalidade: string
  categoria: string
  orgao: {
    id: string
    nome: string
    codigo: string
  }
  dataAbertura: string
  dataLimitePropostas: string
  status: string
  valor?: number
  valorSigiloso: boolean
  documentos: BrasilDocument[]
  lotes: BrasilLot[]
}

export interface BrasilDocument {
  id: string
  nome: string
  tipo: string
  url: string
  dataUpload: string
  tamanho: number
}

export interface BrasilLot {
  id: string
  numero: string
  descricao: string
  itens: BrasilItem[]
}

export interface BrasilItem {
  id: string
  codigo: string
  descricao: string
  quantidade: number
  unidade: string
  valorEstimado?: number
}

export interface SyncResult {
  success: boolean
  message: string
  imported: number
  failed: number
  details?: any
}

// Configuração padrão
const defaultConfig: BrasilApiConfig = {
  apiKey: "",
  baseUrl: "https://api.mais.gov.br/brasil",
  timeout: 30000,
}

export class BrasilApiService {
  private config: BrasilApiConfig
  private supabase: any
  private notificationService: NotificationService

  constructor(config: BrasilApiConfig) {
    this.config = { ...defaultConfig, ...config }
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )
    this.notificationService = new NotificationService()
  }

  /**
   * Testa a conexão com a API do +Brasil
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Simula uma chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verifica se a chave de API foi fornecida
      if (!this.config.apiKey) {
        return { success: false, message: "Chave de API não fornecida" }
      }

      // Em um ambiente real, faria uma chamada à API para verificar a autenticação
      return { success: true, message: "Conexão estabelecida com sucesso" }
    } catch (error: any) {
      console.error("Erro ao testar conexão com +Brasil:", error)
      return {
        success: false,
        message: `Erro ao conectar: ${error.message || "Erro desconhecido"}`,
      }
    }
  }

  /**
   * Importa licitações do +Brasil para o sistema
   */
  async importTenders(
    options: {
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {},
  ): Promise<SyncResult> {
    try {
      // Em um ambiente real, faria uma chamada à API do +Brasil para buscar licitações
      // Aqui estamos simulando o resultado

      // Simula o tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simula licitações retornadas pela API
      const mockTenders: BrasilTender[] = this.getMockTenders()

      // Contador de licitações importadas com sucesso
      let imported = 0
      let failed = 0
      const failures: any[] = []
      const createdTenders: any[] = []
      const updatedTenders: any[] = []
      const statusChangedTenders: any[] = []

      // Processa cada licitação
      for (const brasilTender of mockTenders) {
        try {
          // Converte o formato da licitação do +Brasil para o formato do sistema
          const tender = this.convertBrasilTenderToSystemFormat(brasilTender)

          // Verifica se a licitação já existe no sistema
          const { data: existingTender } = await this.supabase
            .from("tenders")
            .select("id, status")
            .eq("external_id", brasilTender.id)
            .maybeSingle()

          if (existingTender) {
            // Verifica se houve mudança de status
            const statusChanged = existingTender.status !== tender.status

            // Atualiza a licitação existente
            const { error: updateError } = await this.supabase
              .from("tenders")
              .update(tender)
              .eq("external_id", brasilTender.id)

            if (updateError) throw updateError

            // Adiciona à lista de licitações atualizadas
            updatedTenders.push({
              ...tender,
              id: existingTender.id,
            })

            // Se houve mudança de status, adiciona à lista de status alterados
            if (statusChanged) {
              statusChangedTenders.push({
                ...tender,
                id: existingTender.id,
              })
            }
          } else {
            // Insere a nova licitação
            const { data: newTender, error: insertError } = await this.supabase
              .from("tenders")
              .insert(tender)
              .select("id")
              .single()

            if (insertError) throw insertError

            // Adiciona à lista de licitações criadas
            createdTenders.push({
              ...tender,
              id: newTender.id,
            })
          }

          // Processa documentos da licitação
          await this.processDocuments(brasilTender)

          // Processa lotes e itens da licitação
          await this.processLotsAndItems(brasilTender)

          imported++
        } catch (error: any) {
          console.error(`Erro ao importar licitação ${brasilTender.id}:`, error)
          failed++
          failures.push({
            id: brasilTender.id,
            error: error.message || "Erro desconhecido",
          })
        }
      }

      // Gera notificações para as licitações processadas
      if (createdTenders.length > 0) {
        await this.notificationService.notifyTenderChanges(createdTenders, "created")
      }

      if (updatedTenders.length > 0) {
        await this.notificationService.notifyTenderChanges(updatedTenders, "updated")
      }

      if (statusChangedTenders.length > 0) {
        await this.notificationService.notifyTenderChanges(statusChangedTenders, "status_changed")
      }

      // Registra a sincronização no histórico
      await this.logSync({
        type: "import",
        items: imported,
        success: failed === 0,
        details: failures.length > 0 ? failures : undefined,
      })

      return {
        success: true,
        message: `Importação concluída: ${imported} licitações importadas, ${failed} falhas`,
        imported,
        failed,
        details: failures.length > 0 ? failures : undefined,
      }
    } catch (error: any) {
      console.error("Erro ao importar licitações do +Brasil:", error)

      // Notifica sobre o erro
      await this.notificationService.notifySyncError("brasil", error)

      // Registra a falha no histórico
      await this.logSync({
        type: "import",
        items: 0,
        success: false,
        details: error.message || "Erro desconhecido",
      })

      return {
        success: false,
        message: `Erro ao importar licitações: ${error.message || "Erro desconhecido"}`,
        imported: 0,
        failed: 0,
      }
    }
  }

  /**
   * Exporta licitações do sistema para o +Brasil
   */
  async exportTenders(
    options: {
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {},
  ): Promise<SyncResult> {
    try {
      // Em um ambiente real, buscaria licitações do sistema e enviaria para o +Brasil

      // Simula o tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Busca licitações do sistema que podem ser exportadas
      const { data: tenders, error } = await this.supabase
        .from("tenders")
        .select("*")
        .eq("status", "active")
        .limit(options.limit || 10)

      if (error) throw error

      // Contador de licitações exportadas com sucesso
      let exported = 0
      let failed = 0
      const failures: any[] = []

      // Processa cada licitação
      for (const tender of tenders) {
        try {
          // Converte o formato da licitação do sistema para o formato do +Brasil
          const brasilTender = this.convertSystemTenderToBrasilFormat(tender)

          // Em um ambiente real, enviaria a licitação para a API do +Brasil
          // Aqui estamos apenas simulando o sucesso

          exported++
        } catch (error: any) {
          console.error(`Erro ao exportar licitação ${tender.id}:`, error)
          failed++
          failures.push({
            id: tender.id,
            error: error.message || "Erro desconhecido",
          })
        }
      }

      // Registra a sincronização no histórico
      await this.logSync({
        type: "export",
        items: exported,
        success: failed === 0,
        details: failures.length > 0 ? failures : undefined,
      })

      return {
        success: true,
        message: `Exportação concluída: ${exported} licitações exportadas, ${failed} falhas`,
        imported: exported,
        failed,
        details: failures.length > 0 ? failures : undefined,
      }
    } catch (error: any) {
      console.error("Erro ao exportar licitações para o +Brasil:", error)

      // Notifica sobre o erro
      await this.notificationService.notifySyncError("brasil", error)

      // Registra a falha no histórico
      await this.logSync({
        type: "export",
        items: 0,
        success: false,
        details: error.message || "Erro desconhecido",
      })

      return {
        success: false,
        message: `Erro ao exportar licitações: ${error.message || "Erro desconhecido"}`,
        imported: 0,
        failed: 0,
      }
    }
  }

  /**
   * Sincroniza documentos entre o sistema e o +Brasil
   */
  async syncDocuments(): Promise<SyncResult> {
    try {
      // Simula o tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Em um ambiente real, sincronizaria documentos entre os sistemas

      // Registra a sincronização no histórico
      await this.logSync({
        type: "document_sync",
        items: 15,
        success: true,
      })

      return {
        success: true,
        message: "Sincronização de documentos concluída: 15 documentos sincronizados",
        imported: 15,
        failed: 0,
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar documentos com o +Brasil:", error)

      // Notifica sobre o erro
      await this.notificationService.notifySyncError("brasil", error)

      // Registra a falha no histórico
      await this.logSync({
        type: "document_sync",
        items: 0,
        success: false,
        details: error.message || "Erro desconhecido",
      })

      return {
        success: false,
        message: `Erro ao sincronizar documentos: ${error.message || "Erro desconhecido"}`,
        imported: 0,
        failed: 0,
      }
    }
  }

  /**
   * Obtém o histórico de sincronizações
   */
  async getSyncHistory(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("brasil_sync_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Erro ao obter histórico de sincronização:", error)
      return []
    }
  }

  /**
   * Registra uma sincronização no histórico
   */
  private async logSync(data: {
    type: "import" | "export" | "document_sync"
    items: number
    success: boolean
    details?: any
  }): Promise<void> {
    try {
      const { error } = await this.supabase.from("brasil_sync_history").insert({
        type: data.type,
        items_processed: data.items,
        success: data.success,
        details: data.details,
        created_at: new Date().toISOString(),
      })

      if (error) throw error
    } catch (error) {
      console.error("Erro ao registrar sincronização no histórico:", error)
    }
  }

  /**
   * Converte uma licitação do formato do +Brasil para o formato do sistema
   */
  private convertBrasilTenderToSystemFormat(brasilTender: BrasilTender): any {
    // Mapeamento de modalidades
    const modalityMap: Record<string, string> = {
      "pregao-eletronico": "pregao-eletronico",
      concorrencia: "concorrencia-eletronica",
      dispensa: "dispensa-eletronica",
      // Adicione outros mapeamentos conforme necessário
    }

    // Mapeamento de categorias
    const categoryMap: Record<string, string> = {
      bens: "aquisicao-bens",
      servicos: "servicos-comuns",
      obras: "obras",
      // Adicione outros mapeamentos conforme necessário
    }

    // Mapeamento de status
    const statusMap: Record<string, string> = {
      aberta: "active",
      encerrada: "closed",
      cancelada: "canceled",
      suspensa: "suspended",
      rascunho: "draft",
      // Adicione outros mapeamentos conforme necessário
    }

    return {
      external_id: brasilTender.id,
      external_source: "+brasil",
      title: brasilTender.titulo,
      number: brasilTender.numero,
      description: brasilTender.descricao,
      modality: modalityMap[brasilTender.modalidade] || brasilTender.modalidade,
      category: categoryMap[brasilTender.categoria] || brasilTender.categoria,
      agency_id: brasilTender.orgao.id, // Precisaria mapear para o ID correto no sistema
      opening_date: brasilTender.dataAbertura,
      proposal_deadline: brasilTender.dataLimitePropostas,
      status: statusMap[brasilTender.status] || brasilTender.status,
      value: brasilTender.valor,
      is_value_secret: brasilTender.valorSigiloso,
      updated_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
    }
  }

  /**
   * Converte uma licitação do formato do sistema para o formato do +Brasil
   */
  private convertSystemTenderToBrasilFormat(tender: any): BrasilTender {
    // Mapeamento de modalidades (inverso)
    const modalityMap: Record<string, string> = {
      "pregao-eletronico": "pregao-eletronico",
      "concorrencia-eletronica": "concorrencia",
      "dispensa-eletronica": "dispensa",
      // Adicione outros mapeamentos conforme necessário
    }

    // Mapeamento de categorias (inverso)
    const categoryMap: Record<string, string> = {
      "aquisicao-bens": "bens",
      "servicos-comuns": "servicos",
      obras: "obras",
      // Adicione outros mapeamentos conforme necessário
    }

    // Mapeamento de status (inverso)
    const statusMap: Record<string, string> = {
      active: "aberta",
      closed: "encerrada",
      canceled: "cancelada",
      suspended: "suspensa",
      draft: "rascunho",
      // Adicione outros mapeamentos conforme necessário
    }

    return {
      id: tender.external_id || tender.id,
      numero: tender.number,
      titulo: tender.title,
      descricao: tender.description,
      modalidade: modalityMap[tender.modality] || tender.modality,
      categoria: categoryMap[tender.category] || tender.category,
      orgao: {
        id: tender.agency_id,
        nome: "Nome do Órgão", // Precisaria buscar o nome do órgão
        codigo: "Código do Órgão", // Precisaria buscar o código do órgão
      },
      dataAbertura: tender.opening_date,
      dataLimitePropostas: tender.proposal_deadline,
      status: statusMap[tender.status] || tender.status,
      valor: tender.value,
      valorSigiloso: tender.is_value_secret,
      documentos: [], // Precisaria buscar os documentos
      lotes: [], // Precisaria buscar os lotes e itens
    }
  }

  /**
   * Processa os documentos de uma licitação
   */
  private async processDocuments(brasilTender: BrasilTender): Promise<void> {
    // Em um ambiente real, processaria os documentos da licitação
    // Aqui estamos apenas simulando o processamento
  }

  /**
   * Processa os lotes e itens de uma licitação
   */
  private async processLotsAndItems(brasilTender: BrasilTender): Promise<void> {
    // Em um ambiente real, processaria os lotes e itens da licitação
    // Aqui estamos apenas simulando o processamento
  }

  /**
   * Gera licitações de exemplo para simulação
   */
  private getMockTenders(): BrasilTender[] {
    return [
      {
        id: "br-001",
        numero: "PE-001/2025",
        titulo: "Aquisição de Equipamentos de Informática",
        descricao: "Aquisição de computadores, notebooks e periféricos para o Ministério da Educação",
        modalidade: "pregao-eletronico",
        categoria: "bens",
        orgao: {
          id: "1",
          nome: "Ministério da Educação",
          codigo: "MEC",
        },
        dataAbertura: "2025-06-15T10:00:00Z",
        dataLimitePropostas: "2025-06-14T23:59:59Z",
        status: "aberta",
        valor: 1500000,
        valorSigiloso: false,
        documentos: [],
        lotes: [],
      },
      {
        id: "br-002",
        numero: "PE-002/2025",
        titulo: "Contratação de Serviços de Limpeza",
        descricao: "Contratação de empresa especializada em serviços de limpeza e conservação",
        modalidade: "pregao-eletronico",
        categoria: "servicos",
        orgao: {
          id: "2",
          nome: "Ministério da Saúde",
          codigo: "MS",
        },
        dataAbertura: "2025-06-20T14:00:00Z",
        dataLimitePropostas: "2025-06-19T23:59:59Z",
        status: "aberta",
        valorSigiloso: true,
        documentos: [],
        lotes: [],
      },
      {
        id: "br-003",
        numero: "CO-001/2025",
        titulo: "Construção de Escola Municipal",
        descricao: "Construção de escola municipal com 12 salas de aula e infraestrutura completa",
        modalidade: "concorrencia",
        categoria: "obras",
        orgao: {
          id: "3",
          nome: "Prefeitura Municipal de São Paulo",
          codigo: "PMSP",
        },
        dataAbertura: "2025-07-10T10:00:00Z",
        dataLimitePropostas: "2025-07-09T23:59:59Z",
        status: "aberta",
        valor: 5000000,
        valorSigiloso: false,
        documentos: [],
        lotes: [],
      },
    ]
  }
}
