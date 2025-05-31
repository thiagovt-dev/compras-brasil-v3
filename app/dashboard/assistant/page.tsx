"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, User, Trash2, Sparkles } from "lucide-react";
import { TypingEffect } from "@/components/typing-effect";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isFallback?: boolean;
  isTyping?: boolean;
};

export default function AssistantPage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente do Central de Compras Brasil. Como posso ajudar com suas dúvidas sobre licitações?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    console.log("=== ENVIANDO MENSAGEM ===");
    console.log("Input:", input);

    if (!input.trim() || isLoading) {
      console.log("Input vazio ou carregando, saindo...");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      console.log("1. Fazendo fetch para API...");

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: currentInput }],
        }),
      });

      console.log("2. Fetch concluído, status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("3. Data recebida:", data);

      if (!data.success) {
        throw new Error(data.error || "Erro na resposta");
      }

      // Adicionar mensagem com efeito de typing
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        isFallback: data.fallback || false,
        isTyping: true, // Ativar efeito de typing
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.fallback) {
        toast({
          title: "Modo Fallback",
          description: "Usando respostas básicas devido a problemas técnicos.",
          variant: "default",
        });
      }

      console.log("4. Mensagem adicionada com sucesso");
    } catch (error) {
      console.error("=== ERRO NO FRONTEND ===", error);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      console.log("5. Finalizando...");
      setIsLoading(false);
    }
  };

  const handleTypingComplete = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isTyping: false } : msg))
    );
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Olá! Sou o assistente do Central de Compras Brasil. Como posso ajudar com suas dúvidas sobre licitações?",
        timestamp: new Date(),
      },
    ]);

    toast({
      title: "Chat limpo",
      description: "Histórico removido",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Assistente IA
        </h1>
        <p className="text-muted-foreground">
          Assistente especializado em licitações públicas brasileiras
        </p>
      </div>

      <Card className="flex h-[600px] flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Assistente Virtual</CardTitle>
                {/* <CardDescription>Powered by Grok AI</CardDescription> */}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex max-w-[85%] items-start gap-3 rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isFallback
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-muted border"
                  }`}>
                  {message.role === "assistant" && (
                    <Avatar className="mt-0.5 h-6 w-6">
                      <AvatarFallback
                        className={
                          message.isFallback
                            ? "bg-yellow-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }>
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="text-[1rem] leading-relaxed">
                      {message.role === "assistant" && message.isTyping ? (
                        <TypingEffect
                          text={message.content}
                          speed={25}
                          onComplete={() => handleTypingComplete(message.id)}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                    <div className="mt-2 text-[1rem] opacity-70">
                      {formatTime(message.timestamp)}
                    </div>
                    {message.isFallback && (
                      <div className="mt-1 text-[1rem] text-yellow-700">Modo básico ativo</div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="mt-0.5 h-6 w-6">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-lg bg-muted border p-4">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: "0.2s" }}></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: "0.4s" }}></div>
                    <span className="text-[1rem] text-muted-foreground ml-2">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex w-full gap-2">
            <Textarea
              placeholder="Digite sua pergunta sobre licitações..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] flex-1 resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              className="h-auto px-6"
              disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-2 text-[1rem] text-muted-foreground w-full pl-4">
            Pressione Enter para enviar
          </div>
        </CardFooter>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">💡 Perguntas Sugeridas:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "Como funciona o processo de licitação pública?",
            "Quais documentos preciso para participar?",
            "O que é ME/EPP e quais os benefícios?",
            "Como fazer uma impugnação de edital?",
            "Qual a diferença entre pregão eletrônico e presencial?",
            "Como funciona a certificação digital?",
          ].map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start h-auto p-3 whitespace-normal"
              onClick={() => setInput(suggestion)}
              disabled={isLoading}>
              <div className="text-[1rem]">{suggestion}</div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
