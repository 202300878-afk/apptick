/*
  # Sistema de Tickets de Reparación de Computadoras

  ## Descripción
  Esta migración crea la infraestructura completa para un sistema de gestión de tickets
  de reparación de computadoras. Incluye la tabla principal de tickets con todos los campos
  necesarios para rastrear reparaciones desde el ingreso hasta la entrega.

  ## 1. Nueva Tabla: tickets
  
  ### Campos de Identificación
  - `id` (uuid, primary key): Identificador único del ticket
  - `numero_ticket` (text, unique): Número de ticket formateado (ej: TKT-2024-0001)
  
  ### Información del Cliente
  - `nombre_cliente` (text): Nombre completo del cliente
  - `telefono` (text): Teléfono de contacto del cliente
  - `direccion` (text): Dirección del cliente
  
  ### Información del Equipo
  - `tipo_equipo` (text): Tipo de equipo (Laptop, PC Escritorio, All-in-One, etc.)
  - `marca` (text): Marca del equipo
  - `modelo` (text): Modelo del equipo
  - `numero_serie` (text): Número de serie del equipo
  - `contrasena_equipo` (text): Contraseña del equipo para acceso
  - `accesorios_incluidos` (text): Lista de accesorios entregados con el equipo
  
  ### Detalles de la Reparación
  - `descripcion_problema` (text): Descripción detallada del problema reportado
  - `prioridad` (text): Nivel de prioridad (Baja, Media, Alta, Urgente)
  - `estado_inicial` (text): Estado del equipo al recibirlo (Recibido, En Evaluación)
  - `estado_actual` (text): Estado actual del ticket en el proceso
  - `notas_tecnico` (text): Notas internas del técnico
  
  ### Gestión y Seguimiento
  - `recibido_por` (text): Nombre del empleado que recibió el equipo
  - `tecnico_asignado` (text): Nombre del técnico asignado a la reparación
  - `costo_estimado` (numeric): Costo estimado de la reparación
  - `costo_final` (numeric): Costo final de la reparación
  
  ### Fechas
  - `fecha_ingreso` (timestamptz): Fecha en que ingresó el equipo
  - `fecha_estimada_entrega` (timestamptz): Fecha estimada de entrega
  - `created_at` (timestamptz): Fecha de creación del registro
  - `updated_at` (timestamptz): Fecha de última actualización
  
  ## 2. Seguridad
  - Se habilita Row Level Security (RLS) en la tabla tickets
  - Se crean políticas para permitir lectura y escritura de todos los tickets
    (En producción, estas políticas deberían ser más restrictivas basadas en roles de usuario)
  
  ## 3. Índices
  - Índice en numero_ticket para búsquedas rápidas
  - Índice en estado_actual para filtrado eficiente
  - Índice en fecha_ingreso para ordenamiento cronológico
  - Índice en nombre_cliente para búsquedas de clientes
*/

-- Crear tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket text UNIQUE NOT NULL,
  
  -- Información del Cliente
  nombre_cliente text NOT NULL,
  telefono text NOT NULL,
  direccion text DEFAULT '',
  
  -- Información del Equipo
  tipo_equipo text NOT NULL,
  marca text NOT NULL,
  modelo text DEFAULT '',
  numero_serie text DEFAULT '',
  contrasena_equipo text DEFAULT '',
  accesorios_incluidos text DEFAULT '',
  
  -- Detalles de la Reparación
  descripcion_problema text NOT NULL,
  prioridad text NOT NULL DEFAULT 'Media',
  estado_inicial text NOT NULL DEFAULT 'Recibido',
  estado_actual text NOT NULL DEFAULT 'Recibido',
  notas_tecnico text DEFAULT '',
  
  -- Gestión y Seguimiento
  recibido_por text NOT NULL,
  tecnico_asignado text DEFAULT '',
  costo_estimado numeric(10,2) DEFAULT 0,
  costo_final numeric(10,2) DEFAULT 0,
  
  -- Fechas
  fecha_ingreso timestamptz NOT NULL DEFAULT now(),
  fecha_estimada_entrega timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de todos los tickets
-- NOTA: En producción, esta política debería ser más restrictiva
CREATE POLICY "Permitir lectura de tickets"
  ON tickets
  FOR SELECT
  USING (true);

-- Política para permitir inserción de tickets
CREATE POLICY "Permitir creación de tickets"
  ON tickets
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización de tickets
CREATE POLICY "Permitir actualización de tickets"
  ON tickets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir eliminación de tickets
CREATE POLICY "Permitir eliminación de tickets"
  ON tickets
  FOR DELETE
  USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_numero_ticket ON tickets(numero_ticket);
CREATE INDEX IF NOT EXISTS idx_tickets_estado_actual ON tickets(estado_actual);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_ingreso ON tickets(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_nombre_cliente ON tickets(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridad ON tickets(prioridad);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada actualización
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();