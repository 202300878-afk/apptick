import { useState, useMemo, useRef } from 'react';
import { X, User, Phone, MapPin, Laptop, Lock, Package, AlertCircle, Calendar, DollarSign, FileText, Save, Printer } from 'lucide-react';
import { ticketService } from '../lib/ticketService';
import type { Ticket } from '../lib/database.types';

/**
 * Componente completo con impresión POS
 * - Botón Imprimir (diálogo del navegador) para elegir impresora.
 * - Plantilla de recibo térmico 80mm (sirve también para 58mm ajustando @page size).
 * - Sección opcional comentada para integrar QZ Tray y elegir impresora del sistema + ESC/POS RAW.
 */

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

  // Referencia a la plantilla imprimible
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
      Recibido: 'bg-blue-100 text-blue-800 border-blue-200',
      'En Diagnóstico': 'bg-purple-100 text-purple-800 border-purple-200',
      'En Reparación': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Esperando Piezas': 'bg-orange-100 text-orange-800 border-orange-200',
      Reparado: 'bg-green-100 text-green-800 border-green-200',
      'Listo para Entregar': 'bg-teal-100 text-teal-800 border-teal-200',
      Entregado: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const obtenerColorPrioridad = (prioridad: string) => {
    const colores: Record<string, string> = {
      Baja: 'bg-green-100 text-green-800 border-green-200',
      Media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Alta: 'bg-orange-100 text-orange-800 border-orange-200',
      Urgente: 'bg-red-100 text-red-800 border-red-200',
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

  const formatearFechaHora = (fecha: string | Date) => {
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  // Datos calculados para el recibo
  const recibo = useMemo(() => {
    const fechaActual = new Date();
    return {
      negocio: 'MULTIPLANET',
      direccion: 'Bº El Centro, Contiguo A Edificio Makalo,',
      ciudad: 'Tocoa, Colón',
      telefono1: '3171-3287',
      telefono2: '9647-3966',
      email: 'multiplanettocoa@yahoo.com',
      fecha: formatearFechaHora(fechaActual),
      dia: fechaActual.getDate(),
      mes: fechaActual.getMonth() + 1,
      anio: fechaActual.getFullYear().toString().slice(-2),
      ticket: ticket.numero_ticket,
      cliente: ticket.nombre_cliente,
      direccionCliente: ticket.direccion ?? '',
      telCliente: ticket.telefono ?? '-',
      tipoEquipo: ticket.tipo_equipo,
      marca: ticket.marca,
      modelo: ticket.modelo ?? '',
      serie: ticket.numero_serie ?? '',
      contrasena: ticket.contrasena_equipo ?? '',
      accesorios: ticket.accesorios_incluidos ?? '',
      estado: formData.estado_actual || ticket.estado_actual,
      tecnico: formData.tecnico_asignado || ticket.tecnico_asignado || '-',
      problema: ticket.descripcion_problema,
      trabajos: formData.notas_tecnico || ticket.notas_tecnico || '',
      observaciones: '',
      costoEstimado: Number(
        (formData.costo_estimado as unknown as number) ?? ticket.costo_estimado ?? 0
      ),
      recibidoPor: ticket.recibido_por,
    };
  }, [ticket, formData]);

  // Impresión con diálogo del navegador
  const handleImprimir = () => {
    const contenido = printAreaRef.current?.innerHTML;
    if (!contenido) return;

    const w = window.open('', '_blank', 'width=650,height=900');
    if (!w) return;

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orden ${recibo.ticket}</title>
  <style>
    @page { size: A5 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
    }
    .ticket {
      width: 148mm;
      height: 210mm;
      padding: 8mm;
      border: 2px solid #000;
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 2px solid #000;
      padding: 6px 8px;
      margin-bottom: 4px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .logo {
      width: 45px;
      height: 45px;
    }
    .company-info {
      flex: 1;
      font-size: 9px;
      line-height: 1.2;
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .date-box {
      border: 1.5px solid #000;
      padding: 4px 6px;
      text-align: center;
      min-width: 85px;
    }
    .date-label {
      font-size: 8px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .date-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3px;
      margin-top: 3px;
    }
    .date-cell {
      border: 1px solid #000;
      text-align: center;
      padding: 2px;
      font-size: 7px;
    }
    .date-cell-value {
      font-size: 11px;
      font-weight: bold;
      margin-top: 1px;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-decoration: underline;
      margin: 4px 0 3px 0;
    }
    .ticket-number {
      text-align: center;
      margin: 3px 0;
    }
    .ticket-label {
      font-size: 10px;
      font-weight: bold;
    }
    .ticket-value {
      font-size: 24px;
      color: #d00;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .field {
      display: flex;
      align-items: center;
      margin: 2px 0;
      min-height: 16px;
    }
    .field-label {
      font-weight: bold;
      margin-right: 4px;
      white-space: nowrap;
    }
    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      padding-left: 4px;
      min-height: 14px;
    }
    .field-inline {
      display: inline-flex;
      align-items: center;
      margin-right: 12px;
      flex: 1;
    }
    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px 8px;
      margin: 3px 0;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .checkbox {
      width: 12px;
      height: 12px;
      border: 1.5px solid #000;
      display: inline-block;
      position: relative;
    }
    .checkbox.checked::after {
      content: '✓';
      position: absolute;
      top: -3px;
      left: 1px;
      font-size: 14px;
      font-weight: bold;
    }
    .text-area {
      border: 1.5px solid #000;
      padding: 4px;
      min-height: 35px;
      margin: 2px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 4px;
    }
    .footer-box {
      border: 1.5px solid #000;
      padding: 4px;
      min-height: 30px;
    }
    .footer-label {
      font-size: 9px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    .footer-value {
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      margin-top: 6px;
    }
    .disclaimer {
      font-size: 7px;
      text-align: center;
      margin-top: 4px;
      line-height: 1.2;
    }
    .row {
      display: flex;
      gap: 8px;
    }
  </style>
</head>
<body>
  ${contenido}
  <script>
    window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };
  </script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              title="Imprimir orden (elige tu impresora en el diálogo del navegador)"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-6">
          {/* Información del Cliente */}
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

          {/* Información del Equipo */}
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

          {/* Problema Reportado */}
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

          {/* Gestión y Seguimiento */}
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
                      {ticket.fecha_estimada_entrega ? formatearFecha(ticket.fecha_estimada_entrega) : 'No definida'}
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

          {/* === Plantilla oculta que se imprime === */}
          <div className="hidden">
            <div ref={printAreaRef}>
              <div className="ticket">
                {/* Encabezado con logo y fecha */}
                <div className="header">
                  <div className="logo-section">
                    <img src="/LOGO MULTIPLANET 2022.png" alt="Logo" className="logo" />
                    <div className="company-info">
                      <div className="company-name">{recibo.negocio}</div>
                      <div>{recibo.direccion}</div>
                      <div>{recibo.ciudad}</div>
                      <div>Cel.: {recibo.telefono1} * {recibo.telefono2}</div>
                      <div>E-mail: {recibo.email}</div>
                    </div>
                  </div>
                  <div className="date-box">
                    <div className="date-label">FECHA DE RECIBO</div>
                    <div className="date-grid">
                      <div className="date-cell">
                        <div>DÍA</div>
                        <div className="date-cell-value">{recibo.dia}</div>
                      </div>
                      <div className="date-cell">
                        <div>MES</div>
                        <div className="date-cell-value">{recibo.mes}</div>
                      </div>
                      <div className="date-cell">
                        <div>AÑO</div>
                        <div className="date-cell-value">{recibo.anio}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Número de orden */}
                <div className="section-title">Ofrecemos: ORDEN DE TRABAJO</div>
                <div className="ticket-number">
                  <span className="ticket-label">Nº </span>
                  <span className="ticket-value">{recibo.ticket}</span>
                </div>

                {/* Información del cliente */}
                <div className="field">
                  <span className="field-label">Cliente:</span>
                  <div className="field-value">{recibo.cliente}</div>
                </div>
                <div className="field">
                  <span className="field-label">Dirección:</span>
                  <div className="field-value">{recibo.direccionCliente}</div>
                </div>
                <div className="field">
                  <span className="field-label">Celular:</span>
                  <div className="field-value">{recibo.telCliente}</div>
                </div>

                {/* Tipo de equipo */}
                <div style="display: flex; gap: 8px; margin: 3px 0;">
                  <div style="display: inline-flex; align-items: center; margin-right: 12px; flex: 1;">
                    <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Computadora</span>
                    <span style="width: 12px; height: 12px; border: 1.5px solid #000; display: inline-block; position: relative;" class="${recibo.tipoEquipo.includes('Computadora') || recibo.tipoEquipo.includes('PC') || recibo.tipoEquipo.includes('Laptop') ? 'checked' : ''}"></span>
                  </div>
                  <div style="display: inline-flex; align-items: center; margin-right: 12px; flex: 1;">
                    <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Impresora</span>
                    <span style="width: 12px; height: 12px; border: 1.5px solid #000; display: inline-block; position: relative;" class="${recibo.tipoEquipo.includes('Impresora') ? 'checked' : ''}"></span>
                  </div>
                  <div style="display: inline-flex; align-items: center; margin-right: 12px; flex: 1;">
                    <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Otro</span>
                    <span style="width: 12px; height: 12px; border: 1.5px solid #000; display: inline-block; position: relative;" class="${!recibo.tipoEquipo.includes('Computadora') && !recibo.tipoEquipo.includes('PC') && !recibo.tipoEquipo.includes('Laptop') && !recibo.tipoEquipo.includes('Impresora') ? 'checked' : ''}"></span>
                  </div>
                </div>

                {/* Marca y Modelo */}
                <div style="display: flex; gap: 8px;">
                  <div style="display: flex; align-items: center; margin: 2px 0; min-height: 16px; flex: 1;">
                    <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Marca:</span>
                    <div style="flex: 1; border-bottom: 1px solid #000; padding-left: 4px; min-height: 14px;">{recibo.marca}</div>
                  </div>
                  <div style="display: flex; align-items: center; margin: 2px 0; min-height: 16px; flex: 1;">
                    <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Modelo:</span>
                    <div style="flex: 1; border-bottom: 1px solid #000; padding-left: 4px; min-height: 14px;">{recibo.modelo}</div>
                  </div>
                </div>

                {/* Accesorios */}
                <div className="checkbox-group">
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('cargador') ? 'checked' : ''}"></span>
                    <span>Cargador</span>
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('cable usb') ? 'checked' : ''}"></span>
                    <span>Cable USB</span>
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('cable energia') || recibo.accesorios.toLowerCase().includes('cable energía') ? 'checked' : ''}"></span>
                    <span>Cable Energía</span>
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('maletin') || recibo.accesorios.toLowerCase().includes('maletín') || recibo.accesorios.toLowerCase().includes('bolsa') ? 'checked' : ''}"></span>
                    <span>Maletín</span>
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('monitor') ? 'checked' : ''}"></span>
                    <span>Monitor</span>
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox ${recibo.accesorios.toLowerCase().includes('cpu') ? 'checked' : ''}"></span>
                    <span>CPU</span>
                  </div>
                </div>

                {/* Otro */}
                <div className="field">
                  <span className="field-label">Otro:</span>
                  <div className="field-value">{recibo.accesorios}</div>
                </div>

                {/* Trabajos a Realizar */}
                <div style="display: flex; align-items: center; margin: 2px 0; min-height: 16px;">
                  <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Trabajos a Realizar:</span>
                  <div style="flex: 1; border-bottom: 1px solid #000; padding-left: 4px; min-height: 14px;"></div>
                </div>
                <div style="border: 1.5px solid #000; padding: 4px; min-height: 45px; margin: 2px 0; white-space: pre-wrap; word-wrap: break-word;">{recibo.problema}</div>

                {/* Observaciones */}
                <div style="display: flex; align-items: center; margin: 2px 0; min-height: 16px;">
                  <span style="font-weight: bold; margin-right: 4px; white-space: nowrap;">Observaciones:</span>
                  <div style="flex: 1; border-bottom: 1px solid #000; padding-left: 4px; min-height: 14px;"></div>
                </div>
                <div style="border: 1.5px solid #000; padding: 4px; min-height: 35px; margin: 2px 0; white-space: pre-wrap; word-wrap: break-word;">{recibo.trabajos}</div>

                {/* Footer */}
                <div className="footer">
                  <div className="footer-box">
                    <div className="footer-label">TOTAL A PAGAR</div>
                    <div className="footer-value">L {recibo.costoEstimado.toFixed(2)}</div>
                  </div>
                  <div className="footer-box">
                    <div className="footer-label">Recibido por:</div>
                    <div className="footer-value">{recibo.recibidoPor}</div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="disclaimer">
                  <div><strong>Nota:</strong> La empresa no se hace responsable por equipos con mas de 45 días</div>
                  <div>sin reclamar desde la fecha de ingreso.</div>
                  <div><strong>PARA RECLAMO DE SU ARTÍCULO PRESENTAR FACTURA CORRESPONDIENTE</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/**
       * --- QZ TRAY (opcional) ---
       * Si deseas elegir impresora del sistema sin el diálogo del navegador y enviar RAW ESC/POS:
       * 1) Instala QZ Tray: https://qz.io/download/ y ejecútalo.
       * 2) Agrega la librería a tu app (script qz-tray.js en index.html o npm @qz/tray) y usa HTTPS.
       * 3) Firma las peticiones según docs de QZ.
       * 4) Ejemplo rápido:
       *
       * async function printConQZ() {
       *   // @ts-ignore
       *   const qz = (window as any).qz;
       *   if (!qz) { alert('QZ Tray no está disponible'); return; }
       *   if (!qz.websocket.isActive()) await qz.websocket.connect();
       *   const printers = await qz.printers.find();
       *   const nombre = window.prompt('Escribe el nombre de la impresora:
' + printers.join('
'));
       *   if (!nombre) return;
       *   const cmds = [
       *     '\x1B\x40', // init
       *     '*** Orden #' + ${'`'} + ' ${'`'} + ' ***\n',
       *     'Cliente: ' + '${'${ticket.nombre_cliente}'}' + '\n',
       *     'Equipo: ' + '${'${ticket.tipo_equipo}'} ${'${ticket.marca}'}' + '\n',
       *     'Estado: ' + '${'${ticket.estado_actual}'}' + '\n',
       *     '-------------------------------\n',
       *     'Costo Est.: L ' + (${formData.costo_estimado ?? 0}).toFixed(2) + '\n',
       *     '\n\n',
       *     '\x1D\x56\x41', // cortar (full cut)
       *   ].join('');
       *   await qz.print({ type: 'raw', format: 'command', data: cmds }, { printer: nombre });
       * }
       */}
    </div>
  );
}
