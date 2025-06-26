import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { calculateGroupTotal, calculateItemTotal, formatCurrency } from "./page";


export function TenderSummary({ itemStructure, items, groups }: any) {
  return (
    <aside className="w-full md:w-80 md:ml-8 mb-8 md:mb-0">
      <Card>
        <CardTitle className="p-4 pb-0 text-lg">Resumo dos Itens</CardTitle>
        <CardContent className="space-y-2 pt-2">
          {itemStructure === "single" || itemStructure === "multiple" ? (
            <>
              {items.map((item: any, idx: number) => (
                <div key={item.id} className="border-b pb-2 last:border-b-0">
                  <div className="font-medium">Item {idx + 1}: {item.description || <span className="italic text-muted-foreground">Sem descrição</span>}</div>
                  <div className="text-sm text-muted-foreground">
                    Qtd: {item.quantity || 0} | Unidade: {item.unit || "-"}
                  </div>
                  <div className="text-sm">
                    Valor Unitário: {formatCurrency(item.unitPrice)}
                  </div>
                  <div className="text-sm font-semibold">
                    Total: {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}
                  </div>
                </div>
              ))}
              <div className="pt-2 font-bold">
                Total Geral: {formatCurrency(items.reduce((t: number, i: any) => t + calculateItemTotal(i.quantity, i.unitPrice), 0))}
              </div>
            </>
          ) : (
            <>
              {groups.map((group: any, gidx: number) => (
                <div key={group.id} className="mb-2 border-b pb-2 last:border-b-0">
                  <div className="font-medium">Grupo {gidx + 1}: {group.description || <span className="italic text-muted-foreground">Sem descrição</span>}</div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: {group.type === "products" ? "Produtos" : "Serviços"}
                  </div>
                  {group.items.map((item: any, idx: number) => (
                    <div key={item.id} className="ml-2 text-xs">
                      • {item.description || <span className="italic text-muted-foreground">Sem descrição</span>} ({item.quantity || 0} {item.unit || "-"})
                      <span className="ml-1">= {formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}</span>
                    </div>
                  ))}
                  <div className="text-sm font-semibold mt-1">
                    Total do Grupo: {formatCurrency(calculateGroupTotal(group.items))}
                  </div>
                </div>
              ))}
              <div className="pt-2 font-bold">
                Total Geral: {formatCurrency(groups.reduce((t: number, g: any) => t + calculateGroupTotal(g.items), 0))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}