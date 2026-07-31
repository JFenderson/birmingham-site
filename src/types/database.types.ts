/**
 * Hand-authored to match supabase/migrations/*.sql for Phase 1.
 *
 * Regenerate against the live project once linked, and commit the result
 * over this file:
 *   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 */

export type MemberRole =
  | "Member"
  | "Treasurer"
  | "Secretary"
  | "Intake Director"
  | "Admin";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chapters: {
        Row: {
          id: string;
          slug: string;
          name: string;
          type: "graduate" | "collegiate";
          parent_chapter_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          type: "graduate" | "collegiate";
          parent_chapter_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      chapter_members: {
        Row: {
          id: string;
          chapter_id: string;
          profile_id: string;
          role: MemberRole;
          status: "active" | "inactive" | "alumni" | "suspended";
          joined_at: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          profile_id: string;
          role?: MemberRole;
          status?: "active" | "inactive" | "alumni" | "suspended";
          joined_at?: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["chapter_members"]["Insert"]
        >;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          chapter_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string | null;
          location_name: string | null;
          geofence_lat: number | null;
          geofence_lng: number | null;
          geofence_radius_m: number | null;
          created_by: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          location_name?: string | null;
          geofence_lat?: number | null;
          geofence_lng?: number | null;
          geofence_radius_m?: number | null;
          created_by?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      attendance_logs: {
        Row: {
          id: string;
          chapter_id: string;
          event_id: string;
          profile_id: string;
          checked_in_at: string;
          check_in_lat: number | null;
          check_in_lng: number | null;
          distance_from_geofence_m: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          event_id: string;
          profile_id: string;
          checked_in_at?: string;
          check_in_lat?: number | null;
          check_in_lng?: number | null;
          distance_from_geofence_m?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["attendance_logs"]["Insert"]
        >;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          chapter_id: string;
          profile_id: string | null;
          type: "dues" | "event_fee" | "donation" | "refund" | "other";
          amount_cents: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          square_payment_id: string | null;
          square_invoice_id: string | null;
          description: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          profile_id?: string | null;
          type: "dues" | "event_fee" | "donation" | "refund" | "other";
          amount_cents: number;
          currency?: string;
          status?: "pending" | "completed" | "failed" | "refunded";
          square_payment_id?: string | null;
          square_invoice_id?: string | null;
          description?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["transactions"]["Insert"]
        >;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          chapter_id: string;
          category: "bylaws" | "financials" | "minutes" | "other";
          title: string;
          storage_bucket: string;
          storage_path: string;
          uploaded_by: string | null;
          visible_to_roles: MemberRole[];
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          category: "bylaws" | "financials" | "minutes" | "other";
          title: string;
          storage_bucket: string;
          storage_path: string;
          uploaded_by?: string | null;
          visible_to_roles?: MemberRole[];
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      prospective_members: {
        Row: {
          id: string;
          chapter_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          pipeline_stage:
            | "submitted"
            | "under_review"
            | "interview"
            | "approved"
            | "denied"
            | "reactivation"
            | "transfer";
          form_type: "intake" | "reactivation" | "transfer";
          submitted_payload: Json;
          reviewed_by: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          pipeline_stage?:
            | "submitted"
            | "under_review"
            | "interview"
            | "approved"
            | "denied"
            | "reactivation"
            | "transfer";
          form_type: "intake" | "reactivation" | "transfer";
          submitted_payload: Json;
          reviewed_by?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["prospective_members"]["Insert"]
        >;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          chapter_id: string | null;
          user_id: string | null;
          action: string;
          target_table: string;
          target_id: string | null;
          ip_address: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id?: string | null;
          user_id?: string | null;
          action: string;
          target_table: string;
          target_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_chapter_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      has_role: {
        Args: { p_chapter_id: string; p_roles: MemberRole[] };
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_chapter_id: string | null;
          p_user_id: string | null;
          p_action: string;
          p_target_table: string;
          p_target_id: string | null;
          p_ip?: string | null;
          p_metadata?: Json;
        };
        Returns: void;
      };
    };
    Enums: {
      member_role: MemberRole;
    };
  };
}
