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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          chapter_id: string
          check_in_lat: number | null
          check_in_lng: number | null
          checked_in_at: string
          created_at: string
          distance_from_geofence_m: number | null
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          chapter_id: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          checked_in_at?: string
          created_at?: string
          distance_from_geofence_m?: number | null
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          chapter_id?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          checked_in_at?: string
          created_at?: string
          distance_from_geofence_m?: number | null
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          chapter_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          target_id: string | null
          target_table: string
          user_id: string | null
        }
        Insert: {
          action: string
          chapter_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_id?: string | null
          target_table: string
          user_id?: string | null
        }
        Update: {
          action?: string
          chapter_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_id?: string | null
          target_table?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_members: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          is_deleted: boolean
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_members_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_chapter_id: string | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_chapter_id?: string | null
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_chapter_id?: string | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_parent_chapter_id_fkey"
            columns: ["parent_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          chapter_id: string
          created_at: string
          id: string
          is_deleted: boolean
          storage_bucket: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
          visible_to_roles: Database["public"]["Enums"]["member_role"][]
        }
        Insert: {
          category: string
          chapter_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          storage_bucket: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_roles?: Database["public"]["Enums"]["member_role"][]
        }
        Update: {
          category?: string
          chapter_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          storage_bucket?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visible_to_roles?: Database["public"]["Enums"]["member_role"][]
        }
        Relationships: [
          {
            foreignKeyName: "documents_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          chapter_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          geofence_lat: number | null
          geofence_lng: number | null
          geofence_radius_m: number | null
          id: string
          is_deleted: boolean
          location_name: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          geofence_lat?: number | null
          geofence_lng?: number | null
          geofence_radius_m?: number | null
          id?: string
          is_deleted?: boolean
          location_name?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          geofence_lat?: number | null
          geofence_lng?: number | null
          geofence_radius_m?: number | null
          id?: string
          is_deleted?: boolean
          location_name?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          chapter_id: string | null
          created_at: string
          full_name: string
          id: string
          membership_status: Database["public"]["Enums"]["membership_status"]
          phone: string | null
          role: Database["public"]["Enums"]["access_role"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          chapter_id?: string | null
          created_at?: string
          full_name: string
          id: string
          membership_status?: Database["public"]["Enums"]["membership_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["access_role"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          chapter_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          membership_status?: Database["public"]["Enums"]["membership_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["access_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      prospective_member_notes: {
        Row: {
          author_id: string | null
          chapter_id: string
          created_at: string
          id: string
          note: string
          prospective_member_id: string
        }
        Insert: {
          author_id?: string | null
          chapter_id: string
          created_at?: string
          id?: string
          note: string
          prospective_member_id: string
        }
        Update: {
          author_id?: string | null
          chapter_id?: string
          created_at?: string
          id?: string
          note?: string
          prospective_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospective_member_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospective_member_notes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospective_member_notes_prospective_member_id_fkey"
            columns: ["prospective_member_id"]
            isOneToOne: false
            referencedRelation: "prospective_members"
            referencedColumns: ["id"]
          },
        ]
      }
      prospective_members: {
        Row: {
          chapter_id: string
          created_at: string
          email: string
          form_type: "membership_interest" | "transfer" | "reactivation"
          full_name: string
          id: string
          is_deleted: boolean
          phone: string | null
          pipeline_stage: string
          reviewed_by: string | null
          submitted_payload: Json
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          email: string
          form_type: "membership_interest" | "transfer" | "reactivation"
          full_name: string
          id?: string
          is_deleted?: boolean
          phone?: string | null
          pipeline_stage?: string
          reviewed_by?: string | null
          submitted_payload: Json
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          email?: string
          form_type?: "membership_interest" | "transfer" | "reactivation"
          full_name?: string
          id?: string
          is_deleted?: boolean
          phone?: string | null
          pipeline_stage?: string
          reviewed_by?: string | null
          submitted_payload?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospective_members_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospective_members_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      root_member_roster: {
        Row: {
          chapter_id: string
          claimed_at: string | null
          claimed_profile_id: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          last_name_normalized: string
          membership_number: string
          membership_number_normalized: string
          middle_name: string | null
          roster_email: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          last_name_normalized: string
          membership_number: string
          membership_number_normalized: string
          middle_name?: string | null
          roster_email?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          claimed_at?: string | null
          claimed_profile_id?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          last_name_normalized?: string
          membership_number?: string
          membership_number_normalized?: string
          middle_name?: string | null
          roster_email?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "root_member_roster_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "root_member_roster_claimed_profile_id_fkey"
            columns: ["claimed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          chapter_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_deleted: boolean
          profile_id: string | null
          square_invoice_id: string | null
          square_payment_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          chapter_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          profile_id?: string | null
          square_invoice_id?: string | null
          square_payment_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          chapter_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_deleted?: boolean
          profile_id?: string | null
          square_invoice_id?: string | null
          square_payment_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
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
      current_chapter_ids: { Args: never; Returns: string[] }
      current_member_chapter_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          p_chapter_id: string
          p_roles: Database["public"]["Enums"]["member_role"][]
        }
        Returns: boolean
      }
      is_approved_member: { Args: never; Returns: boolean }
      is_chapter_admin_for: { Args: { p_chapter_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_chapter_id: string
          p_ip?: unknown
          p_metadata?: Json
          p_target_id: string
          p_target_table: string
          p_user_id: string
        }
        Returns: undefined
      }
      claim_root_member_access_request: {
        Args: {
          p_chapter_id: string
          p_full_name: string
          p_profile_id: string
          p_roster_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      access_role: "member" | "chapter_admin" | "super_admin"
      member_role:
        | "Member"
        | "Treasurer"
        | "Secretary"
        | "Intake Director"
        | "Admin"
      membership_status: "pending" | "approved" | "suspended"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_role: ["member", "chapter_admin", "super_admin"],
      member_role: [
        "Member",
        "Treasurer",
        "Secretary",
        "Intake Director",
        "Admin",
      ],
      membership_status: ["pending", "approved", "suspended"],
    },
  },
} as const
