export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      agencies: {
        Row: {
          address: string | null
          agency_type: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          sphere: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          agency_type?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          sphere?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          agency_type?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          sphere?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      agency_registrations: {
        Row: {
          address: string | null
          agency_name: string | null
          agency_type: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          phone: string | null
          sphere: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          users: Json | null
          website: string | null
        }
        Insert: {
          address?: string | null
          agency_name?: string | null
          agency_type?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          sphere?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          users?: Json | null
          website?: string | null
        }
        Update: {
          address?: string | null
          agency_name?: string | null
          agency_type?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          sphere?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          users?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appeals: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          decision: string | null
          decision_date: string | null
          id: string
          lot_id: string | null
          status: string | null
          tender_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          decision?: string | null
          decision_date?: string | null
          id?: string
          lot_id?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          decision?: string | null
          decision_date?: string | null
          id?: string
          lot_id?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appeals_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "tender_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string | null
          id: string
          rating: number | null
          tender_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type?: string | null
          id?: string
          rating?: number | null
          tender_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string | null
          id?: string
          rating?: number | null
          tender_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_feedback_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clarifications: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string | null
          status: string | null
          tender_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clarifications_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clarifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string | null
          file_url: string | null
          id: string
          status: string | null
          tender_id: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          tender_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          tender_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impugnations: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          id: string
          response: string | null
          response_date: string | null
          status: string | null
          tender_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          response?: string | null
          response_date?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          response?: string | null
          response_date?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impugnations_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impugnations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          billing_address: string | null
          created_at: string
          full_name: string | null
          id: string
          payment_method: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          payment_method?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          billing_address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          payment_method?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          classification_justification: string | null
          created_at: string
          id: string
          lot_id: string | null
          status: string | null
          submission_date: string | null
          supplier_id: string | null
          tender_id: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          classification_justification?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          status?: string | null
          submission_date?: string | null
          supplier_id?: string | null
          tender_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          classification_justification?: string | null
          created_at?: string
          id?: string
          lot_id?: string | null
          status?: string | null
          submission_date?: string | null
          supplier_id?: string | null
          tender_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "tender_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      session_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          sender_id: string | null
          tender_id: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          sender_id?: string | null
          tender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          sender_id?: string | null
          tender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_messages_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_registrations: {
        Row: {
          address: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_items: {
        Row: {
          created_at: string
          description: string | null
          estimated_value: number | null
          id: string
          lot_id: string | null
          quantity: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          lot_id?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          lot_id?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "tender_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_lots: {
        Row: {
          created_at: string
          description: string | null
          estimated_value: number | null
          id: string
          lot_number: number | null
          tender_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          lot_number?: number | null
          tender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          lot_number?: number | null
          tender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_lots_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_participants: {
        Row: {
          created_at: string
          id: string
          registered_at: string | null
          status: string | null
          tender_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          registered_at?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          registered_at?: string | null
          status?: string | null
          tender_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_participants_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          agency_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dispute_mode: string | null
          id: string
          impugnation_deadline: string | null
          is_value_secret: boolean | null
          judgment_criteria: string | null
          modality: string | null
          opening_date: string | null
          pregoeiro_id: string | null
          proposal_deadline: string | null
          proposals_open: boolean | null
          status: string | null
          team_members: string[] | null
          tender_number: string | null
          title: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          agency_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispute_mode?: string | null
          id?: string
          impugnation_deadline?: string | null
          is_value_secret?: boolean | null
          judgment_criteria?: string | null
          modality?: string | null
          opening_date?: string | null
          pregoeiro_id?: string | null
          proposal_deadline?: string | null
          proposals_open?: boolean | null
          status?: string | null
          team_members?: string[] | null
          tender_number?: string | null
          title?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          agency_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispute_mode?: string | null
          id?: string
          impugnation_deadline?: string | null
          is_value_secret?: boolean | null
          judgment_criteria?: string | null
          modality?: string | null
          opening_date?: string | null
          pregoeiro_id?: string | null
          proposal_deadline?: string | null
          proposals_open?: boolean | null
          status?: string | null
          team_members?: string[] | null
          tender_number?: string | null
          title?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_pregoeiro_id_fkey"
            columns: ["pregoeiro_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[Extract<
      keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"]),
      string
    >]
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions]
    : never

export type TablesInsert<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Insert"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Insert"]
      : never

export type TablesUpdate<PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database }> =
  PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][Extract<
        keyof Database[PublicTableNameOrOptions["schema"]]["Tables"],
        string
      >]["Update"]
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
      ? PublicSchema["Tables"][PublicTableNameOrOptions]["Update"]
      : never

export type Enums<PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database }> =
  PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][Extract<
        keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"],
        string
      >]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
      ? PublicSchema["Enums"][PublicEnumNameOrOptions]
      : never

// Custom types for convenience
export type Profile = Tables<"profiles">
export type Tender = Tables<"tenders"> & {
  agency?: Tables<"agencies"> | null
  lots?: (Tables<"tender_lots"> & { items: Tables<"tender_items">[] })[] | null
}
export type Agency = Tables<"agencies">
export type TenderLot = Tables<"tender_lots">
export type TenderItem = Tables<"tender_items">
export type SessionMessage = Tables<"session_messages">
