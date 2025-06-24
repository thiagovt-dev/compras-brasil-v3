"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Settings, Download, Gavel, Building } from "lucide-react";

interface DisputeChatDemoProps {
  tenderId: string;
  activeLotId: string | null;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  profile: {
    id: string;
    name: string;
    company_name: string;
    role: string;
    supplierNumber?: number;
  };
  status: string;
  // Adicionar a propriedade systemMessages
  systemMessages?: Array<{ message: string; type: "system" | "auctioneer" }>;
}

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: "chat" | "system" | "bid";
  is_private: boolean;
  recipient_id?: string;
  profiles?: {
    name?: string;
    email?: string;
    role?: string;
  };
};

export function DisputeChatDemo({
  tenderId,
  activeLotId,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  profile,
  status,
  systemMessages = [], // Valor padrão como array vazio
}: DisputeChatDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Simular mensagens iniciais e novas mensagens
  useEffect(() => {
    // Carregar mensagens iniciais (simuladas)
    const initialMessages = [
      {
        id: "msg-demo-001",
        user_id: "auctioneer-demo-001",
        content: "Bem-vindos à sala de disputa de demonstração!",
        created_at: new Date(Date.now() - 120000).toISOString(),
        type: "system" as const,
        is_private: false,
        profiles: { name: "Sistema", role: "system" },
      },
      {
        id: "msg-demo-002",
        user_id: "auctioneer-demo-001",
        content: "Pregoeiro iniciando a sessão. Boa sorte a todos os participantes!",
        created_at: new Date(Date.now() - 110000).toISOString(),
        type: "chat" as const,
        is_private: false,
        profiles: { name: "Maria Santos", role: "auctioneer" },
      },
      {
        id: "msg-demo-003",
        user_id: "supplier-demo-001",
        content: "Olá a todos! Fornecedor ABC presente.",
        created_at: new Date(Date.now() - 90000).toISOString(),
        type: "chat" as const,
        is_private: false,
        profiles: { name: "Fornecedor 15", role: "supplier" },
      },
      {
        id: "msg-demo-004",
        user_id: "supplier-demo-002",
        content: "Fornecedor XYZ também online.",
        created_at: new Date(Date.now() - 60000).toISOString(),
        type: "chat" as const,
        is_private: false,
        profiles: { name: "Fornecedor 22", role: "supplier" },
      },
      {
        id: "msg-demo-005",
        user_id: "auctioneer-demo-001",
        content: "O chat está habilitado para lances e perguntas. Vamos começar!",
        created_at: new Date(Date.now() - 30000).toISOString(),
        type: "chat" as const,
        is_private: false,
        profiles: { name: "Maria Santos", role: "auctioneer" },
      },
    ];

    setMessages(initialMessages);

    // Simular novas mensagens de outros usuários
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        const isFromAuctioneer = Math.random() < 0.3; // 30% chance de ser do pregoeiro
        
        if (isFromAuctioneer) {
          const auctioneerMessages = [
            "Aguardando mais propostas para o lote atual.",
            "Lembrem-se que os lances devem ser menores que o atual.",
            "Tempo restante para lances!",
            "Próximo lote será aberto em breve."
          ];
          const newMessage = {
            id: `msg-${Date.now()}`,
            user_id: "auctioneer-demo-001",
            content: auctioneerMessages[Math.floor(Math.random() * auctioneerMessages.length)],
            type: "chat" as const,
            created_at: new Date().toISOString(),
            is_private: false,
            profiles: {
              name: "Maria Santos",
              role: "auctioneer",
            },
          };
          setMessages((prev) => [...prev, newMessage]);
        } else {
          const randomSupplierId = Math.random() > 0.5 ? "supplier-demo-002" : "supplier-demo-003";
          const randomSupplierName = randomSupplierId === "supplier-demo-002" 
            ? "Fornecedor 8" 
            : "Fornecedor 25";
          const supplierMessages = [
            "Aguardando próximo item...",
            "Sistema funcionando perfeitamente!",
            "Pronto para o próximo lance.",
            "Conexão estável aqui."
          ];
          const newMessage = {
            id: `msg-${Date.now()}`,
            user_id: randomSupplierId,
            content: supplierMessages[Math.floor(Math.random() * supplierMessages.length)],
            type: "chat" as const,
            created_at: new Date().toISOString(),
            is_private: false,
            profiles: {
              name: randomSupplierName,
              role: "supplier",
            },
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Adicionar mensagens do sistema quando systemMessages mudar
  useEffect(() => {
    if (systemMessages && systemMessages.length > 0) {
      const newSystemMessages = systemMessages.map((sysMsg, index) => ({
        id: `system-msg-${Date.now()}-${index}`,
        user_id: "system",
        content: sysMsg.message,
        created_at: new Date().toISOString(),
        type: sysMsg.type === "system" ? "system" as const : "chat" as const,
        is_private: false,
        profiles: { 
          name: sysMsg.type === "system" ? "Sistema" : "Pregoeiro", 
          role: sysMsg.type === "system" ? "system" : "auctioneer" 
        },
      }));

      setMessages((prev) => [...prev, ...newSystemMessages]);
    }
  }, [systemMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // ...existing code... (resto do componente permanece igual)
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (isCitizen) {
      toast({
        title: "Acesso Negado",
        description: "Observadores não podem enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuctioneer && !chatEnabled && isSupplier) {
      toast({
        title: "Chat Desabilitado",
        description: "O chat foi desabilitado pelo pregoeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const newMockMessage: Message = {
      id: `msg-demo-${Date.now()}`,
      user_id: userId,
      content: newMessage,
      created_at: new Date().toISOString(),
      type: "chat",
      is_private: false,
      profiles: {
        name: isAuctioneer 
          ? profile.name 
          : profile.supplierNumber 
            ? `Fornecedor ${profile.supplierNumber}` 
            : profile.name,
        role: profile.role,
      },
    };

    setMessages((prev) => [...prev, newMockMessage]);
    setNewMessage("");
    setIsLoading(false);

    toast({
      title: "Mensagem Enviada!",
      description: "Sua mensagem foi enviada no chat da demonstração.",
    });
  };

  const toggleChatEnabled = () => {
    if (!isAuctioneer) return;

    const newStatus = !chatEnabled;
    setChatEnabled(newStatus);

    const systemMessage: Message = {
      id: `msg-demo-${Date.now()}-system`,
      user_id: "system-demo",
      content: `Chat ${newStatus ? "habilitado" : "desabilitado"} pelo pregoeiro (simulado).`,
      created_at: new Date().toISOString(),
      type: "system",
      is_private: false,
      profiles: { name: "Sistema", role: "system" },
    };
    setMessages((prev) => [...prev, systemMessage]);

    toast({
      title: newStatus ? "Chat habilitado" : "Chat desabilitado",
      description: `O chat foi ${newStatus ? "habilitado" : "desabilitado"} para os fornecedores (simulado).`,
    });
  };

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => {
        const timestamp = new Date(msg.created_at).toLocaleString("pt-BR");
        const userName = msg.profiles?.name || "Sistema";
        const userRole = msg.profiles?.role === "auctioneer" ? "[PREGOEIRO]" : 
                        msg.profiles?.role === "supplier" ? "[FORNECEDOR]" : "[SISTEMA]";
        return `[${timestamp}] ${userRole} ${userName}: ${msg.content}`;
      })
      .join("\n");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-disputa-demo-${tenderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Chat exportado",
      description: "O histórico do chat foi exportado com sucesso (simulado).",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getInitials = (name = "") => {
    if (name) return name.substring(0, 2).toUpperCase();
    return "US";
  };

  const getUserDisplayName = (message: Message) => {
    if (message.type === "system") return "Sistema";
    if (message.user_id === userId) {
      if (isAuctioneer) {
        return "Você";
      }
      return profile.supplierNumber ? `Você` : "Você";
    }
    return message.profiles?.name || "Usuário Desconhecido";
  };

  const getMessageStyle = (message: Message) => {
    if (message.type === "system") {
      return "bg-blue-50 border-l-4 border-blue-400";
    }
    if (message.profiles?.role === "auctioneer") {
      return "bg-amber-50 border-l-4 border-amber-400";
    }
    if (message.profiles?.role === "supplier") {
      return "bg-green-50 border-l-4 border-green-400";
    }
    return "";
  };

  const getAvatarStyle = (message: Message) => {
    if (message.type === "system") {
      return "bg-blue-500 text-white";
    }
    if (message.profiles?.role === "auctioneer") {
      return "bg-amber-500 text-white";
    }
    if (message.profiles?.role === "supplier") {
      return "bg-green-500 text-white";
    }
    return "bg-gray-200";
  };

  const getRoleIcon = (message: Message) => {
    if (message.type === "system") return null;
    if (message.profiles?.role === "auctioneer") {
      return <Gavel className="h-3 w-3" />;
    }
    if (message.profiles?.role === "supplier") {
      return <Building className="h-3 w-3" />;
    }
    return null;
  };

  const getRoleBadge = (message: Message) => {
    if (message.type === "system") return null;
    if (message.profiles?.role === "auctioneer") {
      return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">PREGOEIRO</Badge>;
    }
    if (message.profiles?.role === "supplier") {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">FORNECEDOR</Badge>;
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header do Chat */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Mensagens (Demo)</h3>
            {!chatEnabled && (
              <Badge variant="destructive" className="text-sm">
                Desabilitado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuctioneer && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleChatEnabled}
                  title={chatEnabled ? "Desabilitar Chat" : "Habilitar Chat"}
                  className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportChat}
                  title="Exportar Chat"
                  className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{ maxHeight: "calc(100vh - 200px)" }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            Nenhuma mensagem ainda.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 p-3 rounded-lg ${getMessageStyle(message)} ${
                message.is_private ? "bg-yellow-50 border-l-4 border-yellow-400" : ""
              }`}>
              <Avatar className="h-10 w-10">
                <AvatarFallback className={getAvatarStyle(message)}>
                  {message.type === "system" ? "S" : getInitials(message.profiles?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    {getRoleIcon(message)}
                    {getUserDisplayName(message)}
                    {message.is_private && " (Privado)"}
                  </span>
                  {getRoleBadge(message)}
                  <span className="text-sm text-gray-500">{formatTime(message.created_at)}</span>
                </div>
                <p className="text-gray-700">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      {(isAuctioneer || isSupplier) && (
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                !chatEnabled && !isAuctioneer && isSupplier
                  ? "Chat desabilitado pelo pregoeiro"
                  : isAuctioneer
                  ? "Digite como pregoeiro..."
                  : "Digite como fornecedor..."
              }
              disabled={isLoading || (!isAuctioneer && !chatEnabled && isSupplier)}
              className="flex-1 h-12 text-base"
            />
            <Button
              type="submit"
              disabled={
                isLoading || !newMessage.trim() || (!isAuctioneer && !chatEnabled && isSupplier)
              }
              className="h-12 px-6">
              <Send className="h-5 w-5" />
            </Button>
          </form>

          {!chatEnabled && !isAuctioneer && isSupplier && (
            <p className="text-xs text-red-500 mt-2">⚠️ Chat desabilitado pelo pregoeiro</p>
          )}
        </div>
      )}

      {/* Aviso para observadores */}
      {isCitizen && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <MessageSquare className="h-4 w-4" />
            <p className="text-sm">
              👁️ Modo observador - Você pode acompanhar as mensagens mas não pode participar do chat
            </p>
          </div>
        </div>
      )}
    </div>
  );
}