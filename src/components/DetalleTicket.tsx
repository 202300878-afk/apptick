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
    return {
      negocio: 'Multiplanet / Taller', // Cambia por el nombre de tu negocio
      telefonoNegocio: '+504 0000-0000', // Cambia por tu número
      direccionNegocio: 'Tocoa, Colón', // Cambia por tu dirección
      fecha: formatearFechaHora(new Date()),
      ticket: ticket.numero_ticket,
      cliente: ticket.nombre_cliente,
      telCliente: ticket.telefono ?? '-',
      equipo: `${ticket.tipo_equipo} ${ticket.marca}${ticket.modelo ? ' ' + ticket.modelo : ''}`.trim(),
      serie: ticket.numero_serie ?? '-',
      estado: formData.estado_actual || ticket.estado_actual,
      tecnico: formData.tecnico_asignado || ticket.tecnico_asignado || '-',
      problema: ticket.descripcion_problema,
      costoEstimado: Number(
        (formData.costo_estimado as unknown as number) ?? ticket.costo_estimado ?? 0
      ),
      anticipo: 0, // Ajusta si utilizas anticipos
      notas: formData.notas_tecnico || ticket.notas_tecnico || '-',
    };
  }, [ticket, formData]);

  // Impresión con diálogo del navegador
  const handleImprimir = () => {
    const contenido = printAreaRef.current?.innerHTML;
    if (!contenido) return;

    const w = window.open('', '_blank', 'width=480,height=700');
    if (!w) return;

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orden ${recibo.ticket}</title>
  <style>
    /* Cambia a 58mm si tu rollo es de 58mm */
    @page { size: 80mm auto; margin: 0; }
    body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; }
    .wrap { width: 80mm; padding: 6mm 4mm; box-sizing: border-box; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .mt { margin-top: 6px; }
    .small { font-size: 12px; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    .kv { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
    .pre { white-space: pre-wrap; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">${contenido}</div>
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
              {/* Recibo térmico 80mm */}
              <div className="center bold">{recibo.negocio}</div>
              <div className="center small">{recibo.direccionNegocio}</div>
              <div className="center small">Tel: {recibo.telefonoNegocio}</div>
              <div className="line" />
              <div className="kv"><span>Fecha:</span><span>{recibo.fecha}</span></div>
              <div className="kv"><span>Ticket:</span><span>#{recibo.ticket}</span></div>
              <div className="line" />
              <div className="kv"><span>Cliente:</span><span>{recibo.cliente}</span></div>
              <div className="kv"><span>Tel:</span><span>{recibo.telCliente}</span></div>
              <div className="line" />
              <div className="kv"><span>Equipo:</span><span style={{ maxWidth: '46mm', textAlign: 'right' }}>{recibo.equipo}</span></div>
              <div className="kv"><span>Serie:</span><span>{recibo.serie}</span></div>
              <div className="kv"><span>Técnico:</span><span>{recibo.tecnico}</span></div>
              <div className="kv"><span>Estado:</span><span>{recibo.estado}</span></div>
              <div className="line" />
              <div className="bold small">Problema reportado</div>
              <div className="pre">{recibo.problema}</div>
              <div className="line" />
              <div className="kv"><span>Costo estimado:</span><span>L {recibo.costoEstimado.toFixed(2)}</span></div>
              <div className="kv"><span>Anticipo:</span><span>L {recibo.anticipo.toFixed(2)}</span></div>
              <div className="kv bold"><span>Saldo:</span><span>L {(recibo.costoEstimado - recibo.anticipo).toFixed(2)}</span></div>
              <div className="line" />
              <div className="bold small">Notas</div>
              <div className="pre">{recibo.notas}</div>
              <div className="line" />
              <div className="center small">¡Gracias por su preferencia!</div>
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
