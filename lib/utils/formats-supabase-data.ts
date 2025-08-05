export function transformSupabaseDocument(doc: any): TenderDocument {
  return {
    id: doc.id,
    tender_id: doc.tender_id,
    user_id: doc.user_id,
    name: doc.name,
    file_path: doc.file_path,
    file_type: doc.file_type,
    file_size: doc.file_size,
    created_at: doc.created_at,
    profiles: Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles,
  };
}

export function transformSupabaseParticipant(participant: any): TenderParticipant {
  return {
    id: participant.id,
    tender_id: participant.tender_id || participant.tender_id,
    supplier_id: participant.supplier_id,
    user_id: participant.user_id,
    status: participant.status,
    justification: participant.justification,
    classified_by: participant.classified_by,
    classified_at: participant.classified_at,
    registered_at: participant.registered_at,
    created_at: participant.created_at,
    updated_at: participant.updated_at,
    suppliers: Array.isArray(participant.suppliers)
      ? participant.suppliers[0]
      : participant.suppliers,
  };
}

export function transformTenderFromDB(tenderFromDB: any): Tender {

  return {
    id: tenderFromDB.id,
    title: tenderFromDB.title,
    agency_id: tenderFromDB.agency_id,
    tender_number: tenderFromDB.tender_number,
    tender_type: tenderFromDB.tender_type,
    status: tenderFromDB.status,
    created_at: tenderFromDB.created_at,
    created_by: tenderFromDB.created_by,

    description: tenderFromDB.description,
    estimated_value: tenderFromDB.estimated_value,
    publication_date: tenderFromDB.publication_date,
    opening_date: tenderFromDB.opening_date,
    closing_date: tenderFromDB.closing_date,
    updated_at: tenderFromDB.updated_at,
    external_id: tenderFromDB.external_id,
    external_source: tenderFromDB.external_source,
    last_sync: tenderFromDB.last_sync,
    process_number: tenderFromDB.process_number,
    category: tenderFromDB.category,
    judgment_criteria: tenderFromDB.judgment_criteria,
    dispute_mode: tenderFromDB.dispute_mode,
    price_decimals: tenderFromDB.price_decimals,
    bid_increment: tenderFromDB.bid_increment,
    secret_value: tenderFromDB.secret_value,
    documentation_mode: tenderFromDB.documentation_mode,
    phase_inversion: tenderFromDB.phase_inversion,
    impugnation_deadline: tenderFromDB.impugnation_deadline,
    proposals_open: tenderFromDB.proposals_open,
    pregoeiro_id: tenderFromDB.pregoeiro_id,
    team_members: tenderFromDB.team_members,

    agencies:
      Array.isArray(tenderFromDB.agencies) && tenderFromDB.agencies.length > 0
        ? {
            id: tenderFromDB.agencies[0].id, // Usar o id real da agência
            name: tenderFromDB.agencies[0].name,
            cnpj: tenderFromDB.agencies[0].cnpj,
            agency_type: tenderFromDB.agencies[0].agency_type,
            sphere: tenderFromDB.agencies[0].sphere,
            address: tenderFromDB.agencies[0].address,
            email: tenderFromDB.agencies[0].email,
            phone: tenderFromDB.agencies[0].phone,
            website: tenderFromDB.agencies[0].website,
            status: tenderFromDB.agencies[0].status,
            created_at: tenderFromDB.agencies[0].created_at,
            updated_at: tenderFromDB.agencies[0].updated_at,
          }
        : tenderFromDB.agencies && !Array.isArray(tenderFromDB.agencies)
        ? tenderFromDB.agencies
        : undefined,

    profiles: Array.isArray(tenderFromDB.profiles)
      ? tenderFromDB.profiles[0]
      : tenderFromDB.profiles,
    tender_lots: tenderFromDB.tender_lots,
  };
}
