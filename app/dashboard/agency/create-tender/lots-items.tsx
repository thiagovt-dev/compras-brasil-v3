"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LotsItemsProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
  onPrev: () => void
}

export default function LotsItems({ formData, setFormData, onNext, onPrev }: LotsItemsProps) {
  const { toast } = useToast()

  const handleLotChange = (lotIndex: number, field: string, value: any) => {
    const newLots = [...formData.lots]
    newLots[lotIndex] = { ...newLots[lotIndex], [field]: value }
    setFormData({ ...formData, lots: newLots })
  }

  const handleItemChange = (lotIndex: number, itemIndex: number, field: string, value: any) => {
    const newLots = [...formData.lots]
    newLots[lotIndex].items[itemIndex] = {
      ...newLots[lotIndex].items[itemIndex],
      [field]: value,
    }
    setFormData({ ...formData, lots: newLots })
  }

  const addLot = () => {
    const newLotId = formData.lots.length > 0 ? Math.max(...formData.lots.map((lot: any) => lot.id)) + 1 : 1

    setFormData({
      ...formData,
      lots: [
        ...formData.lots,
        {
          id: newLotId,
          description: "",
          type: "products",
          requireBrand: false,
          allowDescriptionChange: true,
          items: [
            {
              id: 1,
              description: "",
              quantity: "",
              unit: "",
              unitPrice: "",
              benefitType: "open",
            },
          ],
        },
      ],
    })
  }

  const removeLot = (index: number) => {
    const newLots = [...formData.lots]
    newLots.splice(index, 1)
    setFormData({ ...formData, lots: newLots })
  }

  const addItem = (lotIndex: number) => {
    const newLots = [...formData.lots]
    const newItemId =
      newLots[lotIndex].items.length > 0 ? Math.max(...newLots[lotIndex].items.map((item: any) => item.id)) + 1 : 1

    newLots[lotIndex].items.push({
      id: newItemId,
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      benefitType: "open",
    })

    setFormData({ ...formData, lots: newLots })
  }

  const removeItem = (lotIndex: number, itemIndex: number) => {
    const newLots = [...formData.lots]
    newLots[lotIndex].items.splice(itemIndex, 1)
    setFormData({ ...formData, lots: newLots })
  }

  const validateForm = () => {
    // Check if there's at least one lot/item
    if (formData.lots.length === 0) {
      toast({
        title: "Nenhum item cadastrado",
        description: "Por favor, adicione pelo menos um item ou lote.",
        variant: "destructive",
      })
      return false
    }

    // Check if all lots have required fields
    for (let lotIndex = 0; lotIndex < formData.lots.length; lotIndex++) {
      const lot = formData.lots[lotIndex]

      if (!lot.description) {
        toast({
          title: "Descrição obrigatória",
          description: `Por favor, preencha a descrição do ${formData.judgmentCriteria === "menor-preco-item" ? "item" : "lote"} ${lotIndex + 1}.`,
          variant: "destructive",
        })
        return false
      }

      // Check if all items have required fields
      for (let itemIndex = 0; itemIndex < lot.items.length; itemIndex++) {
        const item = lot.items[itemIndex]

        if (!item.description || !item.quantity || !item.unit || !item.unitPrice) {
          toast({
            title: "Campos obrigatórios",
            description: `Por favor, preencha todos os campos do item ${itemIndex + 1} ${formData.judgmentCriteria === "menor-preco-item" ? "" : `do lote ${lotIndex + 1}`}.`,
            variant: "destructive",
          })
          return false
        }
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{formData.judgmentCriteria === "menor-preco-item" ? "Itens" : "Lotes"}</h3>
        <Button type="button" variant="outline" onClick={addLot}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar {formData.judgmentCriteria === "menor-preco-item" ? "Item" : "Lote"}
        </Button>
      </div>

      <div className="space-y-8">
        {formData.lots.map((lot: any, lotIndex: number) => (
          <Card key={lot.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {formData.judgmentCriteria === "menor-preco-item" ? `Item ${lotIndex + 1}` : `Lote ${lotIndex + 1}`}
                </CardTitle>
                {formData.lots.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLot(lotIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Itens</Label>
                  <Select value={lot.type} onValueChange={(value) => handleLotChange(lotIndex, "type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="services">Serviços</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição do {formData.judgmentCriteria === "menor-preco-item" ? "Item" : "Lote"}</Label>
                  <Input
                    value={lot.description}
                    onChange={(e) => handleLotChange(lotIndex, "description", e.target.value)}
                    placeholder="Descrição"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {lot.type === "products" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`requireBrand-${lotIndex}`}
                      checked={lot.requireBrand}
                      onCheckedChange={(checked) => handleLotChange(lotIndex, "requireBrand", checked)}
                    />
                    <Label htmlFor={`requireBrand-${lotIndex}`}>Requer Marca, Modelo e Fabricante</Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`allowDescriptionChange-${lotIndex}`}
                    checked={lot.allowDescriptionChange}
                    onCheckedChange={(checked) => handleLotChange(lotIndex, "allowDescriptionChange", checked)}
                  />
                  <Label htmlFor={`allowDescriptionChange-${lotIndex}`}>Permitir Alterar a Descrição</Label>
                </div>
              </div>

              {formData.judgmentCriteria === "menor-preco-lote" && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <h4 className="font-medium">Itens do Lote</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem(lotIndex)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Item
                    </Button>
                  </div>
                </>
              )}

              <div className="space-y-4">
                {lot.items.map((item: any, itemIndex: number) => (
                  <div key={item.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium">Item {itemIndex + 1}</h5>
                      {lot.items.length > 1 && formData.judgmentCriteria === "menor-preco-lote" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(lotIndex, itemIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(lotIndex, itemIndex, "description", e.target.value)}
                          placeholder="Descrição do item"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Benefício</Label>
                        <Select
                          value={item.benefitType}
                          onValueChange={(value) => handleItemChange(lotIndex, itemIndex, "benefitType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusive">Exclusivo ME/EPP</SelectItem>
                            <SelectItem value="benefit">Ampla concorrência com benefício para ME/EPP</SelectItem>
                            <SelectItem value="open">Ampla concorrência sem benefício</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mt-4">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          value={item.quantity}
                          onChange={(e) => handleItemChange(lotIndex, itemIndex, "quantity", e.target.value)}
                          placeholder="Quantidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unidade de Medida</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => handleItemChange(lotIndex, itemIndex, "unit", e.target.value)}
                          placeholder="Ex: UN, KG, CX"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Valor Unitário</Label>
                        <Input
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(lotIndex, itemIndex, "unitPrice", e.target.value)}
                          placeholder="R$ 0,00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2">
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
