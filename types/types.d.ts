declare global {
  interface Agency {
    id: string;
    name: string;
    cnpj?: string;
    agency_type?: string;
    sphere?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    status?: string;
    created_at: string;
    updated_at?: string;
  }

  interface Profile {
    id: string;
    name: string;
    email?: string;
  }

  interface Supplier {
    id: string;
    name: string;
    cnpj?: string;
  }

  interface Tender {
    id: string;
    title: string;
    description?: string;
    agency_id: string;
    tender_number: string;
    tender_type: string;
    status: string;
    estimated_value?: number;
    publication_date?: string;
    opening_date?: string;
    closing_date?: string;
    created_at: string;
    updated_at?: string;
    created_by: string;
    external_id?: string;
    external_source?: string;
    last_sync?: string;
    process_number?: string;
    category?: string;
    judgment_criteria?: string;
    dispute_mode?: string;
    price_decimals?: number;
    bid_increment?: string;
    secret_value?: boolean;
    documentation_mode?: string;
    phase_inversion?: boolean;
    impugnation_deadline?: string;
    proposals_open?: boolean;
    pregoeiro_id?: string;
    team_members?: string[];
    // Relacionamentos
    agencies?: Agency;
    profiles?: Profile;
    tender_lots?: TenderLot[];
  }

  interface TenderDocument {
    id: string;
    tender_id: string;
    user_id: string;
    name: string;
    file_path: string;
    file_type?: string;
    file_size?: number;
    created_at: string;
    profiles?: Profile;
  }

  interface TenderParticipant {
    id: string;
    tender_id: string;
    supplier_id: string;
    user_id: string;
    status: string;
    justification?: string;
    classified_by?: string;
    classified_at?: string;
    registered_at: string;
    created_at: string;
    updated_at: string;
    suppliers?: Supplier;
    profiles?: Profile;
  }

  interface TenderItem {
    id: string;
    tender_id: string;
    lot_id: string;
    item_number: number;
    description: string;
    quantity: number;
    unit: string;
    estimated_unit_price?: number;
    benefit_type?: string;
    created_at: string;
    updated_at: string;
  }

  interface TenderLot {
    id: string;
    tender_id: string;
    number: number;
    description?: string;
    type?: string;
    require_brand?: boolean;
    allow_description_change?: boolean;
    status?: string;
    appeal_start_date?: string;
    created_at: string;
    updated_at: string;
    estimated_value?: number;
    bid_interval?: number;
    tender_items?: TenderItem[];
  }

  interface TenderType {
    value: string;
    label: string;
  }

  interface TenderStatus {
    value: string;
    label: string;
  }
}

export {};