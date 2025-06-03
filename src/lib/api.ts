import { supabase } from './supabase';
import { encryptTicketData, decryptTicketData } from './encryption';
import type { Ticket, CreateTicketData, TicketStatus, TicketFile, TicketHistoryEntry } from '@/types/ticket';

// Create a new ticket
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  // Generate ticket ID
  const ticketId = crypto.randomUUID();
  
  // Upload files if any
  const uploadedFiles: TicketFile[] = [];
  if (data.files && data.files.length > 0) {
    for (const file of data.files) {
      const fileId = crypto.randomUUID();
      const fileName = `${ticketId}/${fileId}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ticket-files')
        .upload(fileName, file);
        
      if (uploadError) {
        console.error('File upload error:', uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('ticket-files')
        .getPublicUrl(fileName);
        
      uploadedFiles.push({
        id: fileId,
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        isImage: file.type.startsWith('image/'),
      });
    }
  }

  // Create ticket object
  const ticket: Ticket = {
    id: ticketId,
    subject: data.subject,
    description: data.description,
    contact: data.contact,
    date: data.date,
    status: 'open',
    priority: data.priority,
    assignedUsers: data.assignedUsers,
    files: uploadedFiles,
    history: [{
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action: 'Ticket erstellt',
      user: 'System',
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Encrypt sensitive data
  const encryptedTicket = encryptTicketData({
    subject: ticket.subject,
    description: ticket.description,
    contact: ticket.contact,
  });

  // Save to database
  const { error } = await supabase
    .from('tickets')
    .insert([{
      id: ticket.id,
      subject: encryptedTicket.subject,
      description: encryptedTicket.description,
      contact: encryptedTicket.contact,
      date: ticket.date.toISOString(),
      status: ticket.status,
      priority: ticket.priority,
      assigned_users: ticket.assignedUsers,
      files: ticket.files,
      history: ticket.history,
      created_at: ticket.createdAt.toISOString(),
      updated_at: ticket.updatedAt.toISOString(),
    }]);

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return ticket;
}

// Get all tickets
export async function getTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  if (!data) return [];

  // Decrypt and transform data
  return data.map((row: {
    id: string;
    subject: string;
    description: string;
    contact: string;
    date: string;
    status: TicketStatus;
    priority: string;
    assigned_users: string[];
    files: TicketFile[];
    history: TicketHistoryEntry[];
    created_at: string;
    updated_at: string;
  }) => {
    const decrypted = decryptTicketData({
      subject: row.subject,
      description: row.description,
      contact: row.contact,
    });

    return {
      id: row.id,
      subject: decrypted.subject,
      description: decrypted.description,
      contact: decrypted.contact,
      date: new Date(row.date),
      status: row.status,
      priority: row.priority,
      assignedUsers: row.assigned_users || [],
      files: row.files || [],
      history: row.history || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as Ticket;
  });
}

// Update ticket status
export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  // First get the current ticket to update history
  const { data: currentTicket } = await supabase
    .from('tickets')
    .select('history')
    .eq('id', ticketId)
    .single();

  const history = currentTicket?.history || [];
  const newHistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    action: `Status geändert zu: ${getStatusLabel(status)}`,
    user: 'System', // In production, this would be the current user
  };

  const { error } = await supabase
    .from('tickets')
    .update({
      status,
      history: [...history, newHistoryEntry],
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  if (error) {
    throw new Error(`Failed to update ticket status: ${error.message}`);
  }
}

// Delete ticket
export async function deleteTicket(ticketId: string): Promise<void> {
  // First, delete associated files from storage
  const { data: ticket } = await supabase
    .from('tickets')
    .select('files')
    .eq('id', ticketId)
    .single();

  if (ticket?.files && ticket.files.length > 0) {
    // Delete files from storage
    const filePaths = ticket.files.map((file: TicketFile) => 
      `${ticketId}/${file.id}-${file.name}`
    );
    
    await supabase.storage
      .from('ticket-files')
      .remove(filePaths);
  }

  // Delete ticket from database
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId);

  if (error) {
    throw new Error(`Failed to delete ticket: ${error.message}`);
  }
}

// Helper function to get status label
function getStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'Offen';
    case 'in_progress':
      return 'In Bearbeitung';
    case 'completed':
      return 'Fertig';
  }
}

// Update PWA badge with open ticket count
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