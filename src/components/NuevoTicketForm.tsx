import { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  User,
  Phone,
  MapPin,
  Laptop,
  Lock,
  Package,
  AlertCircle,
  Wrench,
  Printer,
} from 'lucide-react';
import { ticketService } from '../lib/ticketService';
import type { TicketInsert } from '../lib/database.types';

interface NuevoTicketFormProps {
  onTicketCreado: () => void;
  onCancelar: () => void;
}

export default function NuevoTicketForm({ onTicketCreado, onCancelar }: NuevoTicketFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono: '',
    direccion: '',
    tipo_equipo: 'Laptop',
    marca: '',
    modelo: '',
    numero_serie: '',
    contrasena_equipo: '',
    accesorios_incluidos: '',
    descripcion_problema: '',
    prioridad: 'Media',
    estado_inicial: 'Recibido',
    recibido_por: '',
    fecha_estimada_entrega: '',
  });

  // Ref a la plantilla que imprimimos
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ticketData: Omit<TicketInsert, 'numero_ticket'> = {
        ...formData,
        fecha_estimada_entrega: formData.fecha_estimada_entrega || null,
      };

      await ticketService.crearTicket(ticketData);
      onTicketCreado();
    } catch (err) {
      setError('Error al crear el ticket. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const fmtFechaHora = (d: Date | string) =>
    new Intl.DateTimeFormat('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(typeof d === 'string' ? new Date(d) : d);

  // Número de ticket provisional (solo para impresión previa al guardado)
  const ticketProvisional = useMemo(() => {
    const now = new Date();
    return `TMP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${now.getTime().toString().slice(-6)}`;
  }, []);

  // Separar accesorios por coma y listarlos
  const accesoriosList = useMemo(() => {
    return (formData.accesorios_incluidos || '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
  }, [formData.accesorios_incluidos]);

  const recibo = useMemo(() => {
    return {
      negocio: 'Multiplanet / Taller',
      direccionNegocio: 'Tocoa, Colón',
      telefonoNegocio: '3361-1761 / 3171-3287', // 👈 Teléfonos visibles
      fecha: fmtFechaHora(new Date()),
      ticket: ticketProvisional,
      cliente: formData.nombre_cliente || '-',
      telCliente: formData.telefono || '-',
      equipo: `${formData.tipo_equipo} ${formData.marca}${
        formData.modelo ? ' ' + formData.modelo : ''
      }`.trim(),
      serie: formData.numero_serie || '-',
      estado: formData.estado_inicial || 'Recibido',
      problema: formData.descripcion_problema || '-',
      prioridad: formData.prioridad,
      recibidoPor: formData.recibido_por || '-',
      fechaEstEntrega: formData.fecha_estimada_entrega
        ? fmtFechaHora(formData.fecha_estimada_entrega)
        : 'No definida',
      accesorios: accesoriosList,
      notas: formData.contrasena_equipo ? `Clave: ${formData.contrasena_equipo}` : '-',
    };
  }, [formData, ticketProvisional, accesoriosList]);

  // Imprimir (diálogo del navegador) — tamaño 58 mm y tipografía compacta
  const handleImprimir = () => {
    // Validaciones mínimas para que no salga en blanco
    if (!formData.nombre_cliente || !formData.telefono || !formData.descripcion_problema) {
      alert('Completa al menos: Nombre, Teléfono y Descripción del problema para imprimir.');
      return;
    }

    const contenido = printAreaRef.current?.innerHTML;
    if (!contenido) return;

    const w = window.open('', '_blank', 'width=420,height=700'); // ventana más angosta
    if (!w) return;

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orden ${recibo.ticket}</title>
  <style>
    /* Papel térmico pequeño (58 mm) */
    @page { size: 58mm auto; margin: 0; }
    /* Tipografía compacta para evitar corte de letras */
    body { margin: 0; font-family: monospace; }
    .wrap { width: 54mm; padding: 3mm; box-sizing: border-box; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 11px; line-height: 1.3; }
    .tiny  { font-size: 10px; line-height: 1.2; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .kv { display: flex; justify-content: space-between; font-size: 11px; gap: 6px; }
    .kv span:last-child { text-align: right; max-width: 34mm; overflow-wrap: anywhere; }
    .pre { white-space: pre-wrap; font-size: 11px; line-height: 1.3; overflow-wrap: anywhere; }
    /* Evita que la última línea se corte por márgenes de la impresora */
    .bottom-space { height: 8mm; }
  </style>
</head>
<body>
  <div class="wrap">
    ${contenido}
    <div class="bottom-space"></div>
  </div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Información del Cliente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Información del Cliente</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre_cliente"
              value={formData.nombre_cliente}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3361-1761"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Calle Principal #123"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Información del Equipo */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Laptop className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Información del Equipo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Equipo <span className="text-red-500">*</span>
            </label>
            <select
              name="tipo_equipo"
              value={formData.tipo_equipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Laptop">Laptop</option>
              <option value="PC de Escritorio">PC de Escritorio</option>
              <option value="All-in-One">All-in-One</option>
              <option value="Tablet">Tablet</option>
              <option value="Servidor">Servidor</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="HP, Dell, Lenovo, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Latitude 5510"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
            <input
              type="text"
              name="numero_serie"
              value={formData.numero_serie}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="S/N: XXXXXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text sm font-medium text-gray-700 mb-1">Contraseña del Equipo</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="contrasena_equipo"
                value={formData.contrasena_equipo}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contraseña de acceso"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accesorios Incluidos</label>
            <div className="relative">
              <Package className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="accesorios_incluidos"
                value={formData.accesorios_incluidos}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cargador, funda, mouse, bolsa, etc. (separa por comas)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Problema Reportado */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">Problema Reportado</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Problema <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion_problema"
              value={formData.descripcion_problema}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe detalladamente el problema que presenta el equipo..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad <span className="text-red-500">*</span>
              </label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Inicial <span className="text-red-500">*</span>
              </label>
              <select
                name="estado_inicial"
                value={formData.estado_inicial}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Recibido">Recibido</option>
                <option value="En Evaluación">En Evaluación</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Información de Gestión */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Información de Gestión</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recibido por <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="recibido_por"
              value={formData.recibido_por}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del empleado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Estimada de Entrega
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="fecha_estimada_entrega"
                value={formData.fecha_estimada_entrega}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Acción: Cancelar / Imprimir / Guardar */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancelar}
          disabled={loading}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleImprimir}
          disabled={loading}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Imprimir orden (elige tu impresora en el diálogo del navegador)"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Ticket'
          )}
        </button>
      </div>

      {/* PLANTILLA OCULTA PARA LA IMPRESIÓN (58 mm, compacta) */}
      <div className="hidden">
        <div ref={printAreaRef}>
          <div className="center small bold">{recibo.negocio}</div>
          <div className="center tiny">{recibo.direccionNegocio}</div>
          <div className="center tiny">Tels: {recibo.telefonoNegocio}</div>
          <div className="line" />
          <div className="kv"><span>Fecha:</span><span>{recibo.fecha}</span></div>
          <div className="kv"><span>Ticket:</span><span>{recibo.ticket}</span></div>
          <div className="line" />
          <div className="kv"><span>Cliente:</span><span>{recibo.cliente}</span></div>
          <div className="kv"><span>Tel:</span><span>{recibo.telCliente}</span></div>
          <div className="line" />
          <div className="kv"><span>Equipo:</span><span>{recibo.equipo}</span></div>
          <div className="kv"><span>Serie:</span><span>{recibo.serie}</span></div>
          <div className="kv"><span>Estado:</span><span>{recibo.estado}</span></div>
          <div className="kv"><span>Prioridad:</span><span>{recibo.prioridad}</span></div>
          <div className="kv"><span>Recibido por:</span><span>{recibo.recibidoPor}</span></div>
          <div className="kv"><span>Entrega:</span><span>{recibo.fechaEstEntrega}</span></div>
          <div className="line" />
          <div className="bold small">Accesorios</div>
          {recibo.accesorios.length ? (
            <ul className="small">
              {recibo.accesorios.map((a, i) => (
                <li key={i}>- {a}</li>
              ))}
            </ul>
          ) : (
            <div className="small">-</div>
          )}
          <div className="line" />
          <div className="bold small">Problema</div>
          <div className="pre">{recibo.problema}</div>
          <div className="line" />
          <div className="bold small">Notas</div>
          <div className="pre">{recibo.notas}</div>
          <div className="line" />
          <div className="center tiny">¡Gracias por su preferencia!</div>
        </div>
      </div>
    </form>
  );
}
