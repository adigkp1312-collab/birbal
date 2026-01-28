export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          niche: string | null
          subscription_tier: string
          posts_generated_this_month: number
          posts_limit: number
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          niche?: string | null
          subscription_tier?: string
          posts_generated_this_month?: number
          posts_limit?: number
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          niche?: string | null
          subscription_tier?: string
          posts_generated_this_month?: number
          posts_limit?: number
          stripe_customer_id?: string | null
          created_at?: string
        }
      }
      viral_templates: {
        Row: {
          id: string
          name: string
          category: string
          subcategory: string | null
          description: string | null
          template_structure: string
          example_post: string | null
          variables: Json | null
          avg_engagement_score: number
          times_used: number
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          subcategory?: string | null
          description?: string | null
          template_structure: string
          example_post?: string | null
          variables?: Json | null
          avg_engagement_score?: number
          times_used?: number
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          subcategory?: string | null
          description?: string | null
          template_structure?: string
          example_post?: string | null
          variables?: Json | null
          avg_engagement_score?: number
          times_used?: number
          embedding?: string | null
          created_at?: string
        }
      }
      community_posts: {
        Row: {
          id: string
          contributed_by: string | null
          content: string
          anonymized_content: string | null
          likes: number
          comments: number
          impressions: number
          engagement_rate: number | null
          topic: string | null
          is_public: boolean
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contributed_by?: string | null
          content: string
          anonymized_content?: string | null
          likes?: number
          comments?: number
          impressions?: number
          engagement_rate?: number | null
          topic?: string | null
          is_public?: boolean
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contributed_by?: string | null
          content?: string
          anonymized_content?: string | null
          likes?: number
          comments?: number
          impressions?: number
          engagement_rate?: number | null
          topic?: string | null
          is_public?: boolean
          embedding?: string | null
          created_at?: string
        }
      }
      user_voice_profiles: {
        Row: {
          id: string
          user_id: string
          writing_samples: string[] | null
          sample_count: number
          tone: string | null
          formality_score: number | null
          emoji_usage: string | null
          vocabulary_level: string | null
          storytelling_style: string | null
          common_phrases: string[] | null
          full_analysis: Json | null
          embedding: string | null
          is_calibrated: boolean
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          writing_samples?: string[] | null
          sample_count?: number
          tone?: string | null
          formality_score?: number | null
          emoji_usage?: string | null
          vocabulary_level?: string | null
          storytelling_style?: string | null
          common_phrases?: string[] | null
          full_analysis?: Json | null
          embedding?: string | null
          is_calibrated?: boolean
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          writing_samples?: string[] | null
          sample_count?: number
          tone?: string | null
          formality_score?: number | null
          emoji_usage?: string | null
          vocabulary_level?: string | null
          storytelling_style?: string | null
          common_phrases?: string[] | null
          full_analysis?: Json | null
          embedding?: string | null
          is_calibrated?: boolean
          last_updated?: string
        }
      }
      user_memory: {
        Row: {
          id: string
          user_id: string
          content: string
          content_type: string
          key_insights: string[] | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          content_type: string
          key_insights?: string[] | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          content_type?: string
          key_insights?: string[] | null
          embedding?: string | null
          created_at?: string
        }
      }
      generated_posts: {
        Row: {
          id: string
          user_id: string
          input_topic: string | null
          input_context: string | null
          generated_content: string
          variation_type: string | null
          templates_used: string[] | null
          was_posted: boolean
          actual_likes: number | null
          actual_comments: number | null
          actual_impressions: number | null
          user_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_topic?: string | null
          input_context?: string | null
          generated_content: string
          variation_type?: string | null
          templates_used?: string[] | null
          was_posted?: boolean
          actual_likes?: number | null
          actual_comments?: number | null
          actual_impressions?: number | null
          user_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_topic?: string | null
          input_context?: string | null
          generated_content?: string
          variation_type?: string | null
          templates_used?: string[] | null
          was_posted?: boolean
          actual_likes?: number | null
          actual_comments?: number | null
          actual_impressions?: number | null
          user_rating?: number | null
          created_at?: string
        }
      }
      trending_topics: {
        Row: {
          id: string
          topic: string
          category: string | null
          suggested_angles: string[] | null
          industries: string[] | null
          relevance_score: number | null
          expires_at: string | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          topic: string
          category?: string | null
          suggested_angles?: string[] | null
          industries?: string[] | null
          relevance_score?: number | null
          expires_at?: string | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          topic?: string
          category?: string | null
          suggested_angles?: string[] | null
          industries?: string[] | null
          relevance_score?: number | null
          expires_at?: string | null
          embedding?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      match_templates: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          name: string
          category: string
          template_structure: string
          example_post: string
          similarity: number
        }[]
      }
      match_community_posts: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          engagement_rate: number
          topic: string
          similarity: number
        }[]
      }
      match_user_memory: {
        Args: {
          p_user_id: string
          query_embedding: string
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          content_type: string
          key_insights: string[]
          similarity: number
        }[]
      }
    }
  }
}
