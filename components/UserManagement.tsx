import React, { useState } from 'react';
import { User } from '../types';
import { Plus, User as UserIcon, Trash2 } from 'lucide-react';

interface Props {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  onAddUser: (user: User) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  isLoading: boolean;
}

export const UserManagement: React.FC<Props> = ({ users, currentUser, onSelectUser, onAddUser, onDeleteUser, isLoading }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.user_name) return;
    
    await onAddUser({
      user_name: newUser.user_name,
      height_cm: newUser.height_cm,
      target_weight: newUser.target_weight,
      created_at: new Date().toISOString(),
      notes: newUser.notes
    });
    setIsAdding(false);
    setNewUser({});
  };

  if (isAdding) {
    return (
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Add New Profile</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500">Name (Unique ID)</label>
            <input 
              required
              className="mt-1 w-full rounded border border-gray-300 p-2"
              value={newUser.user_name || ''}
              onChange={e => setNewUser({...newUser, user_name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Height (cm)</label>
              <input 
                type="number"
                className="mt-1 w-full rounded border border-gray-300 p-2"
                value={newUser.height_cm || ''}
                onChange={e => setNewUser({...newUser, height_cm: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Target Weight (kg)</label>
              <input 
                type="number"
                className="mt-1 w-full rounded border border-gray-300 p-2"
                value={newUser.target_weight || ''}
                onChange={e => setNewUser({...newUser, target_weight: Number(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={isLoading} className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
              {isLoading ? 'Saving...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="bg-teal-100 p-2 rounded-full text-teal-700">
          <UserIcon size={24} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Current Profile</label>
          <select 
            className="mt-1 block w-full sm:w-64 rounded-md border-gray-300 bg-transparent py-1 text-lg font-semibold text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-0"
            value={currentUser?.user_name || ''}
            onChange={(e) => {
              const user = users.find(u => u.user_name === e.target.value);
              if(user) onSelectUser(user);
            }}
          >
            {users.length === 0 && <option>No users found</option>}
            {users.map(u => (
              <option key={u.user_name} value={u.user_name}>{u.user_name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Plus size={16} /> New User
        </button>
        {currentUser && (
          <button
             onClick={() => {
               if(window.confirm(`Delete ${currentUser.user_name} and all data? This cannot be undone.`)) {
                 onDeleteUser(currentUser.user_name);
               }
             }}
             className="flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};