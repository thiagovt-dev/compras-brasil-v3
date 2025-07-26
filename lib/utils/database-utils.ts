
export function getSupplyLineLabel(value: string): string {
  const supplyLines: Record<string, string> = {
    informatica: "Equipamentos de Informática",
    moveis: "Móveis e Utensílios",
    material_escritorio: "Material de Escritório",
    limpeza: "Produtos de Limpeza",
    construcao: "Material de Construção",
    alimentos: "Alimentos e Bebidas",
    medicamentos: "Medicamentos",
    servicos_ti: "Serviços de TI",
    servicos_limpeza: "Serviços de Limpeza",
    servicos_manutencao: "Serviços de Manutenção",
    servicos_consultoria: "Serviços de Consultoria",
    servicos_engenharia: "Serviços de Engenharia",
    veiculos: "Veículos",
    combustiveis: "Combustíveis",
    equipamentos_medicos: "Equipamentos Médicos",
    uniformes: "Uniformes e EPIs",
  };

  return supplyLines[value] || value;
}