"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface DisputeChatProps {
  tenderId: string
  itemId: string | null
  isAuctioneer: boolean
  userId: string
  status: string
}

type Message = {
  id: string
  user_id: string
  content: string
  created_at: string
  type: "chat" | "system"
  is_private: boolean
  recipient_id?: string
  user?: {
    name?: string
    email?: string
  }
}

export function DisputeChat({ tenderId, itemId, isAuctioneer, userId, status }: DisputeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [privateMode, setPrivateMode] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    // Carregar mensagens iniciais
    const fetchMessages = async () => {
      try {
        const query = supabase
          .from("dispute_messages")
          .select(`
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
          `)
          .eq("tender_id", tenderId)
          .order("created_at", { ascending: true })

        // Se não for pregoeiro, filtrar mensagens privadas
        if (!isAuctioneer) {
          query.or(`is_private.eq.false,and(is_private.eq.true,recipient_id.eq.${userId})`)
        }

        const { data, error } = await query

        if (error) throw error

        if (data) {
          const formattedMessages = data.map((msg: any) => {
            return {
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
            }
          }) as Message[]

          setMessages(formattedMessages)
          scrollToBottom()
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens da disputa.",
          variant: "destructive",
        })
      }
    }

    fetchMessages()

    // Inscrever-se para atualizações em tempo real
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
          const newMessage = payload.new as any

          // Se não for pregoeiro e a mensagem for privada para outro usuário, não mostrar
          if (!isAuctioneer && newMessage.is_private && newMessage.recipient_id !== userId) {
            return
          }

          // Buscar informações do usuário
          const { data: userData } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", newMessage.user_id)
            .single()

          setMessages((prev) => [
            ...prev,
            {
              ...newMessage,
              user: {
                name: userData?.name,
                email: userData?.email || "Usuário",
              },
            },
          ])
          scrollToBottom()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tenderId, isAuctioneer, userId, supabase, toast])

  // Atualizar estado do chat quando o status da disputa mudar
  useEffect(() => {
    setChatEnabled(status === "open" || status === "negotiation")
  }, [status])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setIsLoading(true)

    try {
      const { error } = await supabase.from("dispute_messages").insert({
        tender_id: tenderId,
        item_id: itemId,
        user_id: userId,
        content: newMessage,
        type: "chat",
        is_private: privateMode,
        recipient_id: privateMode ? selectedUser : null,
      })

      if (error) throw error

      setNewMessage("")
      setPrivateMode(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name = "", email = "") => {
    if (name) return name.substring(0, 2).toUpperCase()
    if (email) return email.substring(0, 2).toUpperCase()
    return "US"
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">Chat da Disputa</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhuma mensagem ainda. {chatEnabled ? "Seja o primeiro a enviar!" : "Aguardando início da disputa."}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === "system" ? "bg-muted/50 p-3 rounded-md" : ""} ${
                message.is_private ? "bg-yellow-50 p-3 rounded-md" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(message.user?.name || "", message.user?.email || "")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[1rem]">
                    {message.type === "system" ? "Sistema" : message.user?.name || message.user?.email || "Usuário"}
                    {message.is_private && " (Mensagem Privada)"}
                  </span>
                  <span className="text-[1rem] text-muted-foreground">{formatDate(message.created_at)}</span>
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
            placeholder={
              !chatEnabled ? "Chat desativado" : privateMode ? "Mensagem privada..." : "Digite sua mensagem..."
            }
            disabled={isLoading || !chatEnabled}
            className="flex-1"
          />
          {isAuctioneer && chatEnabled && (
            <Button
              type="button"
              variant={privateMode ? "default" : "outline"}
              onClick={() => setPrivateMode(!privateMode)}
              disabled={isLoading}
            >
              {privateMode ? "Privado" : "Público"}
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !newMessage.trim() || !chatEnabled}>
            Enviar
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
