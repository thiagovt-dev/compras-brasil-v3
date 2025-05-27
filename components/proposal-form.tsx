"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/supabase/auth-context"
import { Loader2, Save, Send } from "lucide-react"
import type { ProposalFormData } from "@/types/proposal"

interface ProposalFormProps {
  tenderId: string
  initialData?: any
}

export function ProposalForm({ tenderId, initialData }: ProposalFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user, profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tender, setTender] = useState<any>(null)
  const [selectedLot, setSelectedLot] = useState<string>("")

  // Fetch tender data
  useEffect(() => {
    const fetchTender = async () => {
      try {
        const { data, error } = await supabase
          .from("tenders")
          .select(
            `
            *,
            agency:agencies(*),
            lots:tender_lots(
              *,
              items:tender_items(*)
            )
          `,
          )
          .eq("id", tenderId)
          .single()

        if (error) throw error

        setTender(data)

        // Set default selected lot if there's only one
        if (data.lots && data.lots.length === 1) {
          setSelectedLot(data.lots[0].id)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching tender:", error)
        toast({
          title: "Erro ao carregar licitação",
          description: "Não foi possível carregar os dados da licitação.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchTender()
  }, [tenderId, supabase])

  // Create form schema based on selected lot
  const createFormSchema = (lotId: string) => {
    if (!tender || !lotId) return z.object({})

    const selectedLotData = tender.lots.find((lot: any) => lot.id === lotId)
    if (!selectedLotData) return z.object({})

    const itemFields: any = {}

    selectedLotData.items.forEach((item: any) => {
      itemFields[item.id] = z.object({
        unit_price: z.coerce.number().min(0.01, { message: "O preço unitário deve ser maior que zero" }),
        brand: selectedLotData.require_brand
          ? z.string().min(1, { message: "A marca é obrigatória" })
          : z.string().optional(),
        model: z.string().optional(),
        description: z.string().optional(),
      })
    })

    return z.object({
      tender_id: z.string(),
      lot_id: z.string(),
      items: z.object(itemFields),
      notes: z.string().optional(),
    })
  }

  const formSchema = createFormSchema(selectedLot)

  // Initialize form
  const form = useForm<ProposalFormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      tender_id: tenderId,
      lot_id: selectedLot,
      items: {},
      notes: "",
    },
  })

  // Update form when lot changes
  useEffect(() => {
    if (selectedLot) {
      form.setValue("lot_id", selectedLot)

      // Reset items when lot changes
      form.setValue("items", {})

      // Initialize items with empty values
      const selectedLotData = tender?.lots.find((lot: any) => lot.id === selectedLot)
      if (selectedLotData) {
        const items: any = {}
        selectedLotData.items.forEach((item: any) => {
          items[item.id] = {
            unit_price: 0,
            brand: "",
            model: "",
            description: "",
          }
        })
        form.setValue("items", items)
      }
    }
  }, [selectedLot, form, tender])

  // Handle form submission
  const onSubmit = async (data: ProposalFormData, isDraft = false) => {
    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para enviar uma proposta.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Calculate total value
      let totalValue = 0
      const selectedLotData = tender.lots.find((lot: any) => lot.id === data.lot_id)

      if (selectedLotData) {
        selectedLotData.items.forEach((item: any) => {
          const proposalItem = data.items[item.id]
          if (proposalItem) {
            totalValue += proposalItem.unit_price * item.quantity
          }
        })
      }

      // Check if proposal already exists
      const { data: existingProposal, error: checkError } = await supabase
        .from("proposals")
        .select("*")
        .eq("tender_id", data.tender_id)
        .eq("lot_id", data.lot_id)
        .eq("supplier_id", profile.id)
        .maybeSingle()

      if (checkError) throw checkError

      let proposalId

      if (existingProposal) {
        // Update existing proposal
        const { data: updatedProposal, error: updateError } = await supabase
          .from("proposals")
          .update({
            status: isDraft ? "draft" : "submitted",
            total_value: totalValue,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProposal.id)
          .select()
          .single()

        if (updateError) throw updateError
        proposalId = existingProposal.id

        // Delete existing items
        const { error: deleteError } = await supabase.from("proposal_items").delete().eq("proposal_id", proposalId)

        if (deleteError) throw deleteError
      } else {
        // Create new proposal
        const { data: newProposal, error: insertError } = await supabase
          .from("proposals")
          .insert({
            tender_id: data.tender_id,
            lot_id: data.lot_id,
            supplier_id: profile.id,
            status: isDraft ? "draft" : "submitted",
            total_value: totalValue,
            notes: data.notes,
          })
          .select()
          .single()

        if (insertError) throw insertError
        proposalId = newProposal.id
      }

      // Insert proposal items
      const proposalItems = Object.entries(data.items).map(([tender_item_id, item]) => ({
        proposal_id: proposalId,
        tender_item_id,
        unit_price: item.unit_price,
        brand: item.brand || null,
        model: item.model || null,
        description: item.description || null,
        total_price:
          item.unit_price * (selectedLotData?.items.find((i: any) => i.id === tender_item_id)?.quantity || 0),
      }))

      const { error: itemsError } = await supabase.from("proposal_items").insert(proposalItems)

      if (itemsError) throw itemsError

      toast({
        title: isDraft ? "Rascunho salvo" : "Proposta enviada",
        description: isDraft ? "Seu rascunho foi salvo com sucesso." : "Sua proposta foi enviada com sucesso.",
      })

      // Redirect to proposals list
      router.push("/dashboard/supplier/proposals")
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting proposal:", error)
      toast({
        title: "Erro ao enviar proposta",
        description: error.message || "Ocorreu um erro ao enviar sua proposta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!tender) {
    return (
      <div className="p-8">
        <p>Licitação não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{tender.title}</h2>
        <p className="text-muted-foreground">Nº {tender.number}</p>
      </div>

      {tender.lots && tender.lots.length > 0 ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
            <div className="space-y-6">
              {tender.lots.length > 1 && (
                <div>
                  <FormLabel>Selecione o lote</FormLabel>
                  <Select value={selectedLot} onValueChange={(value) => setSelectedLot(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {tender.lots.map((lot: any) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          Lote {lot.number}: {lot.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedLot && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Itens do Lote</h3>
                    {tender.lots
                      .find((lot: any) => lot.id === selectedLot)
                      ?.items.map((item: any) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">
                                  Item {item.number}: {item.description}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Quantidade: {item.quantity} {item.unit}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`items.${item.id}.unit_price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Preço Unitário (R$)</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" placeholder="0,00" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {tender.lots.find((lot: any) => lot.id === selectedLot)?.require_brand && (
                                  <FormField
                                    control={form.control}
                                    name={`items.${item.id}.brand`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Marca</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Marca" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}

                                <FormField
                                  control={form.control}
                                  name={`items.${item.id}.model`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Modelo</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Modelo" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {tender.lots.find((lot: any) => lot.id === selectedLot)?.allow_description_change && (
                                  <FormField
                                    control={form.control}
                                    name={`items.${item.id}.description`}
                                    render={({ field }) => (
                                      <FormItem className="col-span-full">
                                        <FormLabel>Descrição Detalhada</FormLabel>
                                        <FormControl>
                                          <Textarea placeholder="Descrição detalhada do item" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações adicionais sobre sua proposta" {...field} />
                        </FormControl>
                        <FormDescription>
                          Informações adicionais que você deseja incluir na sua proposta.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onSubmit(form.getValues(), true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar Rascunho
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar Proposta
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        </Form>
      ) : (
        <div className="p-4 border rounded-md bg-muted">
          <p>Esta licitação não possui lotes disponíveis para envio de propostas.</p>
        </div>
      )}
    </div>
  )
}
