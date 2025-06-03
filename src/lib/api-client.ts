import type { Ticket, CreateTicketData, TicketStatus } from '@/types/ticket';

// Frontend API Client - verwendet HTTP Requests statt direkte DB-Verbindung

// Alle Tickets abrufen
export async function getTickets(): Promise<Ticket[]> {
  try {
    const response = await fetch('/api/tickets');
    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load tickets:', error);
    throw error;
  }
}

// Neues Ticket erstellen
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  try {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('contact', data.contact);
    formData.append('date', data.date.toISOString());
    formData.append('priority', data.priority);
    formData.append('assignedUsers', JSON.stringify(data.assignedUsers));

    // Dateien anhängen (falls vorhanden)
    if (data.files) {
      data.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    const response = await fetch('/api/tickets', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create ticket:', error);
    throw error;
  }
}

// Ticket-Status aktualisieren
export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update ticket status');
    }
  } catch (error) {
    console.error('Failed to update ticket status:', error);
    throw error;
  }
}

// Ticket löschen
export async function deleteTicket(ticketId: string): Promise<void> {
  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete ticket');
    }
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    throw error;
  }
}

// PWA Badge aktualisieren
export async function updatePWABadge(): Promise<void> {
  try {
    const tickets = await getTickets();
    const openTickets = tickets.filter(ticket => ticket.status !== 'completed');
    
    if ('navigator' in window && 'setAppBadge' in navigator) {
      if (openTickets.length > 0) {
        await (navigator as Navigator & { setAppBadge: (count: number) => Promise<void> }).setAppBadge(openTickets.length);
      } else {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    }
  } catch (error) {
    console.error('Failed to update PWA badge:', error);
  }
} 