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
      admin_audit: {
        Row: {
          action: string
          actor_user_id: string
          id: string
          metadata: Json | null
          target_email: string | null
          ts: string
        }
        Insert: {
          action: string
          actor_user_id: string
          id?: string
          metadata?: Json | null
          target_email?: string | null
          ts?: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          id?: string
          metadata?: Json | null
          target_email?: string | null
          ts?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          subscription_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          subscription_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          subscription_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_heartbeats: {
        Row: {
          consecutive_failures: number
          created_at: string
          function_name: string
          id: string
          last_beat_at: string
          last_result: Json | null
          status: string
          total_failures: number
          total_runs: number
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          function_name: string
          id?: string
          last_beat_at?: string
          last_result?: Json | null
          status?: string
          total_failures?: number
          total_runs?: number
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          function_name?: string
          id?: string
          last_beat_at?: string
          last_result?: Json | null
          status?: string
          total_failures?: number
          total_runs?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_response_history: {
        Row: {
          attempt_number: number
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          order_id: string
          queue_id: string | null
          response_body: Json | null
          response_code: number | null
          response_status: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          order_id: string
          queue_id?: string | null
          response_body?: Json | null
          response_code?: number | null
          response_status: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          order_id?: string
          queue_id?: string | null
          response_body?: Json | null
          response_code?: number | null
          response_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_response_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_response_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "order_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      order_dlq: {
        Row: {
          created_at: string
          error_message: string
          failed_at: string
          id: string
          order_id: string
          original_payload: Json
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          retry_count: number
        }
        Insert: {
          created_at?: string
          error_message: string
          failed_at?: string
          id?: string
          order_id: string
          original_payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
        }
        Update: {
          created_at?: string
          error_message?: string
          failed_at?: string
          id?: string
          order_id?: string
          original_payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          retry_count?: number
        }
        Relationships: []
      }
      order_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          order_id: string
          payload: Json
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          order_id: string
          payload?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          order_id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          currency: string
          email: string
          id: string
          order_token: string
          package_name: string | null
          paid_at: string | null
          photo_count: number | null
          photo_files: string[]
          plan_id: string | null
          promo_code: string | null
          promo_group: string | null
          promo_variant: string | null
          result_files: string[] | null
          source_page: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          used_credits: number | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          email: string
          id?: string
          order_token?: string
          package_name?: string | null
          paid_at?: string | null
          photo_count?: number | null
          photo_files?: string[]
          plan_id?: string | null
          promo_code?: string | null
          promo_group?: string | null
          promo_variant?: string | null
          result_files?: string[] | null
          source_page?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          used_credits?: number | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          email?: string
          id?: string
          order_token?: string
          package_name?: string | null
          paid_at?: string | null
          photo_count?: number | null
          photo_files?: string[]
          plan_id?: string | null
          promo_code?: string | null
          promo_group?: string | null
          promo_variant?: string | null
          result_files?: string[] | null
          source_page?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          used_credits?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string | null
          credits_included: number | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price_cents: number
        }
        Insert: {
          created_at?: string | null
          credits_included?: number | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id: string
          interval?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price_cents: number
        }
        Update: {
          created_at?: string | null
          credits_included?: number | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      promo_events: {
        Row: {
          ab_group: string | null
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          page_path: string
          promo_code: string
          session_id: string | null
          variant: string
        }
        Insert: {
          ab_group?: string | null
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          page_path: string
          promo_code: string
          session_id?: string | null
          variant?: string
        }
        Update: {
          ab_group?: string | null
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          page_path?: string
          promo_code?: string
          session_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string | null
          metadata: Json | null
          plan_id: string
          plan_name: string
          price_cents: number
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          plan_id: string
          plan_name: string
          price_cents: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          plan_id?: string
          plan_name?: string
          price_cents?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          last_top_up: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          last_top_up?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          last_top_up?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          credits_balance: number | null
          full_name: string | null
          id: string
          metadata: Json | null
          orders_count: number | null
          referral_code: string | null
          referred_by: string | null
          role: string | null
          total_spent_cents: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          credits_balance?: number | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          orders_count?: number | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          total_spent_cents?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          credits_balance?: number | null
          full_name?: string | null
          id?: string
          metadata?: Json | null
          orders_count?: number | null
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          total_spent_cents?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_transaction_id?: string
          p_user_id: string
        }
        Returns: number
      }
      deduct_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: boolean
      }
      get_admins: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: string
          user_id: string
        }[]
      }
      get_credit_balance: { Args: { p_user_id: string }; Returns: number }
      get_user_credit_summary: {
        Args: { p_user_id: string }
        Returns: {
          balance: number
          last_transaction: string
          monthly_usage: Json
          total_earned: number
          total_spent: number
        }[]
      }
      grant_admin: { Args: { p_email: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      revoke_admin: { Args: { p_email: string }; Returns: Json }
      transfer_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_from_user_id: string
          p_to_user_id: string
        }
        Returns: boolean
      }
      verify_order_token: { Args: { token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
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
      app_role: ["admin", "moderator", "user"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
    },
  },
} as const
