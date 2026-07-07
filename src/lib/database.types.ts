export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      games: {
        Row: {
          created_at: string
          game_bgg_id: number | null
          game_bgg_rating: number | null
          game_bgg_synced_at: string | null
          game_bgg_url: string | null
          game_description: string | null
          game_id: string
          game_image_url: string | null
          game_name: string
          game_year_published: number | null
        }
        Insert: {
          created_at?: string
          game_bgg_id?: number | null
          game_bgg_rating?: number | null
          game_bgg_synced_at?: string | null
          game_bgg_url?: string | null
          game_description?: string | null
          game_id?: string
          game_image_url?: string | null
          game_name: string
          game_year_published?: number | null
        }
        Update: {
          created_at?: string
          game_bgg_id?: number | null
          game_bgg_rating?: number | null
          game_bgg_synced_at?: string | null
          game_bgg_url?: string | null
          game_description?: string | null
          game_id?: string
          game_image_url?: string | null
          game_name?: string
          game_year_published?: number | null
        }
        Relationships: []
      }
      player: {
        Row: {
          auth_id: string | null
          created_at: string
          player_id: string
          player_name: string
          player_role: Database['public']['Enums']['player_role']
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          player_id?: string
          player_name: string
          player_role?: Database['public']['Enums']['player_role']
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          player_id?: string
          player_name?: string
          player_role?: Database['public']['Enums']['player_role']
          updated_at?: string | null
        }
        Relationships: []
      }
      player_sessions: {
        Row: {
          created_at: string
          player_id: string | null
          player_session_id: string
          player_session_position: number
          player_session_score: number
          session_id: string | null
        }
        Insert: {
          created_at?: string
          player_id?: string | null
          player_session_id?: string
          player_session_position: number
          player_session_score: number
          session_id?: string | null
        }
        Update: {
          created_at?: string
          player_id?: string | null
          player_session_id?: string
          player_session_position?: number
          player_session_score?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'player_sessions_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'player'
            referencedColumns: ['player_id']
          },
          {
            foreignKeyName: 'player_sessions_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'sessions'
            referencedColumns: ['session_id']
          },
        ]
      }
      season_games: {
        Row: {
          chosen_by: string | null
          created_at: string
          game_id: string
          season_games_id: string
          season_id: string
        }
        Insert: {
          chosen_by?: string | null
          created_at?: string
          game_id: string
          season_games_id?: string
          season_id: string
        }
        Update: {
          chosen_by?: string | null
          created_at?: string
          game_id?: string
          season_games_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'season_games_chosen_by_fkey'
            columns: ['chosen_by']
            isOneToOne: false
            referencedRelation: 'player'
            referencedColumns: ['player_id']
          },
          {
            foreignKeyName: 'season_games_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['game_id']
          },
          {
            foreignKeyName: 'season_games_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'seasons'
            referencedColumns: ['season_id']
          },
        ]
      }
      season_players: {
        Row: {
          created_at: string
          date_paid: string | null
          player_id: string
          season_id: string
          season_players_id: string
        }
        Insert: {
          created_at?: string
          date_paid?: string | null
          player_id: string
          season_id: string
          season_players_id?: string
        }
        Update: {
          created_at?: string
          date_paid?: string | null
          player_id?: string
          season_id?: string
          season_players_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'season_players_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'player'
            referencedColumns: ['player_id']
          },
          {
            foreignKeyName: 'season_players_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'seasons'
            referencedColumns: ['season_id']
          },
        ]
      }
      season_scoring_schedules: {
        Row: {
          created_at: string
          multipliers: number[]
          schedule_id: string
          season_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          multipliers: number[]
          schedule_id?: string
          season_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          multipliers?: number[]
          schedule_id?: string
          season_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'season_scoring_schedules_season_id_fkey'
            columns: ['season_id']
            isOneToOne: true
            referencedRelation: 'seasons'
            referencedColumns: ['season_id']
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          season_banner_url: string | null
          season_description: string | null
          season_id: string
          season_logo_url: string | null
          season_name: string
          season_status: Database['public']['Enums']['Season Status']
        }
        Insert: {
          created_at?: string
          season_banner_url?: string | null
          season_description?: string | null
          season_id?: string
          season_logo_url?: string | null
          season_name: string
          season_status?: Database['public']['Enums']['Season Status']
        }
        Update: {
          created_at?: string
          season_banner_url?: string | null
          season_description?: string | null
          season_id?: string
          season_logo_url?: string | null
          season_name?: string
          season_status?: Database['public']['Enums']['Season Status']
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          game_id: string
          season_id: string
          session_date_played: string
          session_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          season_id: string
          session_date_played?: string
          session_id?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          season_id?: string
          session_date_played?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['game_id']
          },
          {
            foreignKeyName: 'sessions_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'seasons'
            referencedColumns: ['season_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database['public']['Enums']['player_role']
      }
    }
    Enums: {
      player_role: 'ADMIN' | 'PLAYER'
      'Season Status': 'UPCOMING' | 'IN_PROGRESS' | 'SUSPENDED' | 'COMPLETED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      player_role: ['ADMIN', 'PLAYER'],
      'Season Status': ['UPCOMING', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED'],
    },
  },
} as const
