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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: string | null
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      ad_campaign_events: {
        Row: {
          campaign_id: string
          country: string | null
          created_at: string
          donation_amount: number | null
          donation_id: string | null
          event_type: string
          id: string
          metadata: Json
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id: string
          country?: string | null
          created_at?: string
          donation_amount?: number | null
          donation_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string
          country?: string | null
          created_at?: string
          donation_amount?: number | null
          donation_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          budget_egp: number
          channel: string
          created_at: string
          created_by: string | null
          cta_label_ar: string
          cta_label_en: string
          end_date: string | null
          headline_ar: string
          headline_en: string
          hero_image_url: string | null
          id: string
          name: string
          notes: string | null
          program_slug: string | null
          slug: string
          spend_egp: number
          start_date: string | null
          status: string
          subheadline_ar: string
          subheadline_en: string
          target_url: string | null
          updated_at: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          budget_egp?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          cta_label_ar?: string
          cta_label_en?: string
          end_date?: string | null
          headline_ar?: string
          headline_en?: string
          hero_image_url?: string | null
          id?: string
          name: string
          notes?: string | null
          program_slug?: string | null
          slug: string
          spend_egp?: number
          start_date?: string | null
          status?: string
          subheadline_ar?: string
          subheadline_en?: string
          target_url?: string | null
          updated_at?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Update: {
          budget_egp?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          cta_label_ar?: string
          cta_label_en?: string
          end_date?: string | null
          headline_ar?: string
          headline_en?: string
          hero_image_url?: string | null
          id?: string
          name?: string
          notes?: string | null
          program_slug?: string | null
          slug?: string
          spend_egp?: number
          start_date?: string | null
          status?: string
          subheadline_ar?: string
          subheadline_en?: string
          target_url?: string | null
          updated_at?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: []
      }
      admin_module_scopes: {
        Row: {
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body_ar: string[]
          body_en: string[]
          category_ar: string
          category_en: string
          created_at: string
          created_by: string | null
          excerpt_ar: string
          excerpt_en: string
          focus_keyword: string | null
          id: string
          image_url: string | null
          og_image_url: string | null
          published_at: string | null
          scheduled_at: string | null
          seo_score: number
          slug: string
          status: string
          tags_ar: string[]
          tags_en: string[]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          body_ar?: string[]
          body_en?: string[]
          category_ar?: string
          category_en?: string
          created_at?: string
          created_by?: string | null
          excerpt_ar?: string
          excerpt_en?: string
          focus_keyword?: string | null
          id?: string
          image_url?: string | null
          og_image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_score?: number
          slug: string
          status?: string
          tags_ar?: string[]
          tags_en?: string[]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          body_ar?: string[]
          body_en?: string[]
          category_ar?: string
          category_en?: string
          created_at?: string
          created_by?: string | null
          excerpt_ar?: string
          excerpt_en?: string
          focus_keyword?: string | null
          id?: string
          image_url?: string | null
          og_image_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_score?: number
          slug?: string
          status?: string
          tags_ar?: string[]
          tags_en?: string[]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_categories: {
        Row: {
          active: boolean
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          caption: string | null
          case_id: string
          created_at: string
          doc_type: string
          id: string
          is_public: boolean
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          case_id: string
          created_at?: string
          doc_type?: string
          id?: string
          is_public?: boolean
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          case_id?: string
          created_at?: string
          doc_type?: string
          id?: string
          is_public?: boolean
          storage_path?: string
          uploaded_by?: string | null
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
      case_media: {
        Row: {
          caption_ar: string | null
          caption_en: string | null
          case_id: string
          created_at: string
          id: string
          is_public: boolean
          kind: Database["public"]["Enums"]["case_media_kind"]
          sort_order: number
          updated_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption_ar?: string | null
          caption_en?: string | null
          case_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          kind?: Database["public"]["Enums"]["case_media_kind"]
          sort_order?: number
          updated_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption_ar?: string | null
          caption_en?: string | null
          case_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          kind?: Database["public"]["Enums"]["case_media_kind"]
          sort_order?: number
          updated_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      case_updates: {
        Row: {
          author_id: string | null
          body: string
          case_id: string
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          case_id: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_updates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          area: string | null
          assigned_delegate_id: string | null
          beneficiary_age: number | null
          beneficiary_gender: Database["public"]["Enums"]["gender"] | null
          beneficiary_name: string
          category_id: string
          city: string | null
          closed_at: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          delegate_notes: string | null
          governorate: string
          id: string
          needed_amount: number
          raised_amount: number
          ref_code: string
          rejection_reason: string | null
          scheduled_visit_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          story: string
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          area?: string | null
          assigned_delegate_id?: string | null
          beneficiary_age?: number | null
          beneficiary_gender?: Database["public"]["Enums"]["gender"] | null
          beneficiary_name: string
          category_id: string
          city?: string | null
          closed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          delegate_notes?: string | null
          governorate?: string
          id?: string
          needed_amount?: number
          raised_amount?: number
          ref_code?: string
          rejection_reason?: string | null
          scheduled_visit_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          story?: string
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          area?: string | null
          assigned_delegate_id?: string | null
          beneficiary_age?: number | null
          beneficiary_gender?: Database["public"]["Enums"]["gender"] | null
          beneficiary_name?: string
          category_id?: string
          city?: string | null
          closed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          delegate_notes?: string | null
          governorate?: string
          id?: string
          needed_amount?: number
          raised_amount?: number
          ref_code?: string
          rejection_reason?: string | null
          scheduled_visit_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          story?: string
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          is_read: boolean
          message: string
          name: string
          phone: string | null
          ref_code: string
          replied_at: string | null
          section: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          ref_code?: string
          replied_at?: string | null
          section?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          ref_code?: string
          replied_at?: string | null
          section?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      donation_journey_steps: {
        Row: {
          case_id: string | null
          created_at: string
          created_by: string | null
          donation_id: string | null
          id: string
          is_public: boolean
          media_url: string | null
          note_ar: string | null
          note_en: string | null
          occurred_at: string
          step_key: Database["public"]["Enums"]["journey_step_key"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          donation_id?: string | null
          id?: string
          is_public?: boolean
          media_url?: string | null
          note_ar?: string | null
          note_en?: string | null
          occurred_at?: string
          step_key: Database["public"]["Enums"]["journey_step_key"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          donation_id?: string | null
          id?: string
          is_public?: boolean
          media_url?: string | null
          note_ar?: string | null
          note_en?: string | null
          occurred_at?: string
          step_key?: Database["public"]["Enums"]["journey_step_key"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      donation_nodes: {
        Row: {
          active: boolean
          amount: number | null
          collected_amount: number
          created_at: string
          description_ar: string | null
          description_en: string | null
          direct_checkout: boolean
          id: string
          image_url: string | null
          metadata: Json
          parent_id: string | null
          slug: string
          sort_order: number
          target_amount: number | null
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["donation_node_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number | null
          collected_amount?: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          direct_checkout?: boolean
          id?: string
          image_url?: string | null
          metadata?: Json
          parent_id?: string | null
          slug: string
          sort_order?: number
          target_amount?: number | null
          title_ar: string
          title_en?: string
          type?: Database["public"]["Enums"]["donation_node_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number | null
          collected_amount?: number
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          direct_checkout?: boolean
          id?: string
          image_url?: string | null
          metadata?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number
          target_amount?: number | null
          title_ar?: string
          title_en?: string
          type?: Database["public"]["Enums"]["donation_node_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "donation_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_status_audit: {
        Row: {
          changed_by: string | null
          changed_by_label: string | null
          created_at: string
          donation_id: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          source: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_label?: string | null
          created_at?: string
          donation_id: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          source?: string
        }
        Update: {
          changed_by?: string | null
          changed_by_label?: string | null
          created_at?: string
          donation_id?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_status_audit_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string | null
          case_id: string | null
          category_id: string | null
          created_at: string
          currency: string
          donor_email: string | null
          donor_id: string | null
          donor_name: string | null
          donor_phone: string | null
          id: string
          idempotency_key: string | null
          message: string | null
          payment_method: string | null
          payment_status: string
          ref_code: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          case_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          payment_method?: string | null
          payment_status?: string
          ref_code?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          case_id?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string | null
          payment_method?: string | null
          payment_status?: string
          ref_code?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          caption_ar: string | null
          caption_en: string | null
          city: string | null
          created_at: string
          created_by: string | null
          donate_program: string | null
          height: number | null
          id: string
          image_url: string
          is_featured: boolean
          is_published: boolean
          program_slug: string
          sort_order: number
          storage_path: string | null
          title_ar: string
          title_en: string
          updated_at: string
          width: number | null
        }
        Insert: {
          caption_ar?: string | null
          caption_en?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          donate_program?: string | null
          height?: number | null
          id?: string
          image_url: string
          is_featured?: boolean
          is_published?: boolean
          program_slug?: string
          sort_order?: number
          storage_path?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          caption_ar?: string | null
          caption_en?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          donate_program?: string | null
          height?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean
          is_published?: boolean
          program_slug?: string
          sort_order?: number
          storage_path?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      khabia_requests: {
        Row: {
          address: string | null
          amount_collected: number | null
          assigned_delegate_id: string | null
          city: string
          collected_at: string | null
          collection_proof_url: string | null
          created_at: string
          delegate_name: string | null
          delivered_at: string | null
          delivery_proof_url: string | null
          full_name: string
          id: string
          ip_hash: string | null
          notes: string | null
          phone: string
          ref_code: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["khabia_status"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          address?: string | null
          amount_collected?: number | null
          assigned_delegate_id?: string | null
          city: string
          collected_at?: string | null
          collection_proof_url?: string | null
          created_at?: string
          delegate_name?: string | null
          delivered_at?: string | null
          delivery_proof_url?: string | null
          full_name: string
          id?: string
          ip_hash?: string | null
          notes?: string | null
          phone: string
          ref_code?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["khabia_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          address?: string | null
          amount_collected?: number | null
          assigned_delegate_id?: string | null
          city?: string
          collected_at?: string | null
          collection_proof_url?: string | null
          created_at?: string
          delegate_name?: string | null
          delivered_at?: string | null
          delivery_proof_url?: string | null
          full_name?: string
          id?: string
          ip_hash?: string | null
          notes?: string | null
          phone?: string
          ref_code?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["khabia_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          clicked_count: number
          created_at: string
          created_by: string | null
          failed_count: number
          from_email: string | null
          from_name: string
          html: string
          id: string
          opened_count: number
          preheader: string | null
          provider: string
          recipients_count: number
          reply_to: string | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          text_body: string | null
          updated_at: string
        }
        Insert: {
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          failed_count?: number
          from_email?: string | null
          from_name?: string
          html?: string
          id?: string
          opened_count?: number
          preheader?: string | null
          provider?: string
          recipients_count?: number
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          text_body?: string | null
          updated_at?: string
        }
        Update: {
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          failed_count?: number
          from_email?: string | null
          from_name?: string
          html?: string
          id?: string
          opened_count?: number
          preheader?: string | null
          provider?: string
          recipients_count?: number
          reply_to?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          text_body?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          campaign_id: string
          click_url: string | null
          clicked_at: string | null
          created_at: string
          email: string
          error: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string
          subscriber_id: string | null
          track_token: string
        }
        Insert: {
          campaign_id: string
          click_url?: string | null
          clicked_at?: string | null
          created_at?: string
          email: string
          error?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
          track_token?: string
        }
        Update: {
          campaign_id?: string
          click_url?: string | null
          clicked_at?: string | null
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
          track_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          lang: string
          source: string | null
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          lang?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          lang?: string
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          link: string | null
          message_ar: string
          message_en: string
          read_at: string | null
          title_ar: string
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message_ar?: string
          message_en?: string
          read_at?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message_ar?: string
          message_en?: string
          read_at?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_label_ar: string | null
          account_label_en: string | null
          account_value: string | null
          active: boolean
          created_at: string
          id: string
          instructions_ar: string | null
          instructions_en: string | null
          key: string
          kind: string
          label_ar: string
          label_en: string
          provider: string | null
          qr_image_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_label_ar?: string | null
          account_label_en?: string | null
          account_value?: string | null
          active?: boolean
          created_at?: string
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          key: string
          kind?: string
          label_ar: string
          label_en: string
          provider?: string | null
          qr_image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_label_ar?: string | null
          account_label_en?: string | null
          account_value?: string | null
          active?: boolean
          created_at?: string
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          key?: string
          kind?: string
          label_ar?: string
          label_en?: string
          provider?: string | null
          qr_image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          case_id: string | null
          created_at: string
          currency: string
          donation_id: string | null
          donor_email: string | null
          donor_id: string | null
          donor_name: string | null
          donor_phone: string | null
          id: string
          idempotency_key: string | null
          internal_notes: string | null
          last_error: string | null
          method: string | null
          node_id: string | null
          payload: Json
          provider: string
          provider_order_id: string | null
          provider_txn_id: string | null
          redirect_url: string | null
          ref_code: string
          retry_count: number
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          case_id?: string | null
          created_at?: string
          currency?: string
          donation_id?: string | null
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          last_error?: string | null
          method?: string | null
          node_id?: string | null
          payload?: Json
          provider?: string
          provider_order_id?: string | null
          provider_txn_id?: string | null
          redirect_url?: string | null
          ref_code?: string
          retry_count?: number
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          case_id?: string | null
          created_at?: string
          currency?: string
          donation_id?: string | null
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          donor_phone?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          last_error?: string | null
          method?: string | null
          node_id?: string | null
          payload?: Json
          provider?: string
          provider_order_id?: string | null
          provider_txn_id?: string | null
          redirect_url?: string | null
          ref_code?: string
          retry_count?: number
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "donation_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          processed: boolean
          provider: string
          raw: Json
          signature: string | null
          signature_valid: boolean | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          processed?: boolean
          provider?: string
          raw: Json
          signature?: string | null
          signature_valid?: boolean | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          processed?: boolean
          provider?: string
          raw?: Json
          signature?: string | null
          signature_valid?: boolean | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          donations_count: number
          full_name: string
          id: string
          phone: string | null
          preferred_program: string | null
          skills: string[] | null
          total_donated: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          donations_count?: number
          full_name?: string
          id: string
          phone?: string | null
          preferred_program?: string | null
          skills?: string[] | null
          total_donated?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          donations_count?: number
          full_name?: string
          id?: string
          phone?: string | null
          preferred_program?: string | null
          skills?: string[] | null
          total_donated?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          active: boolean
          color_hint: string | null
          created_at: string
          created_by: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          label_ar: string
          label_en: string
          link_url: string | null
          section: string
          sort_order: number
          suffix_ar: string | null
          suffix_en: string | null
          updated_at: string
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          active?: boolean
          color_hint?: string | null
          created_at?: string
          created_by?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          label_ar?: string
          label_en?: string
          link_url?: string | null
          section?: string
          sort_order?: number
          suffix_ar?: string | null
          suffix_en?: string | null
          updated_at?: string
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          active?: boolean
          color_hint?: string | null
          created_at?: string
          created_by?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          label_ar?: string
          label_en?: string
          link_url?: string | null
          section?: string
          sort_order?: number
          suffix_ar?: string | null
          suffix_en?: string | null
          updated_at?: string
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          beneficiary_name: string | null
          body_ar: string
          body_en: string
          case_id: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          location_ar: string | null
          location_en: string | null
          pending_review: boolean
          pillar_slug: string | null
          program_node_id: string | null
          quote_ar: string
          quote_en: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_ar: string
          role_en: string
          seo: Json
          slug: string
          sort_order: number
          submitted_at: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          beneficiary_name?: string | null
          body_ar?: string
          body_en?: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          location_ar?: string | null
          location_en?: string | null
          pending_review?: boolean
          pillar_slug?: string | null
          program_node_id?: string | null
          quote_ar?: string
          quote_en?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_ar?: string
          role_en?: string
          seo?: Json
          slug: string
          sort_order?: number
          submitted_at?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          beneficiary_name?: string | null
          body_ar?: string
          body_en?: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          location_ar?: string | null
          location_en?: string | null
          pending_review?: boolean
          pillar_slug?: string | null
          program_node_id?: string | null
          quote_ar?: string
          quote_en?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_ar?: string
          role_en?: string
          seo?: Json
          slug?: string
          sort_order?: number
          submitted_at?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_program_node_id_fkey"
            columns: ["program_node_id"]
            isOneToOne: false
            referencedRelation: "donation_nodes"
            referencedColumns: ["id"]
          },
        ]
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
      volunteer_applications: {
        Row: {
          assigned_role: string | null
          campaign_id: string
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          shift: string | null
          skills: string[]
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          volunteer_id: string | null
        }
        Insert: {
          assigned_role?: string | null
          campaign_id: string
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          volunteer_id?: string | null
        }
        Update: {
          assigned_role?: string | null
          campaign_id?: string
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "volunteer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_campaigns: {
        Row: {
          city: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description_ar: string
          description_en: string
          event_date: string
          event_time: string | null
          governorate: string
          id: string
          location: string
          required_skills: string[]
          slots_filled: number
          slots_needed: number
          slug: string
          status: Database["public"]["Enums"]["campaign_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string
          description_en?: string
          event_date: string
          event_time?: string | null
          governorate?: string
          id?: string
          location?: string
          required_skills?: string[]
          slots_filled?: number
          slots_needed?: number
          slug: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string
          description_en?: string
          event_date?: string
          event_time?: string | null
          governorate?: string
          id?: string
          location?: string
          required_skills?: string[]
          slots_filled?: number
          slots_needed?: number
          slug?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_impact_feed: {
        Row: {
          case_id: string | null
          id: string | null
          kind: string | null
          media_url: string | null
          note_ar: string | null
          note_en: string | null
          occurred_at: string | null
          source: string | null
          title_ar: string | null
          title_en: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_public_donation: {
        Args: {
          p_amount?: number
          p_case_id?: string
          p_category_id?: string
          p_currency?: string
          p_donor_email?: string
          p_donor_name?: string
          p_donor_phone?: string
          p_idempotency_key?: string
          p_message?: string
          p_payment_method?: string
          p_payment_status?: string
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method: string
          payment_status: string
          ref_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      publish_scheduled_posts: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "case_manager"
        | "volunteer"
        | "donor"
        | "editor"
        | "delegate"
      application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "waitlist"
        | "attended"
        | "noshow"
        | "cancelled"
      campaign_status: "draft" | "open" | "closed" | "completed" | "cancelled"
      case_media_kind: "before" | "during" | "after" | "report" | "other"
      case_status:
        | "draft"
        | "pending"
        | "approved"
        | "funded"
        | "closed"
        | "rejected"
      donation_node_type:
        | "sector"
        | "program"
        | "project"
        | "campaign"
        | "option"
      gender: "male" | "female"
      journey_step_key:
        | "created"
        | "paid"
        | "received"
        | "in_processing"
        | "executing"
        | "delivered"
        | "documented"
        | "completed"
        | "failed"
        | "refunded"
      khabia_status:
        | "pending"
        | "preparing"
        | "delivered"
        | "collected"
        | "cancelled"
      urgency_level: "low" | "medium" | "high" | "critical"
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
      app_role: [
        "admin",
        "case_manager",
        "volunteer",
        "donor",
        "editor",
        "delegate",
      ],
      application_status: [
        "pending",
        "approved",
        "rejected",
        "waitlist",
        "attended",
        "noshow",
        "cancelled",
      ],
      campaign_status: ["draft", "open", "closed", "completed", "cancelled"],
      case_media_kind: ["before", "during", "after", "report", "other"],
      case_status: [
        "draft",
        "pending",
        "approved",
        "funded",
        "closed",
        "rejected",
      ],
      donation_node_type: [
        "sector",
        "program",
        "project",
        "campaign",
        "option",
      ],
      gender: ["male", "female"],
      journey_step_key: [
        "created",
        "paid",
        "received",
        "in_processing",
        "executing",
        "delivered",
        "documented",
        "completed",
        "failed",
        "refunded",
      ],
      khabia_status: [
        "pending",
        "preparing",
        "delivered",
        "collected",
        "cancelled",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
