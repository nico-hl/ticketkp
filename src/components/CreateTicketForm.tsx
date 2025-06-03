'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from './ui/DatePicker';
import { FileUpload } from './ui/FileUpload';
import { AlertTriangle, Send, User } from 'lucide-react';
import type { CreateTicketData, TicketPriority, AssignedUser } from '@/types/ticket';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Betreff ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  contact: z.string().min(1, 'Kontakt ist erforderlich'),
  priority: z.enum(['low', 'medium', 'high'] as const),
});

type FormData = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  onSubmit: (data: CreateTicketData) => Promise<void>;
  isLoading?: boolean;
}

// Inline styles für bessere Lesbarkeit
const inputStyle = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  border: '2px solid #d1d5db',
  padding: '12px',
  borderRadius: '12px',
  fontSize: '16px',
  width: '100%',
};

const labelStyle = {
  color: '#374151',
  fontWeight: '600',
  fontSize: '14px',
  marginBottom: '8px',
  display: 'block',
};

const textareaStyle = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  border: '2px solid #d1d5db',
  padding: '12px',
  borderRadius: '12px',
  fontSize: '16px',
  width: '100%',
  minHeight: '120px',
  resize: 'vertical',
};

export function CreateTicketForm({ onSubmit, isLoading = false }: CreateTicketFormProps) {
  const [date, setDate] = useState(new Date());
  const [files, setFiles] = useState<File[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [priority, setPriority] = useState<TicketPriority>('medium');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const handleUserAssignment = (user: AssignedUser, checked: boolean) => {
    if (checked) {
      setAssignedUsers((prev) => [...prev, user]);
    } else {
      setAssignedUsers((prev) => prev.filter((u) => u !== user));
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    const ticketData: CreateTicketData = {
      ...data,
      date,
      priority,
      assignedUsers,
      files,
    };

    await onSubmit(ticketData);
    
    // Reset form
    reset();
    setDate(new Date());
    setFiles([]);
    setAssignedUsers([]);
    setPriority('medium');
  };

  const priorityOptions = [
    { value: 'low' as const, label: 'Niedrig', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'medium' as const, label: 'Normal', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'high' as const, label: 'Hoch', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8" style={{ backgroundColor: '#ffffff', color: '#1e293b' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Neues Ticket erstellen</h2>
        <p className="mt-2" style={{ color: '#4b5563' }}>Alle Felder ausfüllen und Ticket absenden</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Betreff */}
        <div>
          <label style={labelStyle}>
            Betreff
          </label>
          <input
            {...register('subject')}
            type="text"
            style={inputStyle}
            placeholder="Kurze Beschreibung des Problems..."
          />
          {errors.subject && (
            <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>{errors.subject.message}</p>
          )}
        </div>

        {/* Beschreibung */}
        <div>
          <label style={labelStyle}>
            Um was geht es?
          </label>
          <textarea
            {...register('description')}
            style={textareaStyle}
            placeholder="Detaillierte Beschreibung des Problems oder Anliegens..."
          />
          {errors.description && (
            <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>{errors.description.message}</p>
          )}
        </div>

        {/* Kontakt */}
        <div>
          <label style={labelStyle}>
            Kontakt
          </label>
          <input
            {...register('contact')}
            type="text"
            style={inputStyle}
            placeholder="Name, E-Mail oder Telefonnummer..."
          />
          {errors.contact && (
            <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>{errors.contact.message}</p>
          )}
        </div>

        {/* Datum */}
        <div>
          <label style={labelStyle}>
            Datum
          </label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {/* Priorität */}
        <div>
          <label style={labelStyle}>
            Priorität
          </label>
          <div className="grid grid-cols-3 gap-3">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  priority === option.value
                    ? `border-blue-500 ${option.bg}`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                style={{
                  backgroundColor: priority === option.value ? '#f0f9ff' : '#ffffff',
                  color: '#1e293b',
                  border: priority === option.value ? '2px solid #2563eb' : '2px solid #d1d5db'
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  {option.value === 'high' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium" style={{ color: '#1e293b' }}>
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mitarbeiter-Zuweisung */}
        <div>
          <label style={labelStyle}>
            Zuweisung
          </label>
          <div className="space-y-3">
            {(['nico', 'finnja'] as const).map((user) => (
              <label
                key={user}
                className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                style={{ backgroundColor: '#f9fafb', color: '#1e293b' }}
              >
                <input
                  type="checkbox"
                  checked={assignedUsers.includes(user)}
                  onChange={(e) => handleUserAssignment(user, e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-medium capitalize" style={{ color: '#1e293b' }}>
                  {user}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Datei-Upload */}
        <div>
          <label style={labelStyle}>
            Dateien anhängen (optional)
          </label>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            maxFiles={5}
            maxSizeInMB={10}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold transition-colors focus:ring-4 focus:ring-blue-500/20"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span>{isLoading ? 'Wird erstellt...' : 'Ticket erstellen'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 