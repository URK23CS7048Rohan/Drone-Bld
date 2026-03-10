import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          lat: number
          lng: number
          city: string
          capacity: number
          contact: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hospitals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>
      }
      blood_inventory: {
        Row: {
          id: string
          blood_type: string
          units: number
          location_id: string
          location_type: 'bank' | 'hospital'
          expiry_date: string
          status: 'available' | 'reserved' | 'expired'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['blood_inventory']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['blood_inventory']['Insert']>
      }
      drones: {
        Row: {
          id: string
          name: string
          model: string
          battery: number
          status: 'idle' | 'dispatched' | 'delivering' | 'returning' | 'charging' | 'maintenance'
          lat: number
          lng: number
          altitude: number
          speed: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['drones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['drones']['Insert']>
      }
      deliveries: {
        Row: {
          id: string
          drone_id: string
          from_location: string
          to_hospital_id: string
          blood_type: string
          units: number
          status: 'pending' | 'in_transit' | 'delivered' | 'failed'
          dispatched_at: string
          delivered_at: string | null
          distance_km: number
          eta_minutes: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['deliveries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['deliveries']['Insert']>
      }
      demand_predictions: {
        Row: {
          id: string
          hospital_id: string
          blood_type: string
          predicted_units: number
          actual_units: number | null
          prediction_date: string
          confidence: number
          mae: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['demand_predictions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['demand_predictions']['Insert']>
      }
      detection_events: {
        Row: {
          id: string
          image_url: string | null
          detected_type: string
          confidence: number
          bounding_boxes: unknown
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['detection_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['detection_events']['Insert']>
      }
      alerts: {
        Row: {
          id: string
          type: 'low_stock' | 'expiring_soon' | 'drone_fault' | 'delivery_failed' | 'critical_demand'
          message: string
          severity: 'info' | 'warning' | 'critical'
          resolved: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>
      }
    }
  }
}
