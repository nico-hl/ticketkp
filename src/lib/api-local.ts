import { db } from './database';
import { encryptTicketData, decryptTicketData } from './encryption';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Ticket, CreateTicketData, TicketStatus, TicketFile, TicketHistoryEntry } from '@/types/ticket';

// Ensure upload directory exists
const UPLOAD_DIR = process.env.STORAGE_PATH || '/app/uploads';

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

// Create a new ticket
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const ticketId = crypto.randomUUID();
  
  // Upload files if any
  const uploadedFiles: TicketFile[] = [];
  if (data.files && data.files.length > 0) {
    await ensureUploadDir();
    
    for (const file of data.files) {
      const fileId = crypto.randomUUID();
      const fileName = `${ticketId}-${fileId}-${file.name}`;
      const filePath = join(UPLOAD_DIR, fileName);
      
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        uploadedFiles.push({
          id: fileId,
          name: file.name,
          url: `/uploads/${fileName}`,
          type: file.type,
          size: file.size,
          isImage: file.type.startsWith('image/'),
        });
      } catch (error) {
        console.error('File upload error:', error);
        continue;
      }
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
  const encryptedData = encryptTicketData({
    subject: ticket.subject,
    description: ticket.description,
    contact: ticket.contact,
  });

  // Save to database
  const query = `
    INSERT INTO tickets (id, subject, description, contact, date, status, priority, assigned_users, files, history, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;
  
  const values = [
    ticket.id,
    encryptedData.subject,
    encryptedData.description,
    encryptedData.contact,
    ticket.date.toISOString(),
    ticket.status,
    ticket.priority,
    ticket.assignedUsers,
    JSON.stringify(ticket.files),
    JSON.stringify(ticket.history),
    ticket.createdAt.toISOString(),
    ticket.updatedAt.toISOString(),
  ];

  try {
    await db.query(query, values);
    return ticket;
  } catch (error) {
    throw new Error(`Failed to create ticket: ${error}`);
  }
}

// Get all tickets
export async function getTickets(): Promise<Ticket[]> {
  try {
    const query = 'SELECT * FROM tickets ORDER BY created_at DESC';
    const result = await db.query(query);
    
    return result.rows.map((row: any) => {
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
        files: JSON.parse(row.files || '[]'),
        history: JSON.parse(row.history || '[]').map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      } as Ticket;
    });
  } catch (error) {
    throw new Error(`Failed to fetch tickets: ${error}`);
  }
}

// Update ticket status
export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  try {
    // Get current ticket to update history
    const currentQuery = 'SELECT history FROM tickets WHERE id = $1';
    const currentResult = await db.query(currentQuery, [ticketId]);
    
    if (currentResult.rows.length === 0) {
      throw new Error('Ticket not found');
    }
    
    const history = JSON.parse(currentResult.rows[0].history || '[]');
    const newHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action: `Status geändert zu: ${getStatusLabel(status)}`,
      user: 'System',
    };
    
    const updatedHistory = [...history, newHistoryEntry];
    
    const query = `
      UPDATE tickets 
      SET status = $1, history = $2, updated_at = $3 
      WHERE id = $4
    `;
    
    await db.query(query, [
      status,
      JSON.stringify(updatedHistory),
      new Date().toISOString(),
      ticketId,
    ]);
  } catch (error) {
    throw new Error(`Failed to update ticket status: ${error}`);
  }
}

// Delete ticket
export async function deleteTicket(ticketId: string): Promise<void> {
  try {
    const query = 'DELETE FROM tickets WHERE id = $1';
    await db.query(query, [ticketId]);
    
    // TODO: Delete associated files from filesystem
    // This would require additional logic to clean up uploaded files
  } catch (error) {
    throw new Error(`Failed to delete ticket: ${error}`);
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