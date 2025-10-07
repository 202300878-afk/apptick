import { useState } from 'react';
import { X, User, Phone, MapPin, Laptop, Lock, Package, AlertCircle, Calendar, DollarSign, FileText, Save } from 'lucide-react';
import { ticketService } from '../lib/ticketService';
import type { Ticket } from '../lib/database.types';

interface DetalleTicketProps {
  ticket: Ticket;
  onCerrar: () => void;
  onActualizado: () => void;
}

const ESTADOS = [
  'Recibido',
  'En Diagnóstico',
  'En Reparación',
  'Esperando Piezas',
  'Reparado',
  'Listo para Entregar',
  'Entregado',
];

export default function DetalleTicket({ ticket, onCerrar, onActualizado }: DetalleTicketProps) {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    estado_actual: ticket.estado_actual,
    tecnico_asignado: ticket.tecnico_asignado,
    notas_tecnico: ticket.notas_tecnico,
    costo_estimado: ticket.costo_estimado,
    costo_final: ticket.costo_final,
    fecha_estimada_entrega: ticket.fecha_estimada_entrega
      ? new Date(ticket.fecha_estimada_entrega).toISOString().split('T')[0]
      : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      await ticketService.actualizarTicket(ticket.id, {
        estado_actual: formData.estado_actual,
        tecnico_asignado: formData.tecnico_asignado,
        notas_tecnico: formData.notas_tecnico,
        costo_estimado: parseFloat(formData.costo_estimado.toString()) || 0,
        costo_final: parseFloat(formData.costo_final.toString()) || 0,
        fecha_estimada_entrega: formData.fecha_estimada_entrega || null,
      });
      setModoEdicion(false);
      onActualizado();
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      alert('Error al actualizar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      'Recibido': 'bg-blue-100 text-blue-800 border-blue-200',
      'En Diagnóstico': 'bg-purple-100 text-purple-800 border-purple-200',
      'En Reparación': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Esperando Piezas': 'bg-orange-100 text-orange-800 border-orange-200',
      'Reparado': 'bg-green-100 text-green-800 border-green-200',
      'Listo para Entregar': 'bg-teal-100 text-teal-800 border-teal-200',
      'Entregado': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const obtenerColorPrioridad = (prioridad: string) => {
    const colores: Record<string, string> = {
      'Baja': 'bg-green-100 text-green-800 border-green-200',
      'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Alta': 'bg-orange-100 text-orange-800 border-orange-200',
      'Urgente': 'bg-red-100 text-red-800 border-red-200',
    };
    return colores[prioridad] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-start rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold mb-1">Ticket {ticket.numero_ticket}</h2>
            <div className="flex gap-2 mt-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(
                  ticket.estado_actual
                )}`}
              >
                {ticket.estado_actual}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorPrioridad(
                  ticket.prioridad
                )}`}
              >
                Prioridad: {ticket.prioridad}
              </span>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Información del Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                <p className="text-gray-900 mt-1">{ticket.nombre_cliente}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Teléfono
                </label>
                <p className="text-gray-900 mt-1">{ticket.telefono}</p>
              </div>
              {ticket.direccion && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Dirección
                  </label>
                  <p className="text-gray-900 mt-1">{ticket.direccion}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Laptop className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Información del Equipo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Equipo</label>
                <p className="text-gray-900 mt-1">{ticket.tipo_equipo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Marca</label>
                <p className="text-gray-900 mt-1">{ticket.marca}</p>
              </div>
              {ticket.modelo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Modelo</label>
                  <p className="text-gray-900 mt-1">{ticket.modelo}</p>
                </div>
              )}
              {ticket.numero_serie && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Número de Serie</label>
                  <p className="text-gray-900 mt-1 font-mono text-sm">{ticket.numero_serie}</p>
                </div>
              )}
              {ticket.contrasena_equipo && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Lock className="w-4 h-4" /> Contraseña del Equipo
                  </label>
                  <p className="text-gray-900 mt-1 font-mono">{ticket.contrasena_equipo}</p>
                </div>
              )}
              {ticket.accesorios_incluidos && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Package className="w-4 h-4" /> Accesorios Incluidos
                  </label>
                  <p className="text-gray-900 mt-1">{ticket.accesorios_incluidos}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-800">Problema Reportado</h3>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Descripción</label>
              <p className="text-gray-900 mt-2 whitespace-pre-wrap leading-relaxed">
                {ticket.descripcion_problema}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Estado Inicial</label>
                <p className="text-gray-900 mt-1">{ticket.estado_inicial}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Recibido por</label>
                <p className="text-gray-900 mt-1">{ticket.recibido_por}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Gestión y Seguimiento</h3>
              </div>
              {!modoEdicion && (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Editar
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Estado Actual</label>
                  {modoEdicion ? (
                    <select
                      name="estado_actual"
                      value={formData.estado_actual}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 mt-1">{ticket.estado_actual}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Técnico Asignado</label>
                  {modoEdicion ? (
                    <input
                      type="text"
                      name="tecnico_asignado"
                      value={formData.tecnico_asignado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nombre del técnico"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">{ticket.tecnico_asignado || 'No asignado'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4" /> Costo Estimado
                  </label>
                  {modoEdicion ? (
                    <input
                      type="number"
                      name="costo_estimado"
                      value={formData.costo_estimado}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">
                      ${ticket.costo_estimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4" /> Costo Final
                  </label>
                  {modoEdicion ? (
                    <input
                      type="number"
                      name="costo_final"
                      value={formData.costo_final}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">
                      ${ticket.costo_final.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" /> Fecha Estimada de Entrega
                  </label>
                  {modoEdicion ? (
                    <input
                      type="date"
                      name="fecha_estimada_entrega"
                      value={formData.fecha_estimada_entrega}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 mt-1">
                      {ticket.fecha_estimada_entrega
                        ? formatearFecha(ticket.fecha_estimada_entrega)
                        : 'No definida'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" /> Fecha de Ingreso
                  </label>
                  <p className="text-gray-900 mt-1">{formatearFecha(ticket.fecha_ingreso)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Notas del Técnico</label>
                {modoEdicion ? (
                  <textarea
                    name="notas_tecnico"
                    value={formData.notas_tecnico}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Agregar notas sobre el diagnóstico o reparación..."
                  />
                ) : (
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap leading-relaxed">
                    {ticket.notas_tecnico || 'Sin notas'}
                  </p>
                )}
              </div>
            </div>

            {modoEdicion && (
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <button
                  onClick={() => setModoEdicion(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
