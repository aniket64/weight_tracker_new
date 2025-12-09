import { ApiResponse, User, WeightEntry } from '../types';
import { LS_API_KEY, HARDCODED_API_URL } from '../constants';

const getApiUrl = () => {
  if (HARDCODED_API_URL && HARDCODED_API_URL.trim() !== "") {
    return HARDCODED_API_URL.trim();
  }
  return localStorage.getItem(LS_API_KEY) || '';
};

/**
 * Helper to handle API requests.
 * Uses GET for fetching data (to avoid CORS preflight issues)
 * Uses POST for modifying data
 */
const request = async <T>(action: string, method: 'GET' | 'POST', payload: any = {}): Promise<T> => {
  let baseUrl = getApiUrl();
  if (!baseUrl) {
    throw new Error("API_URL_MISSING");
  }
  
  // Basic URL Validation
  if (!baseUrl.includes('script.google.com')) {
    throw new Error("Invalid URL: Must be a Google Apps Script URL.");
  }
  if (baseUrl.includes('/edit')) {
     throw new Error("Invalid URL: Ends in /edit. Use the /exec URL from Deploy > Web App.");
  }

  // Build the URL with the action parameter
  const urlObj = new URL(baseUrl);
  urlObj.searchParams.append('action', action);

  const options: RequestInit = {
    method: method,
  };

  if (method === 'GET') {
    // For GET, add payload params to the URL
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined && payload[key] !== null) {
        urlObj.searchParams.append(key, String(payload[key]));
      }
    });
    // Add cache buster
    urlObj.searchParams.append('_t', new Date().getTime().toString());
  } else {
    // For POST, send data in body with text/plain to skip preflight
    options.headers = {
      'Content-Type': 'text/plain;charset=utf-8', 
    };
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(urlObj.toString(), options);

    if (!response.ok) {
       throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let json: any;
    
    // 1. Try to parse JSON
    try {
        // Specific check for default GAS response
        if (text.includes("API Connected Successfully")) {
           throw new Error("SETUP_INCOMPLETE");
        }
        json = JSON.parse(text);
    } catch (e: any) {
        if (e.message === "SETUP_INCOMPLETE") {
            throw new Error("Backend Setup Incomplete: You need to copy the code from 'backend/Code.js' into your Google Apps Script editor and Deploy a New Version.");
        }
        
        // If parsing failed, check if it's an HTML error page
        if (text.trim().startsWith('<')) {
          console.error("Received HTML response:", text.substring(0, 200));
          if (text.includes('Google Accounts') || text.includes('Sign in')) {
             throw new Error("Auth Error: Script is redirecting to login. In Apps Script, set 'Who has access' to 'Anyone'.");
          }
          throw new Error("Connection Error: API returned HTML. Check your URL and deployment permissions.");
        }
        
        console.error("Invalid JSON:", text.substring(0, 100));
        throw new Error("Invalid Response: The server returned text instead of JSON. Ensure you have deployed the correct code.");
    }

    // 2. Check Logical Success
    if (!json.success) {
        throw new Error(json.message || 'Unknown API Error');
    }

    return json.data as T;

  } catch (error: any) {
    // Handle "Failed to fetch" which is usually CORS or Network
    if (error.message === 'Failed to fetch') {
      throw new Error("Network Error: Could not connect to Google Sheets. 1) Check your internet. 2) Ensure the Script URL is correct. 3) Ensure 'Who has access' is 'Anyone'.");
    }
    throw error;
  }
};

export const api = {
  // READS -> GET
  getUsers: () => request<User[]>('GET_USERS', 'GET'),
  getWeights: (user_name: string) => request<WeightEntry[]>('GET_WEIGHTS', 'GET', { user_name }),
  
  // WRITES -> POST
  createUser: (user: User) => request<User>('CREATE_USER', 'POST', user),
  deleteUser: (user_name: string) => request<void>('DELETE_USER', 'POST', { user_name }),
  saveWeight: (entry: WeightEntry) => request<WeightEntry>('SAVE_WEIGHT', 'POST', entry),
  deleteWeight: (user_name: string, date: string) => request<void>('DELETE_WEIGHT', 'POST', { user_name, date }),
};