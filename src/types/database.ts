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
      elderly_profiles: {
        Row: {
          id: string;
          full_name: string;
          room_no: string | null;
          gender: string | null;
          birth_date: string | null;
          risk_level: "low" | "medium" | "high";
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          room_no?: string | null;
          gender?: string | null;
          birth_date?: string | null;
          risk_level?: "low" | "medium" | "high";
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          room_no?: string | null;
          gender?: string | null;
          birth_date?: string | null;
          risk_level?: "low" | "medium" | "high";
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      care_reports: {
        Row: {
          id: string;
          elder_id: string;
          status: "processing" | "ready" | "failed";
          audio_path: string | null;
          transcription_raw: string | null;
          report_structured: Json | null;
          report_text: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          elder_id: string;
          status?: "processing" | "ready" | "failed";
          audio_path?: string | null;
          transcription_raw?: string | null;
          report_structured?: Json | null;
          report_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          elder_id?: string;
          status?: "processing" | "ready" | "failed";
          audio_path?: string | null;
          transcription_raw?: string | null;
          report_structured?: Json | null;
          report_text?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_reports_elder_id_fkey";
            columns: ["elder_id"];
            referencedRelation: "elderly_profiles";
            referencedColumns: ["id"];
            isOneToOne?: false;
          }
        ];
      };
      timeline_events: {
        Row: {
          id: string;
          elder_id: string;
          event_type: string;
          title: string;
          detail: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          elder_id: string;
          event_type: string;
          title: string;
          detail?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          elder_id?: string;
          event_type?: string;
          title?: string;
          detail?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_elder_id_fkey";
            columns: ["elder_id"];
            referencedRelation: "elderly_profiles";
            referencedColumns: ["id"];
            isOneToOne?: false;
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
