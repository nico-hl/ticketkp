import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { encryptTicketData, decryptTicketData } from '@/lib/encryption';
import type { Ticket, CreateTicketData } from '@/types/ticket';

// Helper function to safely parse JSON
function safeJsonParse(jsonString: any, fallback: any = []) {
  if (!jsonString || jsonString === null || jsonString === '') {
    return fallback;
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error, 'Input:', jsonString);
    return fallback;
  }
}

// GET /api/tickets - Alle Tickets abrufen
export async function GET() {
  try {
    const query = 'SELECT * FROM tickets ORDER BY created_at DESC';
    const result = await db.query(query);
    
    const tickets = result.rows.map((row: any) => {
      const decrypted = decryptTicketData({
        subject: row.subject,
        description: row.description,
        contact: row.contact,
      });

      // Sichere JSON-Parsing mit Fallbacks
      const assignedUsers = Array.isArray(row.assigned_users) 
        ? row.assigned_users 
        : safeJsonParse(row.assigned_users, []);
      
      const files = safeJsonParse(row.files, []);
      const historyData = safeJsonParse(row.history, []);
      
      const history = historyData.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp || Date.now()),
      }));

      return {
        id: row.id,
        subject: decrypted.subject,
        description: decrypted.description,
        contact: decrypted.contact,
        date: new Date(row.date),
        status: row.status,
        priority: row.priority,
        assignedUsers,
        files,
        history,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      } as Ticket;
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Neues Ticket erstellen
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Grunddaten extrahieren
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const contact = formData.get('contact') as string;
    const date = new Date(formData.get('date') as string);
    const priority = formData.get('priority') as string;
    const assignedUsersData = formData.get('assignedUsers') as string;
    const assignedUsers = safeJsonParse(assignedUsersData, []);

    // Ticket ID generieren
    const ticketId = crypto.randomUUID();

    // Dateien verarbeiten (hier vorerst leer, kann später erweitert werden)
    const files: any[] = [];

    // Ticket-Objekt erstellen
    const ticket: Ticket = {
      id: ticketId,
      subject,
      description,
      contact,
      date,
      status: 'open',
      priority: priority as any,
      assignedUsers,
      files,
      history: [{
        id: crypto.randomUUID(),
        timestamp: new Date(),
        action: 'Ticket erstellt',
        user: 'System',
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Sensible Daten verschlüsseln
    const encryptedData = encryptTicketData({
      subject: ticket.subject,
      description: ticket.description,
      contact: ticket.contact,
    });

    // In Datenbank speichern
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
      JSON.stringify(ticket.assignedUsers),
      JSON.stringify(ticket.files),
      JSON.stringify(ticket.history),
      ticket.createdAt.toISOString(),
      ticket.updatedAt.toISOString(),
    ];

    await db.query(query, values);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 