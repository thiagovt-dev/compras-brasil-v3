"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, AlertCircle } from "lucide-react";

interface TenderDocumentsProps {
  tender: any;
  usingMockData?: boolean;
}

// Função para gerar documentos mockados
const generateMockDocuments = (tenderId: string) => {
  return [
    {
      id: "mock-doc-1",
      tender_id: tenderId,
      name: "Edital de Licitação - Pregão Eletrônico",
      file_path: "mock-edital.pdf",
      file_size: 2458752, // ~2.4MB
      mime_type: "application/pdf",
      description: "Edital completo da licitação com todas as especificações e condições",
      created_at: new Date().toISOString(),
      is_mock: true,
    },
    {
      id: "mock-doc-2",
      tender_id: tenderId,
      name: "Termo de Referência",
      file_path: "mock-termo-referencia.pdf",
      file_size: 1024000, // ~1MB
      mime_type: "application/pdf",
      description: "Especificações técnicas detalhadas dos itens licitados",
      created_at: new Date().toISOString(),
      is_mock: true,
    },
    {
      id: "mock-doc-3",
      tender_id: tenderId,
      name: "Anexo I - Planilha Orçamentária",
      file_path: "mock-planilha.xlsx",
      file_size: 512000, // ~500KB
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      description: "Planilha com estimativa de custos e quantitativos",
      created_at: new Date().toISOString(),
      is_mock: true,
    },
    {
      id: "mock-doc-4",
      tender_id: tenderId,
      name: "Minuta do Contrato",
      file_path: "mock-minuta-contrato.pdf",
      file_size: 756000, // ~750KB
      mime_type: "application/pdf",
      description: "Modelo de contrato a ser firmado com o fornecedor vencedor",
      created_at: new Date().toISOString(),
      is_mock: true,
    },
  ];
};

export function TenderDocuments({ tender, usingMockData = false }: TenderDocumentsProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);

        if (usingMockData || tender?.is_mock) {
          // Usar dados mockados
          const mockDocs = generateMockDocuments(tender.id);
          setDocuments(mockDocs);
        } else if (tender?.documents && tender.documents.length > 0) {
          // Usar dados reais se disponíveis
          setDocuments(tender.documents);
        } else {
          // Fallback para dados mockados se não houver documentos reais
          console.log("Nenhum documento real encontrado, usando dados mockados");
          const mockDocs = generateMockDocuments(tender.id);
          setDocuments(mockDocs);
        }
      } catch (error) {
        console.error("Erro ao carregar documentos:", error);
        // Em caso de erro, usar dados mockados
        const mockDocs = generateMockDocuments(tender.id);
        setDocuments(mockDocs);
      } finally {
        setLoading(false);
      }
    };

    if (tender?.id) {
      loadDocuments();
    }
  }, [tender, usingMockData]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (doc: any) => {
    if (doc.is_mock) {
      // Para documentos mockados, mostrar toast informativo
      alert("Este é um documento de demonstração. Em um sistema real, o download seria iniciado automaticamente.");
      return;
    }

    // Para documentos reais, fazer o download
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${doc.file_path}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicador de dados mockados */}
      {(usingMockData || tender?.is_mock) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            <strong>Documentos de demonstração:</strong> Estes são documentos de exemplo para fins de demonstração.
          </p>
        </div>
      )}

      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-base">{doc.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</span>
                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                    {doc.is_mock && (
                      <span className="text-amber-600 font-medium">Demo</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(doc)}
                className="shrink-0"
              >
                <Download className="mr-2 h-4 w-4" />
                {doc.is_mock ? "Demo" : "Baixar"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhum documento disponível.</p>
        </div>
      )}
    </div>
  );
}