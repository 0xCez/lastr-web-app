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
    PostgrestVersion: "13.0.5"
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
      account_manager_payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          bonus_amount: number
          created_at: string
          days_hit: number | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          period_type: string
          posts_count: number
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          weeks_hit: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          bonus_amount?: number
          created_at?: string
          days_hit?: number | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          period_type: string
          posts_count?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          weeks_hit?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          bonus_amount?: number
          created_at?: string
          days_hit?: number | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          posts_count?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          weeks_hit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_manager_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_manager_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          handle: string
          id: string
          is_active: boolean
          platform: Database["public"]["Enums"]["platform_type"]
          profile_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          handle: string
          id?: string
          is_active?: boolean
          platform: Database["public"]["Enums"]["platform_type"]
          profile_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          handle?: string
          id?: string
          is_active?: boolean
          platform?: Database["public"]["Enums"]["platform_type"]
          profile_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_onboarding_checklist: {
        Row: {
          app_access_at: string | null
          content_validated_at: string | null
          contract_verified_at: string | null
          created_at: string
          discord_scheduled_at: string | null
          first_post_submitted_at: string | null
          handles_verified_at: string | null
          id: string
          onboarding_call_at: string | null
          updated_at: string
          user_id: string
          voice_note_sent_at: string | null
        }
        Insert: {
          app_access_at?: string | null
          content_validated_at?: string | null
          contract_verified_at?: string | null
          created_at?: string
          discord_scheduled_at?: string | null
          first_post_submitted_at?: string | null
          handles_verified_at?: string | null
          id?: string
          onboarding_call_at?: string | null
          updated_at?: string
          user_id: string
          voice_note_sent_at?: string | null
        }
        Update: {
          app_access_at?: string | null
          content_validated_at?: string | null
          contract_verified_at?: string | null
          created_at?: string
          discord_scheduled_at?: string | null
          first_post_submitted_at?: string | null
          handles_verified_at?: string | null
          id?: string
          onboarding_call_at?: string | null
          updated_at?: string
          user_id?: string
          voice_note_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_onboarding_checklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      am_onboarding_checklist: {
        Row: {
          accounts_assigned_at: string | null
          confirmed_account_pairs_at: string | null
          contract_signed_at: string | null
          created_at: string | null
          id: string
          joined_discord_at: string | null
          submitted_first_post_at: string | null
          updated_at: string | null
          user_id: string
          watched_tutorial_at: string | null
        }
        Insert: {
          accounts_assigned_at?: string | null
          confirmed_account_pairs_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          id?: string
          joined_discord_at?: string | null
          submitted_first_post_at?: string | null
          updated_at?: string | null
          user_id: string
          watched_tutorial_at?: string | null
        }
        Update: {
          accounts_assigned_at?: string | null
          confirmed_account_pairs_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          id?: string
          joined_discord_at?: string | null
          submitted_first_post_at?: string | null
          updated_at?: string | null
          user_id?: string
          watched_tutorial_at?: string | null
        }
        Relationships: []
      }
      am_team_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          instagram_account_id: string | null
          instagram_handle: string | null
          league: string
          team_code: string
          team_name: string
          tiktok_account_id: string | null
          tiktok_handle: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_handle?: string | null
          league?: string
          team_code: string
          team_name: string
          tiktok_account_id?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_handle?: string | null
          league?: string
          team_code?: string
          team_name?: string
          tiktok_account_id?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "am_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "am_team_assignments_instagram_account_id_fkey"
            columns: ["instagram_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "am_team_assignments_tiktok_account_id_fkey"
            columns: ["tiktok_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "am_team_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          bookmarks: number
          comments: number
          created_at: string
          downloads: number | null
          engagement_rate: number | null
          fetch_date: string
          fetched_at: string
          id: string
          likes: number
          post_id: string
          shares: number
          source: string
          views: number
        }
        Insert: {
          bookmarks?: number
          comments?: number
          created_at?: string
          downloads?: number | null
          engagement_rate?: number | null
          fetch_date?: string
          fetched_at?: string
          id?: string
          likes?: number
          post_id: string
          shares?: number
          source?: string
          views?: number
        }
        Update: {
          bookmarks?: number
          comments?: number
          created_at?: string
          downloads?: number | null
          engagement_rate?: number | null
          fetch_date?: string
          fetched_at?: string
          id?: string
          likes?: number
          post_id?: string
          shares?: number
          source?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_jobs: {
        Row: {
          attempt_count: number | null
          batch_number: number
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          post_ids: string[]
          posts_failed: number | null
          posts_succeeded: number | null
          run_date: string
          started_at: string | null
          status: string
          total_batches: number
          triggered_by: string
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          batch_number: number
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          post_ids: string[]
          posts_failed?: number | null
          posts_succeeded?: number | null
          run_date?: string
          started_at?: string | null
          status?: string
          total_batches: number
          triggered_by?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          batch_number?: number
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          post_ids?: string[]
          posts_failed?: number | null
          posts_succeeded?: number | null
          run_date?: string
          started_at?: string | null
          status?: string
          total_batches?: number
          triggered_by?: string
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          base_payout: number | null
          bonus_amount: number | null
          bonus_threshold: number | null
          cpm_rate: number | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          target_posts_monthly: number | null
          target_posts_weekly: number | null
          target_views_monthly: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_payout?: number | null
          bonus_amount?: number | null
          bonus_threshold?: number | null
          cpm_rate?: number | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          target_posts_monthly?: number | null
          target_posts_weekly?: number | null
          target_views_monthly?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_payout?: number | null
          bonus_amount?: number | null
          bonus_threshold?: number | null
          cpm_rate?: number | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          target_posts_monthly?: number | null
          target_posts_weekly?: number | null
          target_views_monthly?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cpm_payments: {
        Row: {
          cpm_rate: number
          created_at: string
          id: string
          month: string
          paid_at: string | null
          status: string
          total_cpm: number
          total_posts: number
          total_views: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cpm_rate: number
          created_at?: string
          id?: string
          month: string
          paid_at?: string | null
          status?: string
          total_cpm?: number
          total_posts?: number
          total_views?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cpm_rate?: number
          created_at?: string
          id?: string
          month?: string
          paid_at?: string | null
          status?: string
          total_cpm?: number
          total_posts?: number
          total_views?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cpm_post_breakdown: {
        Row: {
          cpm_earned: number
          created_at: string
          cumulative_post_cpm: number
          cumulative_user_monthly_cpm: number
          cumulative_views: number
          date: string
          id: string
          is_post_capped: boolean
          is_user_monthly_capped: boolean
          post_age_days: number
          post_id: string
          user_id: string
          views_delta: number
        }
        Insert: {
          cpm_earned?: number
          created_at?: string
          cumulative_post_cpm?: number
          cumulative_user_monthly_cpm?: number
          cumulative_views?: number
          date: string
          id?: string
          is_post_capped?: boolean
          is_user_monthly_capped?: boolean
          post_age_days: number
          post_id: string
          user_id: string
          views_delta?: number
        }
        Update: {
          cpm_earned?: number
          created_at?: string
          cumulative_post_cpm?: number
          cumulative_user_monthly_cpm?: number
          cumulative_views?: number
          date?: string
          id?: string
          is_post_capped?: boolean
          is_user_monthly_capped?: boolean
          post_age_days?: number
          post_id?: string
          user_id?: string
          views_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "cpm_post_breakdown_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpm_post_breakdown_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_posts_queue: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          last_attempt_at: string | null
          last_error: string | null
          platform: string
          post_created_at: string
          post_id: string
          retry_count: number | null
          submitted_by: string
          url: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          platform: string
          post_created_at: string
          post_id: string
          retry_count?: number | null
          submitted_by: string
          url: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          platform?: string
          post_created_at?: string
          post_id?: string
          retry_count?: number | null
          submitted_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "failed_posts_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "post_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failed_posts_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contract_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          post_id: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          post_id?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          post_id?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          accounts_created_at: string | null
          contract_signed_at: string | null
          created_at: string | null
          id: string
          joined_discord_at: string | null
          posted_first_video_at: string | null
          submitted_first_link_at: string | null
          updated_at: string | null
          user_id: string
          warmup_started_at: string | null
          watched_examples_at: string | null
          watched_tutorial_at: string | null
        }
        Insert: {
          accounts_created_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          id?: string
          joined_discord_at?: string | null
          posted_first_video_at?: string | null
          submitted_first_link_at?: string | null
          updated_at?: string | null
          user_id: string
          warmup_started_at?: string | null
          watched_examples_at?: string | null
          watched_tutorial_at?: string | null
        }
        Update: {
          accounts_created_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          id?: string
          joined_discord_at?: string | null
          posted_first_video_at?: string | null
          submitted_first_link_at?: string | null
          updated_at?: string | null
          user_id?: string
          warmup_started_at?: string | null
          watched_examples_at?: string | null
          watched_tutorial_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at: string
          updated_by: string | null
          viral_engagement_threshold: number | null
          viral_view_threshold: number
        }
        Insert: {
          id?: string
          platform: Database["public"]["Enums"]["platform_type"]
          updated_at?: string
          updated_by?: string | null
          viral_engagement_threshold?: number | null
          viral_view_threshold?: number
        }
        Update: {
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          updated_at?: string
          updated_by?: string | null
          viral_engagement_threshold?: number | null
          viral_view_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          account_id: string
          caption: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          platform_post_id: string | null
          published_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slideshow_format: string | null
          status: Database["public"]["Enums"]["post_status"]
          submitted_by: string
          thumbnail_url: string | null
          updated_at: string
          url: string
          viral_alert_acknowledged: boolean | null
          viral_alert_created_at: string | null
          viral_alert_message: string | null
          viral_alert_views: number | null
        }
        Insert: {
          account_id: string
          caption?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          platform_post_id?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slideshow_format?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          submitted_by: string
          thumbnail_url?: string | null
          updated_at?: string
          url: string
          viral_alert_acknowledged?: boolean | null
          viral_alert_created_at?: string | null
          viral_alert_message?: string | null
          viral_alert_views?: number | null
        }
        Update: {
          account_id?: string
          caption?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          platform_post_id?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slideshow_format?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          submitted_by?: string
          thumbnail_url?: string | null
          updated_at?: string
          url?: string
          viral_alert_acknowledged?: boolean | null
          viral_alert_created_at?: string | null
          viral_alert_message?: string | null
          viral_alert_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_events: {
        Row: {
          away_team: string
          created_at: string
          event_date: string
          event_id: string
          event_name: string
          event_time: string | null
          event_timestamp: number | null
          fetched_at: string
          home_team: string
          id: string
          league_id: string
          league_name: string
          sport: string
          status: string | null
          updated_at: string
          venue: string | null
          venue_city: string | null
        }
        Insert: {
          away_team: string
          created_at?: string
          event_date: string
          event_id: string
          event_name: string
          event_time?: string | null
          event_timestamp?: number | null
          fetched_at?: string
          home_team: string
          id?: string
          league_id: string
          league_name: string
          sport: string
          status?: string | null
          updated_at?: string
          venue?: string | null
          venue_city?: string | null
        }
        Update: {
          away_team?: string
          created_at?: string
          event_date?: string
          event_id?: string
          event_name?: string
          event_time?: string | null
          event_timestamp?: number | null
          fetched_at?: string
          home_team?: string
          id?: string
          league_id?: string
          league_name?: string
          sport?: string
          status?: string | null
          updated_at?: string
          venue?: string | null
          venue_city?: string | null
        }
        Relationships: []
      }
      ugc_creator_payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_amount: number
          contract_option: string | null
          cpm_amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_reference: string | null
          paypal_info: string | null
          period_month: number
          period_year: number
          posts_count: number
          status: string
          total_amount: number
          total_views: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          contract_option?: string | null
          cpm_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          paypal_info?: string | null
          period_month: number
          period_year: number
          posts_count?: number
          status?: string
          total_amount?: number
          total_views?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_amount?: number
          contract_option?: string | null
          cpm_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          paypal_info?: string | null
          period_month?: number
          period_year?: number
          posts_count?: number
          status?: string
          total_amount?: number
          total_views?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ugc_creator_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ugc_creator_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          account_id: string
          assigned_at: string
          assigned_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          account_id: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accounts_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          id: string
          milestone_type: string
          milestone_value: number
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type: string
          milestone_value: number
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type?: string
          milestone_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_pairs: number | null
          age_range: string | null
          am_contract_sent_at: string | null
          am_contract_signed_at: string | null
          am_signwell_document_id: string | null
          application_status: Database["public"]["Enums"]["application_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          contract_option: string | null
          contract_sent_at: string | null
          contract_signed_at: string | null
          country: string | null
          created_at: string
          current_streak: number | null
          deleted_at: string | null
          deleted_by: string | null
          devices: number | null
          discord_channel_id: string | null
          discord_id: string | null
          discord_linked_at: string | null
          discord_username: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          last_login_at: string | null
          last_post_date: string | null
          longest_streak: number | null
          paypal_info: string | null
          posts_per_day: number | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          signwell_document_id: string | null
          updated_at: string
        }
        Insert: {
          account_pairs?: number | null
          age_range?: string | null
          am_contract_sent_at?: string | null
          am_contract_signed_at?: string | null
          am_signwell_document_id?: string | null
          application_status?: Database["public"]["Enums"]["application_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          contract_option?: string | null
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          devices?: number | null
          discord_channel_id?: string | null
          discord_id?: string | null
          discord_linked_at?: string | null
          discord_username?: string | null
          email: string
          full_name: string
          gender?: string | null
          id: string
          last_login_at?: string | null
          last_post_date?: string | null
          longest_streak?: number | null
          paypal_info?: string | null
          posts_per_day?: number | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signwell_document_id?: string | null
          updated_at?: string
        }
        Update: {
          account_pairs?: number | null
          age_range?: string | null
          am_contract_sent_at?: string | null
          am_contract_signed_at?: string | null
          am_signwell_document_id?: string | null
          application_status?: Database["public"]["Enums"]["application_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          contract_option?: string | null
          contract_sent_at?: string | null
          contract_signed_at?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          devices?: number | null
          discord_channel_id?: string | null
          discord_id?: string | null
          discord_linked_at?: string | null
          discord_username?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          last_login_at?: string | null
          last_post_date?: string | null
          longest_streak?: number | null
          paypal_info?: string | null
          posts_per_day?: number | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signwell_document_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_run_summary: {
        Row: {
          completed_jobs: number | null
          duration_minutes: number | null
          failed_jobs: number | null
          finished_at: string | null
          pending_jobs: number | null
          processing_jobs: number | null
          run_date: string | null
          started_at: string | null
          total_jobs: number | null
          total_posts_failed: number | null
          total_posts_succeeded: number | null
          triggered_by: string | null
        }
        Relationships: []
      }
      latest_analytics: {
        Row: {
          bookmarks: number | null
          comments: number | null
          created_at: string | null
          downloads: number | null
          engagement_rate: number | null
          fetched_at: string | null
          id: string | null
          likes: number | null
          post_id: string | null
          shares: number | null
          source: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_performance: {
        Row: {
          account_handle: string | null
          bookmarks: number | null
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string | null
          likes: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          published_at: string | null
          shares: number | null
          status: Database["public"]["Enums"]["post_status"] | null
          submitted_by_name: string | null
          url: string | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_ugc_application: { Args: { p_user_id: string }; Returns: Json }
      check_user_role: { Args: { user_id: string }; Returns: string }
      claim_analytics_job: {
        Args: { p_worker_id: string }
        Returns: {
          attempt_count: number | null
          batch_number: number
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          post_ids: string[]
          posts_failed: number | null
          posts_succeeded: number | null
          run_date: string
          started_at: string | null
          status: string
          total_batches: number
          triggered_by: string
          updated_at: string | null
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "analytics_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_old_analytics_jobs: { Args: never; Returns: number }
      complete_user_profile:
        | {
            Args: {
              p_contract_option?: string
              p_country: string
              p_devices?: number
              p_email: string
              p_full_name: string
              p_ig_handle?: string
              p_min_posts?: number
              p_min_views?: number
              p_paypal_info: string
              p_posts_per_day?: number
              p_tiktok_handle?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_age_range?: string
              p_contract_option?: string
              p_country: string
              p_devices?: number
              p_email: string
              p_full_name: string
              p_gender?: string
              p_ig_handle?: string
              p_min_posts?: number
              p_min_views?: number
              p_paypal_info: string
              p_posts_per_day?: number
              p_tiktok_handle?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_account_pairs?: number
              p_age_range?: string
              p_contract_option?: string
              p_country: string
              p_devices?: number
              p_email: string
              p_full_name: string
              p_gender?: string
              p_ig_handle?: string
              p_min_posts?: number
              p_min_views?: number
              p_paypal_info: string
              p_posts_per_day?: number
              p_tiktok_handle?: string
              p_user_id: string
            }
            Returns: Json
          }
      delete_user_completely: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_analytics_run_status: {
        Args: { p_run_date?: string }
        Returns: {
          completed_jobs: number
          estimated_completion: string
          failed_jobs: number
          is_complete: boolean
          pending_jobs: number
          processing_jobs: number
          started_at: string
          total_jobs: number
          total_posts_failed: number
          total_posts_succeeded: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      reject_ugc_application: {
        Args: { p_rejection_reason?: string; p_user_id: string }
        Returns: Json
      }
      set_application_pending: { Args: { p_user_id: string }; Returns: Json }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      application_status: "pending" | "approved" | "rejected"
      content_type: "ugc_video" | "slideshow" | "other"
      contract_status: "active" | "paused" | "completed" | "cancelled"
      notification_type:
        | "viral_post"
        | "missed_target"
        | "contract_update"
        | "payment"
        | "system"
      platform_type: "tiktok" | "instagram" | "facebook"
      post_status: "pending" | "approved" | "rejected" | "processing"
      user_role:
        | "admin"
        | "account_manager"
        | "ugc_creator"
        | "influencer"
        | "manager_1"
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
      application_status: ["pending", "approved", "rejected"],
      content_type: ["ugc_video", "slideshow", "other"],
      contract_status: ["active", "paused", "completed", "cancelled"],
      notification_type: [
        "viral_post",
        "missed_target",
        "contract_update",
        "payment",
        "system",
      ],
      platform_type: ["tiktok", "instagram", "facebook"],
      post_status: ["pending", "approved", "rejected", "processing"],
      user_role: [
        "admin",
        "account_manager",
        "ugc_creator",
        "influencer",
        "manager_1",
      ],
    },
  },
} as const
