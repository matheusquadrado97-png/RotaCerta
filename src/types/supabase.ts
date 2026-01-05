export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            appointments: {
                Row: {
                    bike_id: string | null
                    created_at: string | null
                    cyclist_id: string
                    id: string
                    notes: string | null
                    scheduled_at: string
                    service_id: string
                    status: Database["public"]["Enums"]["appointment_status"] | null
                    workshop_id: string
                    start_time: string | null
                    end_time: string | null
                }
                Insert: {
                    bike_id?: string | null
                    created_at?: string | null
                    cyclist_id: string
                    id?: string
                    notes?: string | null
                    scheduled_at: string
                    service_id: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    workshop_id: string
                    start_time?: string | null
                    end_time?: string | null
                }
                Update: {
                    bike_id?: string | null
                    created_at?: string | null
                    cyclist_id?: string
                    id?: string
                    notes?: string | null
                    scheduled_at?: string
                    service_id?: string
                    status?: Database["public"]["Enums"]["appointment_status"] | null
                    workshop_id?: string
                    start_time?: string | null
                    end_time?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_bike_id_fkey"
                        columns: ["bike_id"]
                        isOneToOne: false
                        referencedRelation: "bikes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_cyclist_id_fkey"
                        columns: ["cyclist_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_workshop_id_fkey"
                        columns: ["workshop_id"]
                        isOneToOne: false
                        referencedRelation: "workshops"
                        referencedColumns: ["id"]
                    }
                ]
            }
            bikes: {
                Row: {
                    brand: string | null
                    created_at: string | null
                    id: string
                    model: string | null
                    name: string
                    strava_gear_id: string | null
                    total_mileage: number | null
                    user_id: string
                }
                Insert: {
                    brand?: string | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name: string
                    strava_gear_id?: string | null
                    total_mileage?: number | null
                    user_id: string
                }
                Update: {
                    brand?: string | null
                    created_at?: string | null
                    id?: string
                    model?: string | null
                    name?: string
                    strava_gear_id?: string | null
                    total_mileage?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bikes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            components: {
                Row: {
                    bike_id: string
                    brand: string | null
                    current_mileage: number | null
                    id: string
                    initial_mileage: number | null
                    installed_at: string | null
                    lifespan_limit: number | null
                    model: string | null
                    status: Database["public"]["Enums"]["component_status"] | null
                    type: Database["public"]["Enums"]["component_type"]
                }
                Insert: {
                    bike_id: string
                    brand?: string | null
                    current_mileage?: number | null
                    id?: string
                    initial_mileage?: number | null
                    installed_at?: string | null
                    lifespan_limit?: number | null
                    model?: string | null
                    status?: Database["public"]["Enums"]["component_status"] | null
                    type: Database["public"]["Enums"]["component_type"]
                }
                Update: {
                    bike_id?: string
                    brand?: string | null
                    current_mileage?: number | null
                    id?: string
                    initial_mileage?: number | null
                    installed_at?: string | null
                    lifespan_limit?: number | null
                    model?: string | null
                    status?: Database["public"]["Enums"]["component_status"] | null
                    type?: Database["public"]["Enums"]["component_type"]
                }
                Relationships: [
                    {
                        foreignKeyName: "components_bike_id_fkey"
                        columns: ["bike_id"]
                        isOneToOne: false
                        referencedRelation: "bikes"
                        referencedColumns: ["id"]
                    }
                ]
            }
            maintenance_logs: {
                Row: {
                    bike_id: string
                    component_id: string | null
                    cost: number | null
                    description: string | null
                    id: string
                    service_date: string | null
                    workshop_id: string | null
                }
                Insert: {
                    bike_id: string
                    component_id?: string | null
                    cost?: number | null
                    description?: string | null
                    id?: string
                    service_date?: string | null
                    workshop_id?: string | null
                }
                Update: {
                    bike_id?: string
                    component_id?: string | null
                    cost?: number | null
                    description?: string | null
                    id?: string
                    service_date?: string | null
                    workshop_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "maintenance_logs_bike_id_fkey"
                        columns: ["bike_id"]
                        isOneToOne: false
                        referencedRelation: "bikes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_logs_component_id_fkey"
                        columns: ["component_id"]
                        isOneToOne: false
                        referencedRelation: "components"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_logs_workshop_id_fkey"
                        columns: ["workshop_id"]
                        isOneToOne: false
                        referencedRelation: "workshops"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    role: Database["public"]["Enums"]["user_role"] | null
                    strava_access_token: string | null
                    strava_refresh_token: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    strava_access_token?: string | null
                    strava_refresh_token?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    strava_access_token?: string | null
                    strava_refresh_token?: string | null
                }
                Relationships: []
            }
            services: {
                Row: {
                    description: string | null
                    duration_minutes: number | null
                    id: string
                    name: string
                    price: number | null
                    workshop_id: string
                }
                Insert: {
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    name: string
                    price?: number | null
                    workshop_id: string
                }
                Update: {
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    name?: string
                    price?: number | null
                    workshop_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "services_workshop_id_fkey"
                        columns: ["workshop_id"]
                        isOneToOne: false
                        referencedRelation: "workshops"
                        referencedColumns: ["id"]
                    }
                ]
            }
            workshops: {
                Row: {
                    address: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    latitude: number | null
                    longitude: number | null
                    name: string
                    opening_hours: Json | null
                    owner_id: string
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    name: string
                    opening_hours?: Json | null
                    owner_id: string
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    name?: string
                    opening_hours?: Json | null
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workshops_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            workshop_staff: {
                Row: {
                    id: string
                    workshop_id: string
                    profile_id: string
                    role: "admin" | "manager" | "mechanic" | "attendant"
                    permissions: Json | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    workshop_id: string
                    profile_id: string
                    role: "admin" | "manager" | "mechanic" | "attendant"
                    permissions?: Json | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    workshop_id?: string
                    profile_id?: string
                    role?: "admin" | "manager" | "mechanic" | "attendant"
                    permissions?: Json | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "workshop_staff_workshop_id_fkey"
                        columns: ["workshop_id"]
                        isOneToOne: false
                        referencedRelation: "workshops"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "workshop_staff_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            workshop_settings: {
                Row: {
                    workshop_id: string
                    is_visible: boolean | null
                    max_daily_os: number | null
                    min_notice_hours: number | null
                    default_service_duration: number | null
                    auto_approval: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    workshop_id: string
                    is_visible?: boolean | null
                    max_daily_os?: number | null
                    min_notice_hours?: number | null
                    default_service_duration?: number | null
                    auto_approval?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    workshop_id?: string
                    is_visible?: boolean | null
                    max_daily_os?: number | null
                    min_notice_hours?: number | null
                    default_service_duration?: number | null
                    auto_approval?: boolean | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "workshop_settings_workshop_id_fkey"
                        columns: ["workshop_id"]
                        isOneToOne: true
                        referencedRelation: "workshops"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            appointment_status: "pending" | "confirmed" | "completed" | "cancelled" | "scheduled" | "received" | "in_progress" | "awaiting_parts" | "paused"
            component_status: "good" | "warning" | "critical"
            component_type:
            | "chain"
            | "cassette"
            | "tire_front"
            | "tire_rear"
            | "brake_pads"
            | "cable_shift"
            | "cable_brake"
            | "other"
            user_role: "cyclist" | "workshop_owner" | "admin"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
