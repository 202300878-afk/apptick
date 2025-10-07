import { supabase } from './supabase';
import type { Ticket, TicketInsert, TicketUpdate } from './database.types';

export const ticketService = {
  async generarNumeroTicket(): Promise<string> {
    const { data, error } = await supabase
      .from('tickets')
      .select('numero_ticket')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const year = new Date().getFullYear();

    if (!data) {
      return `TKT-${year}-0001`;
    }

    const lastNumber = parseInt(data.numero_ticket.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `TKT-${year}-${nextNumber}`;
  },

  async crearTicket(ticket: Omit<TicketInsert, 'numero_ticket'>): Promise<Ticket> {
    const numeroTicket = await this.generarNumeroTicket();

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        ...ticket,
        numero_ticket: numeroTicket,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async obtenerTickets(filtros?: {
    estado?: string;
    busqueda?: string;
  }): Promise<Ticket[]> {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('fecha_ingreso', { ascending: false });

    if (filtros?.estado && filtros.estado !== 'Todos') {
      query = query.eq('estado_actual', filtros.estado);
    }

    if (filtros?.busqueda) {
      const busqueda = `%${filtros.busqueda}%`;
      query = query.or(
        `numero_ticket.ilike.${busqueda},nombre_cliente.ilike.${busqueda},telefono.ilike.${busqueda},tipo_equipo.ilike.${busqueda}`
      );
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('fecha_ingreso', { ascending: false });

    if (error) throw error;

    let tickets = data || [];

    if (filtros?.estado && filtros.estado !== 'Todos') {
      tickets = tickets.filter(t => t.estado_actual === filtros.estado);
    }

    if (filtros?.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      tickets = tickets.filter(t =>
        t.numero_ticket.toLowerCase().includes(busqueda) ||
        t.nombre_cliente.toLowerCase().includes(busqueda) ||
        t.telefono.toLowerCase().includes(busqueda) ||
        t.tipo_equipo.toLowerCase().includes(busqueda)
      );
    }

    return tickets;
  },

  async obtenerTicketPorId(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async actualizarTicket(id: string, cambios: TicketUpdate): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async eliminarTicket(id: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async obtenerEstadisticas() {
    const { data, error } = await supabase
      .from('tickets')
      .select('estado_actual, prioridad');

    if (error) throw error;

    const tickets = data || [];

    return {
      total: tickets.length,
      porEstado: {
        recibido: tickets.filter(t => t.estado_actual === 'Recibido').length,
        enDiagnostico: tickets.filter(t => t.estado_actual === 'En Diagnóstico').length,
        enReparacion: tickets.filter(t => t.estado_actual === 'En Reparación').length,
        esperandoPiezas: tickets.filter(t => t.estado_actual === 'Esperando Piezas').length,
        reparado: tickets.filter(t => t.estado_actual === 'Reparado').length,
        listoParaEntregar: tickets.filter(t => t.estado_actual === 'Listo para Entregar').length,
        entregado: tickets.filter(t => t.estado_actual === 'Entregado').length,
      },
      porPrioridad: {
        baja: tickets.filter(t => t.prioridad === 'Baja').length,
        media: tickets.filter(t => t.prioridad === 'Media').length,
        alta: tickets.filter(t => t.prioridad === 'Alta').length,
        urgente: tickets.filter(t => t.prioridad === 'Urgente').length,
      },
    };
  },
};
