'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-5 w-5 text-gray-500" />
        <span className="text-gray-900 font-medium">
          {format(value, 'dd.MM.yyyy')}
        </span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <input
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              colorScheme: 'light',
              WebkitAppearance: 'none',
            }}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Fertig
          </button>
        </div>
      )}
    </div>
  );
} 