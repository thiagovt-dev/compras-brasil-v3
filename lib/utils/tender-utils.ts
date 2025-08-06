export function checkMeEppBenefits(tender: Tender): {
  hasExclusiveItems: boolean;
  exclusiveItems: TenderItem[];
  mixedBenefitLots: TenderLot[];
} {
  const exclusiveItems: TenderItem[] = [];
  const mixedBenefitLots: TenderLot[] = [];
  
  tender.tender_lots?.forEach(lot => {
    const meEppItems = lot.tender_items?.filter(item => item.benefit_type === 'me_epp') || [];
    const openItems = lot.tender_items?.filter(item => item.benefit_type === 'open' || !item.benefit_type) || [];
    
    exclusiveItems.push(...meEppItems);
    
    if (meEppItems.length > 0 && openItems.length > 0) {
      mixedBenefitLots.push(lot);
    }
  });
  
  return {
    hasExclusiveItems: exclusiveItems.length > 0,
    exclusiveItems,
    mixedBenefitLots
  };
}

export function getBenefitTypeLabel(benefitType?: string): string {
  const labels: Record<string, string> = {
    'me_epp': 'Exclusivo ME/EPP',
    'open': 'Ampla Concorrência',
    'reserved': 'Reservado',
    'cooperative': 'Cooperativas',
  };
  
  return labels[benefitType || 'open'] || 'Ampla Concorrência';
}

export function getBenefitTypeBadgeVariant(benefitType?: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'me_epp': 'secondary',
    'open': 'outline',
    'reserved': 'default',
    'cooperative': 'default',
  };
  
  return variants[benefitType || 'open'] || 'outline';
}