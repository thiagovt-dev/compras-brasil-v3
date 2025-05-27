export interface ProposalItem {
  id?: string
  proposal_id?: string
  tender_item_id: string
  unit_price: number
  brand?: string
  model?: string
  description?: string
  total_price?: number
  created_at?: string
}

export interface Proposal {
  id?: string
  tender_id: string
  supplier_id: string
  lot_id: string
  status: "draft" | "submitted" | "under_analysis" | "accepted" | "rejected" | "winner"
  total_value?: number
  notes?: string
  items?: ProposalItem[]
  created_at?: string
  updated_at?: string
}

export interface ProposalFormData {
  tender_id: string
  lot_id: string
  items: {
    [key: string]: {
      unit_price: number
      brand?: string
      model?: string
      description?: string
    }
  }
  notes?: string
}
