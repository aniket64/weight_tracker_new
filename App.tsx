import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon, AlertCircle, RefreshCw, Share2, Check } from 'lucide-react';
import { User, WeightEntry } from './types';
import { api } from './services/api';
import { UserManagement } from './components/UserManagement';
import { WeightLog } from './components/WeightLog';
import { Analytics } from './components/Analytics';
import { SettingsModal } from './components/SettingsModal';
import { generateStats, generateInsights } from './utils/calculations';
import { LS_API_KEY, HARDCODED_API_URL } from './constants';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Initialize with hardcoded URL if available, otherwise check localStorage
  const [apiUrl, setApiUrl] = useState(HARDCODED_API_URL || localStorage.getItem(LS_API_KEY));

  // Magic Link Handler: Check URL parameters for shared configuration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const backendParam = params.get('backend');

    if (backendParam && backendParam.includes('script.google.com')) {
      // 1. Save to local storage for future visits
      localStorage.setItem(LS_API_KEY, backendParam);
      // 2. Update state to trigger fetch
      setApiUrl(backendParam);
      // 3. Clean the URL so the user doesn't see the long token
      window.history.replaceState({}, '', window.location.pathname);
      showToast("App Connected Successfully!");
    }
  }, []);

  // Load users on mount
  useEffect(() => {
    if (apiUrl) fetchUsers();
  }, [apiUrl]);

  // Load weights when user changes
  useEffect(() => {
    if (currentUser) {
      fetchWeights(currentUser.user_name);
    } else {
      setWeights([]);
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareApp = () => {
    if (!apiUrl) return;
    
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?backend=${encodeURIComponent(apiUrl)}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("Magic Link Copied to Clipboard!");
    }).catch(() => {
      prompt("Copy this link to open on another device:", shareUrl);
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        setCurrentUser(data[0]);
      }
    } catch (err: any) {
      if (err.message === 'API_URL_MISSING') {
         // handled by UI state
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWeights = async (username: string) => {
    setLoading(true);
    try {
      const data = await api.getWeights(username);
      setWeights(data);
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to fetch weight history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (user: User) => {
    setLoading(true);
    try {
      const created = await api.createUser(user);
      setUsers([...users, created]);
      setCurrentUser(created);
      showToast("Profile Created");
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    setLoading(true);
    try {
      await api.deleteUser(username);
      const remaining = users.filter(u => u.user_name !== username);
      setUsers(remaining);
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
      showToast("Profile Deleted");
    } catch (err) {
      alert("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeight = async (entry: WeightEntry) => {
    setLoading(true);
    try {
      const saved = await api.saveWeight(entry);
      // Optimistic update or refetch
      const otherEntries = weights.filter(w => w.date !== saved.date);
      setWeights([...otherEntries, saved]);
      showToast("Weight Logged");
    } catch (err) {
      alert("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const existingEntryForDate = useMemo(() => {
    return weights.find(w => w.date === selectedDate);
  }, [weights, selectedDate]);

  const stats = useMemo(() => currentUser ? generateStats(weights, currentUser) : null, [weights, currentUser]);
  const insights = useMemo(() => (currentUser && stats) ? generateInsights(stats, currentUser, weights) : [], [stats, currentUser, weights]);

  // View: No API Configured
  if (!apiUrl) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="mb-6 rounded-full bg-teal-100 p-4 text-teal-600">
          <SettingsIcon size={48} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Welcome to Weight Tracker</h1>
        <p className="mb-8 max-w-md text-slate-600">
          To get started, you need to connect this app to your Google Sheet backend.
        </p>
        <button 
          onClick={() => setShowSettings(true)}
          className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
        >
          Connect Google Sheet
        </button>
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          onSave={() => setApiUrl(HARDCODED_API_URL || localStorage.getItem(LS_API_KEY))} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-white shadow-lg animate-fade-in-up">
          <Check size={18} className="text-teal-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <header className="bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">Weight<span className="text-slate-800">Tracker</span></h1>
          
          <div className="flex items-center gap-2">
            {!HARDCODED_API_URL && (
              <>
                <button 
                  onClick={handleShareApp} 
                  className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                  title="Share Magic Link"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">Share / Sync</span>
                </button>
                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-teal-600">
                  <SettingsIcon size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">Connection Failed</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                
                {error.includes("Who has access") && (
                  <div className="mt-3 text-xs text-red-800 bg-white/50 p-2 rounded">
                    <strong>How to fix:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Open your Google Apps Script editor.</li>
                      <li>Click <strong>Deploy</strong> &gt; <strong>Manage Deployments</strong>.</li>
                      <li>Click the <strong>Pencil (Edit)</strong> icon next to your active deployment.</li>
                      <li>Change <strong>Who has access</strong> to <strong>Anyone</strong>.</li>
                      <li>Click <strong>Deploy</strong>.</li>
                    </ol>
                  </div>
                )}

                <div className="mt-3 flex gap-3">
                  <button 
                    onClick={fetchUsers} 
                    className="flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
                  >
                    <SettingsIcon size={12} /> Check URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <UserManagement 
          users={users}
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          onAddUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
          isLoading={loading}
        />

        {currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {stats && <Analytics stats={stats} entries={weights} user={currentUser} insights={insights} />}
            </div>
            
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <WeightLog 
                  username={currentUser.user_name}
                  onSave={handleSaveWeight}
                  isLoading={loading}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  existingEntry={existingEntryForDate}
                />
              </div>
            </div>
          </div>
        )}

        {!currentUser && !loading && !error && users.length === 0 && (
          <div className="mt-12 text-center text-slate-500">
            <p>Create your first profile above to start tracking.</p>
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={() => {
           setApiUrl(HARDCODED_API_URL || localStorage.getItem(LS_API_KEY));
           fetchUsers(); 
        }} 
      />
    </div>
  );
};

export default App;