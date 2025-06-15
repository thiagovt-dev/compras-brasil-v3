"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Settings, Download } from "lucide-react";

interface DisputeChatProps {
  tenderId: string;
  activeLotId: string | null;
  isAuctioneer: boolean;
  isSupplier: boolean;
  isCitizen: boolean;
  userId: string;
  status: string;
}

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: "chat" | "system";
  is_private: boolean;
  recipient_id?: string;
  user?: {
    name?: string;
    email?: string;
  };
};

export function DisputeChat({
  tenderId,
  activeLotId,
  isAuctioneer,
  isSupplier,
  isCitizen,
  userId,
  status,
}: DisputeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const query = supabase
          .from("dispute_messages")
          .select(
            `
            id, 
            user_id, 
            content, 
            created_at, 
            type,
            is_private,
            recipient_id,
            profiles:user_id (
              name,
              email
            )
          `
          )
          .eq("tender_id", tenderId)
          .order("created_at", { ascending: true });

        if (!isAuctioneer) {
          query.or(`is_private.eq.false,and(is_private.eq.true,recipient_id.eq.${userId})`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const formattedMessages = data.map((msg: any) => ({
            id: msg.id,
            user_id: msg.user_id,
            content: msg.content,
            created_at: msg.created_at,
            type: msg.type,
            is_private: msg.is_private,
            recipient_id: msg.recipient_id,
            user: {
              name: msg.profiles?.name,
              email: msg.profiles?.email || "Usuário",
            },
          })) as Message[];

          setMessages(formattedMessages);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens da disputa.",
          variant: "destructive",
        });
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel("dispute_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_messages",
          filter: `tender_id=eq.${tenderId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          if (!isAuctioneer && newMessage.is_private && newMessage.recipient_id !== userId) {
            return;
          }

          const { data: userData } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", newMessage.user_id)
            .single();

          const messageWithUser = {
            ...newMessage,
            user: {
              name: userData?.name,
              email: userData?.email || "Usuário",
            },
          };

          setMessages((prev) => [...prev, messageWithUser]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tenderId, isAuctioneer, userId, supabase, toast]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isCitizen || (!isAuctioneer && !chatEnabled)) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: activeLotId,
        user_id: userId,
        content: newMessage,
        type: "chat",
        is_private: false,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChatEnabled = async () => {
    if (!isAuctioneer) return;

    try {
      const newStatus = !chatEnabled;
      setChatEnabled(newStatus);

      await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        lot_id: activeLotId,
        user_id: userId,
        content: `Chat ${newStatus ? "habilitado" : "desabilitado"} pelo pregoeiro.`,
        type: "system",
        is_private: false,
      });

      toast({
        title: newStatus ? "Chat habilitado" : "Chat desabilitado",
        description: `O chat foi ${
          newStatus ? "habilitado" : "desabilitado"
        } para os fornecedores.`,
      });
    } catch (error) {
      console.error("Erro ao alterar status do chat:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getInitials = (name = "", email = "") => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "US";
  };

  const getUserDisplayName = (message: Message) => {
    if (message.type === "system") return "Sistema";
    if (message.user_id === userId) return "Você";
    if (isAuctioneer) return message.user?.name || message.user?.email || "Fornecedor";
    return `Fornecedor ${message.user_id.substring(0, 8).toUpperCase()}`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header do Chat */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Mensagens</h3>
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
                <Button size="sm" variant="outline" title="Exportar Chat" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  {message.type === "system"
                    ? "S"
                    : getInitials(message.user?.name || "", message.user?.email || "")}
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
              disabled={isLoading || (!isAuctioneer && !chatEnabled)}
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
