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
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Neues Ticket erstellen</h2>
        <p className="text-gray-600 mt-2">Alle Felder ausfüllen und Ticket absenden</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Betreff */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Betreff
          </label>
          <input
            {...register('subject')}
            type="text"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Kurze Beschreibung des Problems..."
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
          )}
        </div>

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Um was geht es?
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Detaillierte Beschreibung des Problems oder Anliegens..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Kontakt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kontakt
          </label>
          <input
            {...register('contact')}
            type="text"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Name, E-Mail oder Telefonnummer..."
          />
          {errors.contact && (
            <p className="mt-1 text-sm text-red-600">{errors.contact.message}</p>
          )}
        </div>

        {/* Datum */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datum
          </label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        {/* Priorität */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
              >
                <div className="flex items-center justify-center space-x-2">
                  {option.value === 'high' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    priority === option.value ? option.color : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mitarbeiter-Zuweisung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Zuweisung
          </label>
          <div className="space-y-3">
            {(['nico', 'finnja'] as const).map((user) => (
              <label
                key={user}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={assignedUsers.includes(user)}
                  onChange={(e) => handleUserAssignment(user, e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900 capitalize">
                  {user}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Datei-Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dateien & Bilder
          </label>
          <FileUpload onFilesChange={setFiles} />
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading || assignedUsers.length === 0}
            className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Ticket absenden</span>
              </>
            )}
          </button>
          
          {assignedUsers.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 text-center">
              Bitte mindestens einen Mitarbeiter zuweisen
            </p>
          )}
        </div>
      </form>
    </div>
  );
} 