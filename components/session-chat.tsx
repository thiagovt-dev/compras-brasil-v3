"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/supabase/auth-context";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: "chat" | "system";
  user?: {
    name?: string;
    email?: string;
  };
};

export function SessionChat({ tenderId }: { tenderId : string}) {
  // const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientSupabaseClient();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Carregar mensagens iniciais
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("session_messages")
          .select(
            `
            id, 
            user_id, 
            content, 
            created_at, 
            type,
            auth.users!user_id (
              email
            )
          `
          )
          .eq("tender_id", tenderId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data) {
          const formattedMessages = data.map((msg: any) => {
            const userEmail =
              msg.user?.email || msg.users?.email || msg.auth?.users?.email || "Usuário";

            return {
              id: msg.id,
              user_id: msg.user_id,
              content: msg.content,
              created_at: msg.created_at,
              type: msg.type,
              user: {
                email: userEmail,
              },
            };
          }) as Message[];

          setMessages(formattedMessages);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens da sessão.",
          variant: "destructive",
        });
      }
    };

    fetchMessages();

    // Inscrever-se para atualizações em tempo real
    const subscription = supabase
      .channel("session_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `tender_id=eq.${tenderId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          // Buscar informações do usuário
          const { data: userData } = await supabase
            .from("auth.users")
            .select("email")
            .eq("id", newMessage.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...newMessage,
              user: {
                email: userData?.email || "Usuário",
              },
            },
          ]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tenderId, supabase, toast]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: user.id,
        content: newMessage,
        type: "chat",
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">Chat da Sessão Pública</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhuma mensagem ainda. Seja o primeiro a enviar!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === "system" ? "bg-muted/50 p-3 rounded-md" : ""
              }`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(message.user?.email || "US")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[1rem]">
                    {message.type === "system" ? "Sistema" : message.user?.email || "Usuário"}
                  </span>
                  <span className="text-[1rem] text-muted-foreground">
                    {formatDate(message.created_at)}
                  </span>
                </div>
                <p className="text-[1rem]">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="p-3 border-t">
        <form onSubmit={sendMessage} className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading || !user}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !user || !newMessage.trim()}>
            Enviar
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
