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
    const fechaActual = new Date();
    return {
      negocio: 'MULTIPLANET',
      direccion: 'Bº El Centro, Contiguo A Edificio Makalo,',
      ciudad: 'Tocoa, Colón',
      telefono1: '3171-3287',
      telefono2: '9647-3966',
      email: 'multiplanettocoa@yahoo.com',
      fecha: fmtFechaHora(fechaActual),
      dia: fechaActual.getDate(),
      mes: fechaActual.getMonth() + 1,
      anio: fechaActual.getFullYear().toString().slice(-2),
      ticket: ticketProvisional,
      cliente: formData.nombre_cliente || '-',
      direccionCliente: formData.direccion || '',
      telCliente: formData.telefono || '-',
      tipoEquipo: formData.tipo_equipo,
      marca: formData.marca || '',
      modelo: formData.modelo || '',
      serie: formData.numero_serie || '',
      contrasena: formData.contrasena_equipo || '',
      accesorios: formData.accesorios_incluidos || '',
      estado: formData.estado_inicial || 'Recibido',
      problema: formData.descripcion_problema || '-',
      prioridad: formData.prioridad,
      recibidoPor: formData.recibido_por || '-',
      fechaEstEntrega: formData.fecha_estimada_entrega
        ? fmtFechaHora(formData.fecha_estimada_entrega)
        : 'No definida',
      trabajos: '',
      observaciones: formData.contrasena_equipo ? `Clave: ${formData.contrasena_equipo}` : '',
    };
  }, [formData, ticketProvisional]);

  // Imprimir (diálogo del navegador) — formato profesional A5
  const handleImprimir = () => {
    // Validaciones mínimas para que no salga en blanco
    if (!formData.nombre_cliente || !formData.telefono || !formData.descripcion_problema) {
      alert('Completa al menos: Nombre, Teléfono y Descripción del problema para imprimir.');
      return;
    }

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

      {/* PLANTILLA OCULTA PARA LA IMPRESIÓN (formato profesional) */}
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
            <div className="row" style="margin: 3px 0;">
              <div className="field-inline">
                <span className="field-label">Computadora</span>
                <span className="checkbox ${recibo.tipoEquipo.includes('Computadora') || recibo.tipoEquipo.includes('PC') || recibo.tipoEquipo.includes('Laptop') ? 'checked' : ''}"></span>
              </div>
              <div className="field-inline">
                <span className="field-label">Impresora</span>
                <span className="checkbox ${recibo.tipoEquipo.includes('Impresora') ? 'checked' : ''}"></span>
              </div>
              <div className="field-inline">
                <span className="field-label">Otro</span>
                <span className="checkbox ${!recibo.tipoEquipo.includes('Computadora') && !recibo.tipoEquipo.includes('PC') && !recibo.tipoEquipo.includes('Laptop') && !recibo.tipoEquipo.includes('Impresora') ? 'checked' : ''}"></span>
              </div>
            </div>

            {/* Marca y Modelo */}
            <div className="row">
              <div className="field" style="flex: 1;">
                <span className="field-label">Marca:</span>
                <div className="field-value">{recibo.marca}</div>
              </div>
              <div className="field" style="flex: 1;">
                <span className="field-label">Modelo:</span>
                <div className="field-value">{recibo.modelo}</div>
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
            <div className="field">
              <span className="field-label">Trabajos a Realizar:</span>
              <div className="field-value"></div>
            </div>
            <div className="text-area" style="min-height: 45px;">{recibo.problema}</div>

            {/* Observaciones */}
            <div className="field">
              <span className="field-label">Observaciones:</span>
              <div className="field-value"></div>
            </div>
            <div className="text-area" style="min-height: 35px;">{recibo.observaciones}</div>

            {/* Footer */}
            <div className="footer">
              <div className="footer-box">
                <div className="footer-label">TOTAL A PAGAR</div>
                <div className="footer-value"></div>
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
    </form>
  );
}
