// Database types for Folio app

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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string | null
          event_date: string | null
          settings: Json | null
          cover_image_url: string | null
          invite_code: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description?: string | null
          event_date?: string | null
          settings?: Json | null
          cover_image_url?: string | null
          invite_code?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string | null
          event_date?: string | null
          settings?: Json | null
          cover_image_url?: string | null
          invite_code?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_guests: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          email: string
          name: string | null
          role: 'guest' | 'contributor'
          face_embedding: number[] | null
          face_enrolled: boolean
          face_reference_url: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          email: string
          name?: string | null
          role?: 'guest' | 'contributor'
          face_embedding?: number[] | null
          face_enrolled?: boolean
          face_reference_url?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string | null
          email?: string
          name?: string | null
          role?: 'guest' | 'contributor'
          face_embedding?: number[] | null
          face_enrolled?: boolean
          face_reference_url?: string | null
          joined_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          event_id: string
          uploader_id: string | null
          blob_url: string
          blob_pathname: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          taken_at: string | null
          location: string | null
          faces_detected: Json | null
          ai_tags: string[] | null
          ai_quality_score: number | null
          ai_emotion_tags: string[] | null
          is_host_photo: boolean
          is_shared: boolean
          processing_status: 'pending' | 'processing' | 'complete' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          uploader_id?: string | null
          blob_url: string
          blob_pathname: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          taken_at?: string | null
          location?: string | null
          faces_detected?: Json | null
          ai_tags?: string[] | null
          ai_quality_score?: number | null
          ai_emotion_tags?: string[] | null
          is_host_photo?: boolean
          is_shared?: boolean
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          uploader_id?: string | null
          blob_url?: string
          blob_pathname?: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          taken_at?: string | null
          location?: string | null
          faces_detected?: Json | null
          ai_tags?: string[] | null
          ai_quality_score?: number | null
          ai_emotion_tags?: string[] | null
          is_host_photo?: boolean
          is_shared?: boolean
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed'
          created_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          event_id: string
          owner_id: string
          template_id: string | null
          title: string
          subtitle: string | null
          cover_photo_id: string | null
          theme_config: Json | null
          ai_generated: boolean
          status: 'draft' | 'ready' | 'ordered'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          owner_id: string
          template_id?: string | null
          title: string
          subtitle?: string | null
          cover_photo_id?: string | null
          theme_config?: Json | null
          ai_generated?: boolean
          status?: 'draft' | 'ready' | 'ordered'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          owner_id?: string
          template_id?: string | null
          title?: string
          subtitle?: string | null
          cover_photo_id?: string | null
          theme_config?: Json | null
          ai_generated?: boolean
          status?: 'draft' | 'ready' | 'ordered'
          created_at?: string
          updated_at?: string
        }
      }
      album_pages: {
        Row: {
          id: string
          album_id: string
          page_number: number
          layout_type: string
          background_color: string | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          album_id: string
          page_number: number
          layout_type?: string
          background_color?: string | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          album_id?: string
          page_number?: number
          layout_type?: string
          background_color?: string | null
          caption?: string | null
          created_at?: string
        }
      }
      album_photos: {
        Row: {
          id: string
          page_id: string
          photo_id: string
          position_x: number
          position_y: number
          width: number
          height: number
          rotation: number
          z_index: number
          crop_data: Json | null
          filter: string | null
        }
        Insert: {
          id?: string
          page_id: string
          photo_id: string
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          rotation?: number
          z_index?: number
          crop_data?: Json | null
          filter?: string | null
        }
        Update: {
          id?: string
          page_id?: string
          photo_id?: string
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          rotation?: number
          z_index?: number
          crop_data?: Json | null
          filter?: string | null
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          thumbnail_url: string | null
          category: string
          layout_config: Json
          is_premium: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          thumbnail_url?: string | null
          category?: string
          layout_config: Json
          is_premium?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          thumbnail_url?: string | null
          category?: string
          layout_config?: Json
          is_premium?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          album_id: string
          user_id: string
          product_type: 'softcover' | 'hardcover' | 'magazine'
          size: 'small' | 'large'
          quantity: number
          price_cents: number
          shipping_address: Json | null
          stripe_payment_intent_id: string | null
          status: 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered'
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          album_id: string
          user_id: string
          product_type: 'softcover' | 'hardcover' | 'magazine'
          size?: 'small' | 'large'
          quantity?: number
          price_cents: number
          shipping_address?: Json | null
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered'
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          album_id?: string
          user_id?: string
          product_type?: 'softcover' | 'hardcover' | 'magazine'
          size?: 'small' | 'large'
          quantity?: number
          price_cents?: number
          shipping_address?: Json | null
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'paid' | 'printing' | 'shipped' | 'delivered'
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventGuest = Database['public']['Tables']['event_guests']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Album = Database['public']['Tables']['albums']['Row']
export type AlbumPage = Database['public']['Tables']['album_pages']['Row']
export type AlbumPhoto = Database['public']['Tables']['album_photos']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventGuestInsert = Database['public']['Tables']['event_guests']['Insert']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type AlbumInsert = Database['public']['Tables']['albums']['Insert']
export type AlbumPageInsert = Database['public']['Tables']['album_pages']['Insert']
export type AlbumPhotoInsert = Database['public']['Tables']['album_photos']['Insert']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']

// Extended types with relations
export type EventWithGuests = Event & {
  event_guests: EventGuest[]
  photos: Photo[]
}

export type AlbumWithPages = Album & {
  album_pages: (AlbumPage & {
    album_photos: (AlbumPhoto & {
      photo: Photo
    })[]
  })[]
  template: Template | null
  cover_photo: Photo | null
}

export type PhotoWithFaces = Photo & {
  detected_faces: {
    guest_id: string
    confidence: number
    bounding_box: { x: number; y: number; width: number; height: number }
  }[]
}
