"use client"

import { useState, useRef, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Database } from "@/types/supabase" // Assuming your Supabase database types

interface SessionChatProps {
  canInteract: boolean // New prop to control interactivity
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender_name: string
  sender_role: string
}

export function SessionChat({ canInteract }: SessionChatProps) {
  const supabase = createClientComponentClient<Database>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setUserProfile(profile)
      }
    }
    fetchProfile()

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("session_messages")
        .select(`
          id,
          content,
          created_at,
          sender_id,
          profiles!session_messages_sender_id_fkey(full_name, role)
        `)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            sender_name: msg.profiles?.full_name || "Usuário Desconhecido",
            sender_role: msg.profiles?.role || "unknown",
          })),
        )
      }
      scrollToBottom()
    }

    fetchMessages()

    const channel = supabase
      .channel("session_chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_messages" }, (payload) => {
        const newMsg = payload.new as any
        setMessages((prev) => [
          ...prev,
          {
            id: newMsg.id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            sender_id: newMsg.sender_id,
            sender_name: newMsg.profiles?.full_name || "Usuário Desconhecido", // This might not be available directly on payload.new
            sender_role: newMsg.profiles?.role || "unknown",
          },
        ])
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !userProfile) return

    const { error } = await supabase.from("session_messages").insert({
      content: newMessage,
      sender_id: userProfile.id,
    })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setNewMessage("")
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Chat da Sessão</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.sender_id === userProfile?.id ? "justify-end" : ""}`}
              >
                {message.sender_id !== userProfile?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt={message.sender_name} />
                    <AvatarFallback>
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[70%] ${
                    message.sender_id === userProfile?.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">
                      {message.sender_id === userProfile?.id ? "Você" : message.sender_name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.sender_id === userProfile?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="Você" />
                    <AvatarFallback>
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex w-full gap-2">
          <Input
            placeholder={canInteract ? "Digite sua mensagem..." : "Você não pode enviar mensagens neste chat."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && canInteract) {
                handleSendMessage()
              }
            }}
            disabled={!canInteract}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!canInteract}>
            Enviar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
