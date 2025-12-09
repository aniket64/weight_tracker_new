// --- CONFIGURATION ---

// [CRITICAL STEP FOR DEPLOYMENT]
// Paste your Google Apps Script Web App URL here inside the quotes.
// If you leave this empty, you must manually connect via the Settings menu.
// If you fill this in, the app will work instantly on any device you share it with.
//
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"
export const HARDCODED_API_URL: string = "https://script.google.com/macros/s/AKfycbxwNTjbIjyLEEcHaRfzJF5K0X-qFszqdERtNsxdNBNTwiaC8PPyXQeSSev3IbLvHDl-xA/exec"; 

// Internal configuration for local storage fallback
export const LS_API_KEY = 'weight_tracker_api_url';

export const COLORS = {
  primary: '#0d9488', // Teal 600
  secondary: '#64748b', // Slate 500
  success: '#10b981', // Emerald 500
  danger: '#ef4444', // Red 500
  warning: '#f59e0b', // Amber 500
};