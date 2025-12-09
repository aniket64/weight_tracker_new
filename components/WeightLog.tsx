import React, { useState, useEffect } from 'react';
import { WeightEntry } from '../types';
import { Save, Calendar } from 'lucide-react';

interface Props {
  onSave: (entry: WeightEntry) => Promise<void>;
  isLoading: boolean;
  selectedDate: string;
  existingEntry?: WeightEntry; // If entry exists for selected date
  onDateChange: (date: string) => void;
  username: string;
}

export const WeightLog: React.FC<Props> = ({ onSave, isLoading, selectedDate, existingEntry, onDateChange, username }) => {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  // Update form when date or existing entry changes
  useEffect(() => {
    if (existingEntry) {
      setWeight(existingEntry.weight_kg.toString());
      setNote(existingEntry.note || '');
    } else {
      setWeight('');
      setNote('');
    }
  }, [existingEntry, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    await onSave({
      user_name: username,
      date: selectedDate,
      weight_kg: parseFloat(weight),
      note
    });
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
      <h3 className="mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
        <Calendar className="text-teal-600" size={20}/> 
        Log Weight
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weight (kg)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <span className="absolute right-3 top-2 text-sm text-slate-400">kg</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g., Post-workout, heavy dinner..."
            className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !weight}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:bg-teal-300"
        >
          <Save size={18} />
          {existingEntry ? 'Update Entry' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
};