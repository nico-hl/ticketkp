export type TicketStatus = 'open' | 'in_progress' | 'completed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type AssignedUser = 'nico' | 'finnja';

export interface TicketFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  isImage: boolean;
}

export interface TicketHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  contact: string;
  date: Date;
  status: TicketStatus;
  priority: TicketPriority;
  assignedUsers: AssignedUser[];
  files: TicketFile[];
  history: TicketHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  contact: string;
  date: Date;
  priority: TicketPriority;
  assignedUsers: AssignedUser[];
  files?: File[];
} 