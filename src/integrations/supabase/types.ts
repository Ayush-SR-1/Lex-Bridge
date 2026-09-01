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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      case_documents: {
        Row: {
          case_id: string
          created_at: string
          due_on: string | null
          id: string
          kind: string
          name: string
          status: string
        }
        Insert: {
          case_id: string
          created_at?: string
          due_on?: string | null
          id?: string
          kind?: string
          name: string
          status?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          due_on?: string | null
          id?: string
          kind?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_milestones: {
        Row: {
          case_id: string
          created_at: string
          detail: string
          id: string
          occurred_on: string | null
          position: number
          status: string
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string
          detail?: string
          id?: string
          occurred_on?: string | null
          position?: number
          status?: string
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string
          detail?: string
          id?: string
          occurred_on?: string | null
          position?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_milestones_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          client_id: string
          created_at: string
          description: string
          id: string
          lawyer_id: string | null
          location: string
          next_hearing_at: string | null
          next_hearing_venue: string | null
          practice_area: string
          pro_bono: boolean
          stage: string
          status_note: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string
          id?: string
          lawyer_id?: string | null
          location?: string
          next_hearing_at?: string | null
          next_hearing_venue?: string | null
          practice_area?: string
          pro_bono?: boolean
          stage?: string
          status_note?: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          lawyer_id?: string | null
          location?: string
          next_hearing_at?: string | null
          next_hearing_venue?: string | null
          practice_area?: string
          pro_bono?: boolean
          stage?: string
          status_note?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_requests: {
        Row: {
          case_id: string
          client_id: string
          created_at: string
          id: string
          lawyer_id: string
          message: string
          status: string
        }
        Insert: {
          case_id: string
          client_id: string
          created_at?: string
          id?: string
          lawyer_id: string
          message?: string
          status?: string
        }
        Update: {
          case_id?: string
          client_id?: string
          created_at?: string
          id?: string
          lawyer_id?: string
          message?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_requests_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyers: {
        Row: {
          availability: string
          bench: string
          bio: string
          created_at: string
          fee_inr: number
          id: string
          name: string
          practice_areas: string[]
          pro_bono_available: boolean
          pro_bono_matters: number
          response_time: string
          success_rate: number
          user_id: string | null
          verified: boolean
          years_experience: number
        }
        Insert: {
          availability?: string
          bench?: string
          bio?: string
          created_at?: string
          fee_inr?: number
          id?: string
          name: string
          practice_areas?: string[]
          pro_bono_available?: boolean
          pro_bono_matters?: number
          response_time?: string
          success_rate?: number
          user_id?: string | null
          verified?: boolean
          years_experience?: number
        }
        Update: {
          availability?: string
          bench?: string
          bio?: string
          created_at?: string
          fee_inr?: number
          id?: string
          name?: string
          practice_areas?: string[]
          pro_bono_available?: boolean
          pro_bono_matters?: number
          response_time?: string
          success_rate?: number
          user_id?: string | null
          verified?: boolean
          years_experience?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_case: { Args: { _case_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "lawyer" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "lawyer", "admin"],
    },
  },
} as const
