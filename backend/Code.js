// --- CONFIGURATION ---
const SCRIPT_PROP = PropertiesService.getScriptProperties();

// --- SETUP ---
function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Users Sheet
  let usersSheet = activeSpreadsheet.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = activeSpreadsheet.insertSheet('Users');
    usersSheet.appendRow(['user_name', 'created_at', 'height_cm', 'target_weight', 'notes']);
  }
  
  // Create Weight_Log Sheet
  let logSheet = activeSpreadsheet.getSheetByName('Weight_Log');
  if (!logSheet) {
    logSheet = activeSpreadsheet.insertSheet('Weight_Log');
    logSheet.appendRow(['user_name', 'date', 'weight_kg', 'note']);
  }
}

// --- API HANDLING ---

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10s to avoid race conditions

  try {
    // 1. Handle Preflight OPTIONS
    if (e.postData && e.postData.type === 'application/x-www-form-urlencoded' && !e.postData.contents) {
         return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
    }

    // 2. Parse Parameters
    const params = e.parameter;
    const action = params.action;
    
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        body = {}; 
      }
    }

    if (!action) {
       throw new Error("Missing 'action' parameter. Check your API request.");
    }

    let result = null;

    switch (action) {
      case 'GET_USERS':
        result = getUsers();
        break;
      case 'CREATE_USER':
        result = createUser(body);
        break;
      case 'DELETE_USER':
        result = deleteUser(body.user_name);
        break;
      case 'GET_WEIGHTS':
        result = getWeights(params.user_name);
        break;
      case 'SAVE_WEIGHT':
        result = saveWeight(body);
        break;
      case 'DELETE_WEIGHT':
        result = deleteWeight(body.user_name, body.date);
        break;
      default:
        throw new Error('Invalid Action: ' + action);
    }

    return responseJson({ success: true, data: result });

  } catch (error) {
    return responseJson({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- HELPER FUNCTIONS ---

function responseJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetOrThrow(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found. Please run "initialSetup" in the Apps Script editor.`);
  }
  return sheet;
}

function getDataFromSheet(sheetName) {
  const sheet = getSheetOrThrow(sheetName);
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return []; // Only headers or empty

  const headers = values.shift(); // Remove headers
  return values.map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

// --- CORE LOGIC ---

function getUsers() {
  return getDataFromSheet('Users');
}

function createUser(user) {
  const sheet = getSheetOrThrow('Users');
  const data = sheet.getDataRange().getValues();
  
  // Check uniqueness
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user.user_name) throw new Error('User already exists');
  }
  
  const newRow = [user.user_name, user.created_at, user.height_cm, user.target_weight, user.notes];
  sheet.appendRow(newRow);
  return user;
}

function deleteUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete from Users
  const userSheet = getSheetOrThrow('Users');
  const uData = userSheet.getDataRange().getValues();
  // Loop backwards
  for (let i = uData.length - 1; i >= 1; i--) {
    if (uData[i][0] === username) userSheet.deleteRow(i + 1);
  }

  // Delete from Weight_Log
  const wSheet = getSheetOrThrow('Weight_Log');
  const wData = wSheet.getDataRange().getValues();
  for (let i = wData.length - 1; i >= 1; i--) {
    if (wData[i][0] === username) wSheet.deleteRow(i + 1);
  }
  return true;
}

function getWeights(username) {
  const allWeights = getDataFromSheet('Weight_Log');
  return allWeights
    .filter(w => w.user_name === username)
    .map(w => {
      let dateStr = w.date;
      if (w.date instanceof Date) {
        dateStr = w.date.toISOString().split('T')[0];
      }
      return {
        ...w,
        date: dateStr
      };
    });
}

function saveWeight(entry) {
  const sheet = getSheetOrThrow('Weight_Log');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const userIdx = headers.indexOf('user_name');
  const dateIdx = headers.indexOf('date');
  
  let rowIndexToUpdate = -1;

  for (let i = data.length - 1; i >= 1; i--) {
    const rowUser = data[i][userIdx];
    let rowDateStr = "";
    if (data[i][dateIdx] instanceof Date) {
        rowDateStr = data[i][dateIdx].toISOString().split('T')[0];
    } else {
        rowDateStr = String(data[i][dateIdx]);
    }
    
    if (rowUser === entry.user_name && rowDateStr === entry.date) {
      rowIndexToUpdate = i + 1;
      break;
    }
  }

  if (rowIndexToUpdate > 0) {
    sheet.getRange(rowIndexToUpdate, 3).setValue(entry.weight_kg);
    sheet.getRange(rowIndexToUpdate, 4).setValue(entry.note);
  } else {
    sheet.appendRow([entry.user_name, entry.date, entry.weight_kg, entry.note]);
  }
  
  return entry;
}

function deleteWeight(username, date) {
  const sheet = getSheetOrThrow('Weight_Log');
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    const rowUser = data[i][0];
    let rowDateStr = "";
    if (data[i][1] instanceof Date) {
      rowDateStr = data[i][1].toISOString().split('T')[0];
    } else {
      rowDateStr = String(data[i][1]);
    }

    if (rowUser === username && rowDateStr === date) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  throw new Error("Entry not found");
}