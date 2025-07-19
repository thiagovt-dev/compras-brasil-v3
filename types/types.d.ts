declare global {
    interface Agency {
      id: string;
      name: string;
      agency_type?: string;
      sphere?: string;
    }

    interface TenderType {
      value: string;
      label: string;
    }

    interface TenderStatus {
      value: string;
      label: string;
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
      process_number?: string;
      category?: string;
      agencies?:
        | {
            name: string;
            agency_type?: string;
            sphere?: string;
          }
        | Array<{
            name: string;
            agency_type?: string;
            sphere?: string;
          }>;
    }


}

export {};