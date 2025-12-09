import React, { useState } from 'react';
import { LS_API_KEY } from '../constants';
import { Settings as SettingsIcon, Link as LinkIcon, Check, Copy, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState(localStorage.getItem(LS_API_KEY) || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem(LS_API_KEY, url.trim());
    onSave();
    onClose();
  };

  const handleCopyLink = () => {
    if (!url) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?backend=${encodeURIComponent(url.trim())}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
        // Fallback if clipboard fails
        prompt("Copy this link to share access:", shareUrl);
    });
  };

  // Detect if we are in a preview/dev environment
  const isPreview = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1') || 
                    window.location.hostname.includes('googleusercontent') ||
                    window.location.hostname.includes('webcontainer') ||
                    window.location.hostname.includes('stackblitz');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon size={20} />
          App Connection
        </h2>
        
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Google Apps Script URL</label>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste the Web App URL from your Google Apps Script deployment.
          </p>
        </div>

        {/* Share Section - Only shows if a URL is entered */}
        {url && url.includes('script.google.com') && (
          <div className="mb-6 rounded-md bg-indigo-50 p-4 border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <LinkIcon size={16} /> Share Access
            </h3>

            {isPreview && (
              <div className="mb-3 rounded bg-amber-100 p-3 text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
                 <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-700" />
                 <div>
                   <strong>Preview Environment Detected</strong>
                   <p className="mt-1">
                     You are running this app in a private preview. The "Copy Link" below will likely <strong>not work</strong> on other devices (404 Error).
                   </p>
                   <p className="mt-1 font-medium">
                     Please deploy this website to a public host (like Vercel or Netlify) to use it on your phone.
                   </p>
                 </div>
              </div>
            )}
            
            <p className="text-xs text-indigo-700 mb-3">
              To use this app on another device (like your phone), create a magic link that includes this connection key.
            </p>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-2 rounded bg-white border border-indigo-200 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Link Copied!' : 'Copy Connection Link'}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!url}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Save Connection
          </button>
        </div>
      </div>
    </div>
  );
};