export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          label?: string
          user_id?: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_accounts: {
        Row: {
          archived: boolean
          bm_id: string | null
          brand_id: string | null
          created_at: string
          dataset_id: string | null
          id: string
          is_demo: boolean
          name: string
          platform: string
          spanda_expires_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          dataset_id?: string | null
          id?: string
          is_demo?: boolean
          name: string
          platform?: string
          spanda_expires_at?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          dataset_id?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          platform?: string
          spanda_expires_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      bm_partners: {
        Row: {
          archived: boolean
          bm_a: string
          bm_b: string
          created_at: string
          id: string
          is_demo: boolean
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_a: string
          bm_b: string
          created_at?: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_a?: string
          bm_b?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bm_partners_bm_a_fkey"
            columns: ["bm_a"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bm_partners_bm_b_fkey"
            columns: ["bm_b"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          archived: boolean
          color: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          notes?: string | null
          user_id?: string
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_managers: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          is_demo: boolean
          name: string
          status: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          status?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_creatives: {
        Row: {
          archived: boolean
          campaign_id: string
          created_at: string
          creative_id: string
          id: string
          is_demo: boolean
          user_id: string
        }
        Insert: {
          archived?: boolean
          campaign_id: string
          created_at?: string
          creative_id: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Update: {
          archived?: boolean
          campaign_id?: string
          created_at?: string
          creative_id?: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creatives_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_daily: {
        Row: {
          archived: boolean
          campaign_id: string
          created_at: string
          day: string
          id: string
          is_demo: boolean
          revenue: number
          spend: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          campaign_id: string
          created_at?: string
          day: string
          id?: string
          is_demo?: boolean
          revenue?: number
          spend?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          campaign_id?: string
          created_at?: string
          day?: string
          id?: string
          is_demo?: boolean
          revenue?: number
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_account_id: string | null
          archived: boolean
          brand_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
          product: string | null
          status: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          archived?: boolean
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          product?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          ad_account_id?: string | null
          archived?: boolean
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          product?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      creatives: {
        Row: {
          archived: boolean
          brand_id: string | null
          created_at: string
          format: string
          id: string
          is_demo: boolean
          name: string
          status: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          brand_id?: string | null
          created_at?: string
          format?: string
          id?: string
          is_demo?: boolean
          name: string
          status?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          brand_id?: string | null
          created_at?: string
          format?: string
          id?: string
          is_demo?: boolean
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creatives_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          archived: boolean
          bm_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          archived: boolean
          bm_id: string | null
          brand_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          ad_account_id: string | null
          amount: number
          archived: boolean
          brand_id: string | null
          campaign_id: string | null
          category: string
          created_at: string
          day: string
          id: string
          is_demo: boolean
          name: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          amount?: number
          archived?: boolean
          brand_id?: string | null
          campaign_id?: string | null
          category?: string
          created_at?: string
          day?: string
          id?: string
          is_demo?: boolean
          name?: string
          user_id?: string
        }
        Update: {
          ad_account_id?: string | null
          amount?: number
          archived?: boolean
          brand_id?: string | null
          campaign_id?: string | null
          category?: string
          created_at?: string
          day?: string
          id?: string
          is_demo?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_daily: {
        Row: {
          archived: boolean
          brand_id: string | null
          confirmed: number
          created_at: string
          currency: string
          day: string
          delivered: number
          id: string
          is_demo: boolean
          orders: number
          returned: number
          revenue: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          brand_id?: string | null
          confirmed?: number
          created_at?: string
          currency?: string
          day: string
          delivered?: number
          id?: string
          is_demo?: boolean
          orders?: number
          returned?: number
          revenue?: number
          user_id?: string
        }
        Update: {
          archived?: boolean
          brand_id?: string | null
          confirmed?: number
          created_at?: string
          currency?: string
          day?: string
          delivered?: number
          id?: string
          is_demo?: boolean
          orders?: number
          returned?: number
          revenue?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_daily_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          archived: boolean
          bm_id: string | null
          brand_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_id?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          archived: boolean
          created_at: string
          display_name: string
          id: string
          is_demo: boolean
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          display_name: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          display_name?: string
          id?: string
          is_demo?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profile_bm_roles: {
        Row: {
          archived: boolean
          bm_id: string
          created_at: string
          id: string
          is_demo: boolean
          person_id: string
          role: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          bm_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          person_id: string
          role?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          bm_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          person_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_bm_roles_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "business_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_bm_roles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ad_account_id: string | null
          archived: boolean
          auto_key: string | null
          brand: string
          brand_color: string
          brand_id: string | null
          campaign_id: string | null
          created_at: string
          done: boolean
          id: string
          is_demo: boolean
          position: number
          priority: string
          streak: number
          task_date: string
          title: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          archived?: boolean
          auto_key?: string | null
          brand?: string
          brand_color?: string
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          done?: boolean
          id?: string
          is_demo?: boolean
          position?: number
          priority?: string
          streak?: number
          task_date?: string
          title: string
          user_id?: string
        }
        Update: {
          ad_account_id?: string | null
          archived?: boolean
          auto_key?: string | null
          brand?: string
          brand_color?: string
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          done?: boolean
          id?: string
          is_demo?: boolean
          position?: number
          priority?: string
          streak?: number
          task_date?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          currency: string
          demo_seeded: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          demo_seeded?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          currency?: string
          demo_seeded?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_demo_data: { Args: never; Returns: undefined }
      owner_exists: { Args: never; Returns: boolean }
      seed_demo_data: { Args: never; Returns: undefined }
      sync_auto_tasks: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
