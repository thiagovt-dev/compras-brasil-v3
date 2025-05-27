"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

interface AssistantSuggestionsProps {
  language: string
  onSelectSuggestion: (suggestion: string) => void
}

export function AssistantSuggestions({ language, onSelectSuggestion }: AssistantSuggestionsProps) {
  const suggestions =
    language === "pt-BR"
      ? [
          "Como faço para participar de uma licitação?",
          "Quais documentos são necessários para cadastro de fornecedor?",
          "Como funciona o processo de licitação?",
          "Qual a diferença entre pregão eletrônico e presencial?",
          "O que é impugnação de edital?",
          "Como apresentar recursos em licitações?",
          "Quais são os prazos para recursos em licitações?",
          "Como funciona o sistema de registro de preços?",
        ]
      : [
          "How do I participate in a tender?",
          "What documents are required for supplier registration?",
          "How does the bidding process work?",
          "What is the difference between electronic and face-to-face bidding?",
          "What is a tender notice challenge?",
          "How to submit appeals in tenders?",
          "What are the deadlines for appeals in tenders?",
          "How does the price registration system work?",
        ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {language === "pt-BR" ? "Perguntas Frequentes" : "Frequently Asked Questions"}
        </CardTitle>
        <CardDescription>
          {language === "pt-BR" ? "Selecione uma pergunta ou faça a sua própria" : "Select a question or ask your own"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start text-left"
              onClick={() => onSelectSuggestion(suggestion)}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
