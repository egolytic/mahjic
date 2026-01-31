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
      claim_tokens: {
        Row: {
          claimed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          player_id: string
          token: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          player_id: string
          token: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          player_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_tokens_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          game_type: string
          id: string
          session_date: string
          source_id: string
        }
        Insert: {
          created_at?: string
          game_type: string
          id?: string
          session_date: string
          source_id: string
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          session_date?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "verified_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          games_played: number
          id: string
          mahjic_rating: number
          name: string | null
          privacy_mode: string
          stripe_customer_id: string | null
          tier: string
          verified_at: string | null
          verified_rating: number
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          games_played?: number
          id?: string
          mahjic_rating?: number
          name?: string | null
          privacy_mode?: string
          stripe_customer_id?: string | null
          tier?: string
          verified_at?: string | null
          verified_rating?: number
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          games_played?: number
          id?: string
          mahjic_rating?: number
          name?: string | null
          privacy_mode?: string
          stripe_customer_id?: string | null
          tier?: string
          verified_at?: string | null
          verified_rating?: number
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          created_at: string
          id: string
          player_id: string
          rating_after: number
          rating_before: number
          rating_type: string
          round_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          rating_after: number
          rating_before: number
          rating_type: string
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          rating_after?: number
          rating_before?: number
          rating_type?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_history_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      round_players: {
        Row: {
          created_at: string
          elo_before: number
          elo_change: number
          id: string
          mahjongs: number
          player_id: string
          points: number | null
          round_id: string
        }
        Insert: {
          created_at?: string
          elo_before: number
          elo_change: number
          id?: string
          mahjongs?: number
          player_id: string
          points?: number | null
          round_id: string
        }
        Update: {
          created_at?: string
          elo_before?: number
          elo_change?: number
          id?: string
          mahjongs?: number
          player_id?: string
          points?: number | null
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_players_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string
          games_played: number
          id: string
          session_id: string
          wall_games: number
        }
        Insert: {
          created_at?: string
          games_played: number
          id?: string
          session_id: string
          wall_games?: number
        }
        Update: {
          created_at?: string
          games_played?: number
          id?: string
          session_id?: string
          wall_games?: number
        }
        Relationships: [
          {
            foreignKeyName: "rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_applications: {
        Row: {
          contact_email: string
          created_at: string
          description: string | null
          id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: string
          website: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string
          website?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      verified_sources: {
        Row: {
          api_key: string
          approved_at: string | null
          contact_email: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          api_key: string
          approved_at?: string | null
          contact_email: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          api_key?: string
          approved_at?: string | null
          contact_email?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
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
