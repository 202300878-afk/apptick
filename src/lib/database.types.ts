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
      tickets: {
        Row: {
          id: string
          numero_ticket: string
          nombre_cliente: string
          telefono: string
          direccion: string
          tipo_equipo: string
          marca: string
          modelo: string
          numero_serie: string
          contrasena_equipo: string
          accesorios_incluidos: string
          descripcion_problema: string
          prioridad: string
          estado_inicial: string
          estado_actual: string
          notas_tecnico: string
          recibido_por: string
          tecnico_asignado: string
          costo_estimado: number
          costo_final: number
          fecha_ingreso: string
          fecha_estimada_entrega: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_ticket: string
          nombre_cliente: string
          telefono: string
          direccion?: string
          tipo_equipo: string
          marca: string
          modelo?: string
          numero_serie?: string
          contrasena_equipo?: string
          accesorios_incluidos?: string
          descripcion_problema: string
          prioridad?: string
          estado_inicial?: string
          estado_actual?: string
          notas_tecnico?: string
          recibido_por: string
          tecnico_asignado?: string
          costo_estimado?: number
          costo_final?: number
          fecha_ingreso?: string
          fecha_estimada_entrega?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_ticket?: string
          nombre_cliente?: string
          telefono?: string
          direccion?: string
          tipo_equipo?: string
          marca?: string
          modelo?: string
          numero_serie?: string
          contrasena_equipo?: string
          accesorios_incluidos?: string
          descripcion_problema?: string
          prioridad?: string
          estado_inicial?: string
          estado_actual?: string
          notas_tecnico?: string
          recibido_por?: string
          tecnico_asignado?: string
          costo_estimado?: number
          costo_final?: number
          fecha_ingreso?: string
          fecha_estimada_entrega?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];
