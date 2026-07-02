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
      children: {
        Row: {
          avatar: string
          birth_year: number | null
          created_at: string
          first_name: string
          id: string
          parent_id: string
          therapist_id: string | null
        }
        Insert: {
          avatar?: string
          birth_year?: number | null
          created_at?: string
          first_name: string
          id?: string
          parent_id: string
          therapist_id?: string | null
        }
        Update: {
          avatar?: string
          birth_year?: number | null
          created_at?: string
          first_name?: string
          id?: string
          parent_id?: string
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          age_max: number
          age_min: number
          content: Json
          created_at: string
          created_by: string | null
          difficulty: number
          domain: Database["public"]["Enums"]["exercise_domain"]
          duration_minutes: number
          id: string
          is_active: boolean
          is_builtin: boolean
          modality: Database["public"]["Enums"]["exercise_modality"]
          parent_guide: string
          slug: string | null
          summary: string
          title: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          content: Json
          created_at?: string
          created_by?: string | null
          difficulty: number
          domain: Database["public"]["Enums"]["exercise_domain"]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          modality: Database["public"]["Enums"]["exercise_modality"]
          parent_guide?: string
          slug?: string | null
          summary: string
          title: string
        }
        Update: {
          age_max?: number
          age_min?: number
          content?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: number
          domain?: Database["public"]["Enums"]["exercise_domain"]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_builtin?: boolean
          modality?: Database["public"]["Enums"]["exercise_modality"]
          parent_guide?: string
          slug?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          child_birth_year: number | null
          child_first_name: string
          child_id: string | null
          code: string
          created_at: string
          id: string
          note: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          therapist_id: string
        }
        Insert: {
          child_birth_year?: number | null
          child_first_name: string
          child_id?: string | null
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          therapist_id: string
        }
        Update: {
          child_birth_year?: number | null
          child_first_name?: string
          child_id?: string | null
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          therapist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          child_id: string
          created_at: string
          id: string
          kind: string
          meta: Json | null
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          body?: string
          child_id: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          body?: string
          child_id?: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_items: {
        Row: {
          exercise_id: string
          id: string
          plan_id: string
          sort_order: number
          support_level: number
          times_per_week: number
        }
        Insert: {
          exercise_id: string
          id?: string
          plan_id: string
          sort_order?: number
          support_level?: number
          times_per_week?: number
        }
        Update: {
          exercise_id?: string
          id?: string
          plan_id?: string
          sort_order?: number
          support_level?: number
          times_per_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          child_id: string
          created_at: string
          id: string
          note: string | null
          status: string
          therapist_id: string
          title: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          therapist_id: string
          title: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          therapist_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          locale: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          child_id: string
          completed_at: string | null
          detail: Json | null
          duration_seconds: number | null
          exercise_id: string
          hints_used: number
          id: string
          parent_note: string | null
          plan_item_id: string | null
          score_correct: number | null
          score_total: number | null
          started_at: string
          support_level: number
        }
        Insert: {
          child_id: string
          completed_at?: string | null
          detail?: Json | null
          duration_seconds?: number | null
          exercise_id: string
          hints_used?: number
          id?: string
          parent_note?: string | null
          plan_item_id?: string | null
          score_correct?: number | null
          score_total?: number | null
          started_at?: string
          support_level?: number
        }
        Update: {
          child_id?: string
          completed_at?: string | null
          detail?: Json | null
          duration_seconds?: number | null
          exercise_id?: string
          hints_used?: number
          id?: string
          parent_note?: string | null
          plan_item_id?: string | null
          score_correct?: number | null
          score_total?: number | null
          started_at?: string
          support_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_exercise: { Args: { p_exercise: string }; Returns: boolean }
      generate_invite_code: { Args: never; Returns: string }
      is_parent_of: { Args: { p_child: string }; Returns: boolean }
      is_therapist_of: { Args: { p_child: string }; Returns: boolean }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      redeem_invite: { Args: { p_code: string }; Returns: string }
      shares_child: { Args: { p_profile: string }; Returns: boolean }
    }
    Enums: {
      exercise_domain:
        | "phonemic_awareness"
        | "working_memory"
        | "attention"
        | "narrative"
        | "vocabulary"
        | "articulation"
        | "guided"
      exercise_modality: "interactive" | "speech" | "guided"
      user_role: "parent" | "therapist"
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
      exercise_domain: [
        "phonemic_awareness",
        "working_memory",
        "attention",
        "narrative",
        "vocabulary",
        "articulation",
        "guided",
      ],
      exercise_modality: ["interactive", "speech", "guided"],
      user_role: ["parent", "therapist"],
    },
  },
} as const
