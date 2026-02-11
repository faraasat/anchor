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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anchor_points: {
        Row: {
          action_type: string
          bluetooth_device_id: string | null
          bluetooth_device_name: string | null
          created_at: string
          description: string | null
          enabled: boolean
          icon: string | null
          id: string
          last_triggered: string | null
          name: string
          nfc_uid: string | null
          notification_message: string | null
          target_reminder_id: string | null
          target_stack_name: string | null
          trigger_count: number
          type: string
          user_id: string
        }
        Insert: {
          action_type: string
          bluetooth_device_id?: string | null
          bluetooth_device_name?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          icon?: string | null
          id: string
          last_triggered?: string | null
          name: string
          nfc_uid?: string | null
          notification_message?: string | null
          target_reminder_id?: string | null
          target_stack_name?: string | null
          trigger_count?: number
          type: string
          user_id: string
        }
        Update: {
          action_type?: string
          bluetooth_device_id?: string | null
          bluetooth_device_name?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          icon?: string | null
          id?: string
          last_triggered?: string | null
          name?: string
          nfc_uid?: string | null
          notification_message?: string | null
          target_reminder_id?: string | null
          target_stack_name?: string | null
          trigger_count?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_wellness_goals: {
        Row: {
          circle_id: string
          color: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string | null
          icon: string | null
          id: string
          name: string
          participants: Json | null
          period: string
          start_date: string | null
          target_value: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          circle_id: string
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          name: string
          participants?: Json | null
          period: string
          start_date?: string | null
          target_value: number
          unit: string
          updated_at?: string | null
        }
        Update: {
          circle_id?: string
          color?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          name?: string
          participants?: Json | null
          period?: string
          start_date?: string | null
          target_value?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_wellness_goals_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_wellness_progress: {
        Row: {
          created_at: string | null
          date: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date?: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "circle_wellness_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "circle_wellness_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invite_code: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read_at: string | null
          recipient_id: string
          reminder_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          recipient_id: string
          reminder_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          recipient_id?: string
          reminder_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudges_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudges_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudges_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      productivity_stats: {
        Row: {
          completed_count: number | null
          completion_rate: number | null
          created_at: string | null
          date: string
          household_id: string | null
          id: string
          streak_days: number | null
          total_count: number | null
          user_id: string
        }
        Insert: {
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date: string
          household_id?: string | null
          id?: string
          streak_days?: number | null
          total_count?: number | null
          user_id: string
        }
        Update: {
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date?: string
          household_id?: string | null
          id?: string
          streak_days?: number | null
          total_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productivity_stats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productivity_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          assigned_to: string | null
          bluetooth_trigger: Json | null
          chain_count: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          due_time: string
          household_id: string | null
          id: string
          is_recurring: boolean | null
          is_sensitive: boolean | null
          last_completed_date: string | null
          location_trigger: Json | null
          longest_chain: number | null
          nfc_trigger: string | null
          priority: string
          recurrence: Json | null
          sensitive_delete_at: string | null
          snoozed_until: string | null
          status: string
          tag: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          bluetooth_trigger?: Json | null
          chain_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          due_time: string
          household_id?: string | null
          id?: string
          is_recurring?: boolean | null
          is_sensitive?: boolean | null
          last_completed_date?: string | null
          location_trigger?: Json | null
          longest_chain?: number | null
          nfc_trigger?: string | null
          priority?: string
          recurrence?: Json | null
          sensitive_delete_at?: string | null
          snoozed_until?: string | null
          status?: string
          tag: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          bluetooth_trigger?: Json | null
          chain_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          due_time?: string
          household_id?: string | null
          id?: string
          is_recurring?: boolean | null
          is_sensitive?: boolean | null
          last_completed_date?: string | null
          location_trigger?: Json | null
          longest_chain?: number | null
          nfc_trigger?: string | null
          priority?: string
          recurrence?: Json | null
          sensitive_delete_at?: string | null
          snoozed_until?: string | null
          status?: string
          tag?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_templates: {
        Row: {
          author_id: string
          category: string
          created_at: string | null
          description: string
          downloads: number | null
          id: string
          is_public: boolean | null
          tasks: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category: string
          created_at?: string | null
          description: string
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          tasks: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          created_at?: string | null
          description?: string
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          tasks?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_templates_author_id_fkey"
            columns: ["author_id"]
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
      calculate_daily_stats: { Args: never; Returns: undefined }
      check_overdue_reminders: { Args: never; Returns: undefined }
      generate_invite_code: { Args: never; Returns: string }
      join_circle_by_invite_code: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: string
      }
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
    Enums: {},
  },
} as const
