'use client';

import { useState, useEffect } from 'react';
import { CreateTicketForm } from '@/components/CreateTicketForm';
import { TicketList } from '@/components/TicketList';
import { Plus, TicketIcon, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { createTicket, getTickets, updateTicketStatus, deleteTicket, updatePWABadge } from '@/lib/api';
import type { Ticket, CreateTicketData, TicketStatus } from '@/types/ticket';

export default function HomePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load tickets on component mount
  useEffect(() => {
    loadTickets();
  }, []);

  // Update PWA badge when tickets change
  useEffect(() => {
    updatePWABadge();
  }, [tickets]);

  const loadTickets = async () => {
    try {
      const fetchedTickets = await getTickets();
      setTickets(fetchedTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      alert('Fehler beim Laden der Tickets');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleCreateTicket = async (data: CreateTicketData) => {
    setIsLoading(true);
    try {
      const newTicket = await createTicket(data);
      setTickets(prev => [newTicket, ...prev]);
      setShowCreateForm(false);
      alert('Ticket erfolgreich erstellt!');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Fehler beim Erstellen des Tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      await updateTicketStatus(ticketId, status);
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId
            ? { ...ticket, status, updatedAt: new Date() }
            : ticket
        )
      );
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      alert('Fehler beim Aktualisieren des Ticket-Status');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Ticket löschen möchten?')) {
      return;
    }

    try {
      await deleteTicket(ticketId);
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Fehler beim Löschen des Tickets');
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    // For now, just show the ticket details in an alert
    // In a full implementation, you'd open an edit modal
    alert(`Ticket bearbeiten: ${ticket.subject}\n\nDiese Funktion wird in der nächsten Version implementiert.`);
  };

  // Calculate statistics
  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const completedTickets = tickets.filter(t => t.status === 'completed');
  const highPriorityTickets = tickets.filter(t => t.priority === 'high' && t.status !== 'completed');

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <TicketIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Ticketsystem</h1>
            </div>
            
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Neues Ticket</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TicketIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Offen</p>
                <p className="text-2xl font-bold text-gray-900">{openTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fertig</p>
                <p className="text-2xl font-bold text-gray-900">{completedTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoch Prio</p>
                <p className="text-2xl font-bold text-gray-900">{highPriorityTickets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateTicketForm
              onSubmit={handleCreateTicket}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Ticket List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Alle Tickets ({tickets.length})
          </h2>
          
          <TicketList
            tickets={tickets}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTicket}
            onEdit={handleEditTicket}
          />
        </div>
      </main>
    </div>
  );
}
