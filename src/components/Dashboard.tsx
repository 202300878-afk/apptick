import { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { ticketService } from '../lib/ticketService';
import type { Ticket } from '../lib/database.types';

interface DashboardProps {
  refreshTrigger: number;
  onVerTicket: (ticket: Ticket) => void;
}

export default function Dashboard({ refreshTrigger, onVerTicket }: DashboardProps) {
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    porEstado: {
      recibido: 0,
      enDiagnostico: 0,
      enReparacion: 0,
      esperandoPiezas: 0,
      reparado: 0,
      listoParaEntregar: 0,
      entregado: 0,
    },
    porPrioridad: {
      baja: 0,
      media: 0,
      alta: 0,
      urgente: 0,
    },
  });
  const [ticketsRecientes, setTicketsRecientes] = useState<Ticket[]>([]);
  const [ticketsUrgentes, setTicketsUrgentes] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [refreshTrigger]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [stats, tickets] = await Promise.all([
        ticketService.obtenerEstadisticas(),
        ticketService.obtenerTickets({}),
      ]);

      setEstadisticas(stats);

      const recientes = tickets.slice(0, 5);
      setTicketsRecientes(recientes);

      const urgentes = tickets.filter(
        (t) => (t.prioridad === 'Alta' || t.prioridad === 'Urgente') && t.estado_actual !== 'Entregado'
      );
      setTicketsUrgentes(urgentes.slice(0, 5));
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const enProceso =
    estadisticas.porEstado.recibido +
    estadisticas.porEstado.enDiagnostico +
    estadisticas.porEstado.enReparacion +
    estadisticas.porEstado.esperandoPiezas;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Tickets</p>
              <p className="text-3xl font-bold mt-2">{estadisticas.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">En Proceso</p>
              <p className="text-3xl font-bold mt-2">{enProceso}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completados</p>
              <p className="text-3xl font-bold mt-2">
                {estadisticas.porEstado.reparado + estadisticas.porEstado.listoParaEntregar}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Urgentes</p>
              <p className="text-3xl font-bold mt-2">{estadisticas.porPrioridad.urgente}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Tickets por Estado
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Recibido</span>
              <span className="text-blue-600 font-bold text-lg">{estadisticas.porEstado.recibido}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700 font-medium">En Diagnóstico</span>
              <span className="text-purple-600 font-bold text-lg">{estadisticas.porEstado.enDiagnostico}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-700 font-medium">En Reparación</span>
              <span className="text-yellow-600 font-bold text-lg">{estadisticas.porEstado.enReparacion}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-700 font-medium">Esperando Piezas</span>
              <span className="text-orange-600 font-bold text-lg">{estadisticas.porEstado.esperandoPiezas}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700 font-medium">Reparado / Listo</span>
              <span className="text-green-600 font-bold text-lg">
                {estadisticas.porEstado.reparado + estadisticas.porEstado.listoParaEntregar}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Entregado</span>
              <span className="text-gray-600 font-bold text-lg">{estadisticas.porEstado.entregado}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Tickets por Prioridad
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <span className="text-gray-700 font-medium">Urgente</span>
              <span className="text-red-600 font-bold text-lg">{estadisticas.porPrioridad.urgente}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <span className="text-gray-700 font-medium">Alta</span>
              <span className="text-orange-600 font-bold text-lg">{estadisticas.porPrioridad.alta}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <span className="text-gray-700 font-medium">Media</span>
              <span className="text-yellow-600 font-bold text-lg">{estadisticas.porPrioridad.media}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <span className="text-gray-700 font-medium">Baja</span>
              <span className="text-green-600 font-bold text-lg">{estadisticas.porPrioridad.baja}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets Recientes</h3>
          {ticketsRecientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay tickets registrados</p>
          ) : (
            <div className="space-y-3">
              {ticketsRecientes.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onVerTicket(ticket)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-semibold text-blue-600">{ticket.numero_ticket}</span>
                    <span className="text-xs text-gray-500">{formatearFecha(ticket.fecha_ingreso)}</span>
                  </div>
                  <p className="text-gray-900 font-medium">{ticket.nombre_cliente}</p>
                  <p className="text-sm text-gray-600">
                    {ticket.tipo_equipo} - {ticket.marca}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Tickets Urgentes / Alta Prioridad
          </h3>
          {ticketsUrgentes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay tickets urgentes</p>
          ) : (
            <div className="space-y-3">
              {ticketsUrgentes.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onVerTicket(ticket)}
                  className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-semibold text-blue-600">{ticket.numero_ticket}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ticket.prioridad === 'Urgente'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {ticket.prioridad}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{ticket.nombre_cliente}</p>
                  <p className="text-sm text-gray-600">{ticket.estado_actual}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
