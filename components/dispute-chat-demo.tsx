"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Settings, Download } from "lucide-react";

interface DisputeChatDemoProps {
  tenderId: string;
  activeLotId: string | null;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string; // userId mocada do profile da demo
  profile: {
    id: string;
    name: string;
    company_name: string;
    role: string;
    supplierNumber?: number; // Novo campo para o número do fornecedor
  };
  status: string;
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

// Dados mocados para o chat de demonstração (serão passados via props ou gerenciados localmente)
// Removido o mockChatMessages daqui para ser gerenciado no DisputeRoomDemo

export function DisputeChatDemo({
  tenderId,
  activeLotId,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  profile,
  status,
}: DisputeChatDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]); // Inicializa vazio, mensagens virão do mockMessages do DisputeRoomDemo
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Simular mensagens iniciais e novas mensagens
  useEffect(() => {
    // Carregar mensagens iniciais (simuladas)
    setMessages([
      {
        id: "msg-demo-001",
        user_id: "auctioneer-demo-001",
        content: "Bem-vindos à sala de disputa de demonstração!",
        created_at: new Date(Date.now() - 120000).toISOString(),
        type: "system",
        is_private: false,
        profiles: { name: "Sistema", role: "system" },
      },
      {
        id: "msg-demo-002",
        user_id: "supplier-demo-001",
        content: "Olá a todos! Fornecedor ABC presente.",
        created_at: new Date(Date.now() - 90000).toISOString(),
        type: "chat",
        is_private: false,
        profiles: { name: "Fornecedor ABC", role: "supplier" },
      },
      {
        id: "msg-demo-003",
        user_id: "supplier-demo-002",
        content: "Fornecedor XYZ também online.",
        created_at: new Date(Date.now() - 60000).toISOString(),
        type: "chat",
        is_private: false,
        profiles: { name: "Fornecedor XYZ", role: "supplier" },
      },
      {
        id: "msg-demo-004",
        user_id: "auctioneer-demo-001",
        content: "O chat está habilitado para lances e perguntas.",
        created_at: new Date(Date.now() - 30000).toISOString(),
        type: "system",
        is_private: false,
        profiles: { name: "Sistema", role: "system" },
      },
    ]);

    // Simular novas mensagens de outros usuários
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        const randomSupplierId = Math.random() > 0.5 ? "supplier-demo-002" : "supplier-demo-003";
        const randomSupplierName =
          randomSupplierId === "supplier-demo-002"
            ? "Pedro Costa - Fornecedora XYZ"
            : "Ana Lima - Fornecedora 123";
        const newMessage = {
          id: `msg-${Date.now()}`,
          user_id: randomSupplierId,
          content:
            Math.random() > 0.5
              ? "Aguardando próximo item..."
              : "Sistema funcionando perfeitamente!",
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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Scroll imediato
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Scroll forçado caso o primeiro não funcione
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isCitizen || (!isAuctioneer && !chatEnabled)) return;

    setIsLoading(true);

    const newMockMessage: Message = {
      id: `msg-demo-${Date.now()}`,
      user_id: userId,
      content: newMessage,
      created_at: new Date().toISOString(),
      type: "chat",
      is_private: false,
      profiles: {
        name: profile.name,
        role: profile.role,
      },
    };

    setMessages((prev) => [...prev, newMockMessage]);
    setNewMessage("");
    setIsLoading(false);

    toast({
      title: "Mensagem Enviada!",
      description: "Sua mensagem foi simulada no chat.",
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
      description: `O chat foi ${
        newStatus ? "habilitado" : "desabilitado"
      } para os fornecedores (simulado).`,
    });
  };

  const exportChat = () => {
    const chatContent = messages
      .map((msg) => {
        const timestamp = new Date(msg.created_at).toLocaleString("pt-BR");
        const userName = msg.profiles?.name || "Sistema";
        return `[${timestamp}] ${userName}: ${msg.content}`;
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
      // Se for o usuário da demo, usa o supplierNumber
      return profile.supplierNumber ? `Você (FORNECEDOR ${profile.supplierNumber})` : "Você";
    }
    return message.profiles?.name || "Usuário Desconhecido";
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
              className={`flex gap-3 ${
                message.type === "system" ? "bg-blue-50 p-3 rounded-lg" : ""
              } ${
                message.is_private ? "bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400" : ""
              }`}>
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={message.type === "system" ? "bg-blue-500 text-white" : "bg-gray-200"}>
                  {message.type === "system" ? "S" : getInitials(message.profiles?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {getUserDisplayName(message)}
                    {message.is_private && " (Privado)"}
                  </span>
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
      {!isCitizen && (isAuctioneer || chatEnabled) && (
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                !chatEnabled && !isAuctioneer
                  ? "Chat desabilitado para fornecedores"
                  : "Digite sua mensagem..."
              }
              disabled={isLoading || !newMessage.trim() || (!isAuctioneer && !chatEnabled)}
              className="flex-1 h-12 text-base"
            />
            <Button
              type="submit"
              disabled={isLoading || !newMessage.trim() || (!isAuctioneer && !chatEnabled)}
              className="h-12 px-6">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
