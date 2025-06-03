import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import type { TicketStatus } from '@/types/ticket';

// PUT /api/tickets/[id] - Ticket-Status aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const ticketId = params.id;

    // Aktuelles Ticket für History holen
    const currentQuery = 'SELECT history FROM tickets WHERE id = $1';
    const currentResult = await db.query(currentQuery, [ticketId]);
    
    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update ticket status:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket status' },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Ticket löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    
    const query = 'DELETE FROM tickets WHERE id = $1';
    await db.query(query, [ticketId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}

// Helper function für Status Labels
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