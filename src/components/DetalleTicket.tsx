import { useState, useMemo, useRef } from 'react';
import { X, User, Phone, MapPin, Laptop, Lock, Package, AlertCircle, Calendar, DollarSign, FileText, Save, Printer } from 'lucide-react';
import { ticketService } from '../lib/ticketService';
import type { Ticket } from '../lib/database.types';

/**
 * \u26a1\ufe0f Qué incluye este archivo
 * 1) Botón **Imprimir** que genera un recibo tamaño 80mm/58mm y abre el diálogo del navegador (universal).
 * 2) (Opcional) Hooks y estructura para **QZ Tray** si quieres elegir la impresora del sistema y mandar RAW ESC/POS.
 *    - Ver sección `// --- QZ TRAY (opcional) ---` más abajo.
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

  const printAreaRef = useRef<HTMLDivElement | null>(null);

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

  const formatearFechaHora = (fecha: string | Date) => {
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return new Intl.DateTimeFormat('es-HN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  // --- Datos calculados para el recibo ---
  const recibo = useMemo(() => {
    return {
      negocio: 'Multiplanet / Taller', // Cambia por el nombre de tu negocio
      telefono: '+504 0000-0000',       // Cambia por tu número
      direccion: 'Tocoa, Colón',        // Cambia por tu dirección
      fecha: formatearFechaHora(new Date()),
      ticket: ticket.numero_ticket,
      cliente: ticket.nombre_cliente,
      telCliente: ticket.telefono ?? '-',
      equipo: `${ticket.tipo_equipo} ${ticket.marca}${ticket.modelo ? ' ' + ticket.modelo : ''}`.trim(),
      serie: ticket.numero_serie ?? '-',
      estado: ticket.estado_actual,
      tecnico: formData.tecnico_asignado || ticket.tecnico_asignado || '-',
      problema: ticket.descripcion_problema,
      costoEstimado: Number(formData.costo_estimado ?? ticket.costo_estimado || 0),
      anticipo: 0, // si manejas anticipos, colócalo aquí
      notas: formData.notas_tecnico || ticket.notas_tecnico || '-',
    };
  }, [ticket, formData]);

  // --- Impresión universal (diálogo del navegador) ---
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
    /* Ajusta 80mm o 58mm según tu rollo */
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
    .qr { display: flex; justify-content: center; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="wrap">
    ${contenido}
  </div>
  <script>
    window.onload = () => {
      window.print();
      setTimeout(() => window.close(), 300);
    };
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
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(
                ticket.estado_actual
              )}`}>
                {ticket.estado_actual}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorPrioridad(
                ticket.prioridad
              )}`}>
                Prioridad: {ticket.prioridad}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Imprimir (universal) */}
            <button
              onClick={handleImprimir}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              title="Imprimir orden (selecciona tu impresora en el diálogo)"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>

            {/* Cerrar */}
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido original (resumido aquí por brevedad): pega aquí el resto de tu UI tal cual la tenías */}
        <div className="p-6 space-y-6">
          {/* ... TODA tu UI anterior ... (Información del Cliente/Equipo/Problema/Seguimiento) */}
          {/* === Zona oculta/plantilla que se imprime === */}
          <div className="hidden">
            <div ref={printAreaRef}>
              {/* === PLANTILLA DEL RECIBO TERMAL 80mm === */}
              <div className="center bold">{recibo.negocio}</div>
              <div className="center small">{recibo.direccion}</div>
              <div className="center small">Tel: {recibo.telefono}</div>
              <div className="line" />
              <div className="kv"><span>Fecha:</span><span>{recibo.fecha}</span></div>
              <div className="kv"><span>Ticket:</span><span>#{recibo.ticket}</span></div>
              <div className="line" />
              <div className="kv"><span>Cliente:</span><span>{recibo.cliente}</span></div>
              <div className="kv"><span>Tel:</span><span>{recibo.telCliente}</span></div>
              <div className="line" />
              <div className="kv"><span>Equipo:</span><span style={{maxWidth:'46mm', textAlign:'right'}}>{recibo.equipo}</span></div>
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
              {/* Si quieres agregar QR, acá puedes renderizar un <img src=... /> pre-generado */}
            </div>
          </div>

          {/* === Gestión y Seguimiento (tu bloque original) === */}
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

            {/* ... coloca aquí los campos que ya tenías ... */}

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

      {/* --- QZ TRAY (opcional) ---
        Si quieres **elegir impresora del sistema** sin el diálogo del navegador y enviar RAW ESC/POS:
        1) Instala QZ Tray en tu PC: https://qz.io/download/ y ejecútalo.
        2) Agrega la librería a tu app (por ejemplo cargando el script qz-tray.js en index.html o vía npm @qz/tray).
        3) Usa el siguiente patrón (puedes moverlo a un hook o util). *Requiere HTTPS y firmar requests.*

        Ejemplo de uso rápido (pseudocódigo TS dentro del componente):

        async function printConQZ() {
          // @ts-ignore
          const qz = (window as any).qz;
          if (!qz) { alert('QZ Tray no está disponible'); return; }

          // Conectar
          if (!qz.websocket.isActive()) await qz.websocket.connect();

          // Listar impresoras y permitir elegir
          const printers = await qz.printers.find();
          const nombre = window.prompt('Escribe el nombre exacto de la impresora:\n' + printers.join('\n'));
          if (!nombre) return;

          // Componer comandos ESC/POS (texto simple)
          const cmds = [
            '\\x1B\\x40', // init
            '*** ' + ${'`Orden #'`} + ticket.numero_ticket + ' ***\n',
            'Cliente: ' + ticket.nombre_cliente + '\n',
            'Equipo: ' + (ticket.tipo_equipo + ' ' + ticket.marca) + '\n',
            'Estado: ' + ticket.estado_actual + '\n',
            '-------------------------------\n',
            'Costo Est.: L ' + (formData.costo_estimado ?? 0).toFixed(2) + '\n',
            '\\n\\n',
            '\\x1D\\x56\\x41', // cortar (full cut)
          ];

          await qz.print({ type: 'raw', format: 'command', data: cmds.join('') }, { printer: nombre });
        }
      */}
    </div>
  );
}
