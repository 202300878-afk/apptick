import { useState } from 'react';
import { Wrench, LayoutDashboard, Plus, List } from 'lucide-react';
import Dashboard from './components/Dashboard';
import NuevoTicketForm from './components/NuevoTicketForm';
import ListaTickets from './components/ListaTickets';
import DetalleTicket from './components/DetalleTicket';
import type { Ticket } from './lib/database.types';

type Vista = 'dashboard' | 'nuevo' | 'lista';

function App() {
  const [vistaActual, setVistaActual] = useState<Vista>('dashboard');
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTicketCreado = () => {
    setVistaActual('lista');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTicketActualizado = () => {
    setTicketSeleccionado(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleVerDetalle = (ticket: Ticket) => {
    setTicketSeleccionado(ticket);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sistema de Reparaciones</h1>
              <p className="text-blue-100 text-sm mt-1">Gestión de Tickets de Reparación de Computadoras</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto">
            <button
              onClick={() => setVistaActual('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setVistaActual('nuevo')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'nuevo'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-5 h-5" />
              Nuevo Ticket
            </button>
            <button
              onClick={() => setVistaActual('lista')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'lista'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
              Lista de Tickets
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vistaActual === 'dashboard' && (
          <Dashboard refreshTrigger={refreshTrigger} onVerTicket={handleVerDetalle} />
        )}

        {vistaActual === 'nuevo' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Ticket</h2>
            <NuevoTicketForm
              onTicketCreado={handleTicketCreado}
              onCancelar={() => setVistaActual('dashboard')}
            />
          </div>
        )}

        {vistaActual === 'lista' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Todos los Tickets</h2>
            <ListaTickets refreshTrigger={refreshTrigger} onVerDetalle={handleVerDetalle} />
          </div>
        )}
      </main>

      {ticketSeleccionado && (
        <DetalleTicket
          ticket={ticketSeleccionado}
          onCerrar={() => setTicketSeleccionado(null)}
          onActualizado={handleTicketActualizado}
        />
      )}
    </div>
  );
}

export default App;
