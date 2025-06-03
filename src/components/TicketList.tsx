'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  User, 
  Users,
  FileText,
  Calendar,
  Filter,
  Trash2,
  Edit
} from 'lucide-react';
import type { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';

interface TicketListProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
  onDelete: (ticketId: string) => void;
  onEdit: (ticket: Ticket) => void;
}

export function TicketList({ tickets, onStatusChange, onDelete, onEdit }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  const filteredTickets = tickets
    .filter(ticket => statusFilter === 'all' || ticket.status === statusFilter)
    .filter(ticket => priorityFilter === 'all' || ticket.priority === priorityFilter)
    .sort((a, b) => {
      // High priority tickets first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Niedrig</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Normal</span>;
      case 'high':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center space-x-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Hoch</span>
          </span>
        );
    }
  };

  const statusOptions = [
    { value: 'all' as const, label: 'Alle Status' },
    { value: 'open' as const, label: 'Offen' },
    { value: 'in_progress' as const, label: 'In Bearbeitung' },
    { value: 'completed' as const, label: 'Fertig' },
  ];

  const priorityOptions = [
    { value: 'all' as const, label: 'Alle Prioritäten' },
    { value: 'low' as const, label: 'Niedrig' },
    { value: 'medium' as const, label: 'Normal' },
    { value: 'high' as const, label: 'Hoch' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Count */}
      <div className="text-sm text-gray-600">
        {filteredTickets.length} Ticket{filteredTickets.length !== 1 ? 's' : ''} gefunden
      </div>

      {/* Tickets */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Keine Tickets gefunden</h3>
            <p className="mt-2 text-gray-500">
              {statusFilter !== 'all' || priorityFilter !== 'all' 
                ? 'Versuchen Sie andere Filter-Einstellungen'
                : 'Erstellen Sie Ihr erstes Ticket'
              }
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${
                ticket.priority === 'high' 
                  ? 'border-l-red-500' 
                  : ticket.priority === 'medium'
                  ? 'border-l-yellow-500'
                  : 'border-l-green-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(ticket.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ticket.subject}
                    </h3>
                    {getPriorityBadge(ticket.priority)}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {ticket.description}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(ticket.date, 'dd.MM.yyyy', { locale: de })}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{ticket.contact}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {ticket.assignedUsers.length > 1 ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span>
                        {ticket.assignedUsers.map(user => 
                          user.charAt(0).toUpperCase() + user.slice(1)
                        ).join(', ')}
                      </span>
                    </div>

                    {ticket.files.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{ticket.files.length} Datei{ticket.files.length !== 1 ? 'en' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Status Change */}
                  <select
                    value={ticket.status}
                    onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Offen</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="completed">Fertig</option>
                  </select>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(ticket)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(ticket.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 