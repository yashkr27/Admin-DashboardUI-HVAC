// Manual type stubs for all 7 Supabase tables in the `public` schema.
// Re-generate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      chatbot_leads: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          email: string | null
          status: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['chatbot_leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chatbot_leads']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          lead_id: string | null
          name: string | null
          date: string | null
          time: string | null
          status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      estimates: {
        Row: {
          id: string
          client_name: string | null
          client_email: string | null
          service_type: string | null
          amount: number | null
          status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['estimates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['estimates']['Insert']>
      }
      gallery: {
        Row: {
          id: string
          image_url: string | null
          title: string | null
          description: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['gallery']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['gallery']['Insert']>
      }
      gemini_usage_log: {
        Row: {
          id: string
          prompt: string | null
          response: string | null
          tokens_used: number | null
          created_at: string | null
        }
        Insert: never
        Update: never
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          author: string | null
          rating: number | null
          content: string | null
          visible: boolean | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
    }
  }
}

// Convenient row type aliases
export type ChatbotLead = Database['public']['Tables']['chatbot_leads']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Estimate = Database['public']['Tables']['estimates']['Row']
export type GalleryItem = Database['public']['Tables']['gallery']['Row']
export type GeminiLog = Database['public']['Tables']['gemini_usage_log']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

// Generic record type for dynamic table pages
export type TableName = keyof Database['public']['Tables']
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
