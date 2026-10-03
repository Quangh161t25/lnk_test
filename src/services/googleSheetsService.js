import { KJUR } from 'jsrsasign';
import { CONFIG } from '../config/constants.js';

let cachedAccessToken = null;
let tokenExpiryTime = 0;

export async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiryTime - 300000) {
    return cachedAccessToken;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: CONFIG.serviceAccountEmail,
    scope: CONFIG.scopes.join(" "),
    aud: CONFIG.tokenUrl,
    exp: now + 3600,
    iat: now
  };

  try {
    const sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(payload), CONFIG.privateKey);
    const response = await fetch(CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) {
      throw new Error(`Token request failed: HTTP ${response.status} - ${JSON.stringify(data)}`);
    }
    cachedAccessToken = data.access_token;
    tokenExpiryTime = Date.now() + (data.expires_in * 1000);
    return cachedAccessToken;
  } catch (err) {
    console.error("Google Sheets Auth Error:", err);
    throw new Error("Không thể xác thực với Google API: " + (err.message || err));
  }
}

export async function fetchSheetValues(sheetName, range = "A1:Z50000") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${encodedRange}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${sheetName}: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data.values || [];
}

export async function updateSheetRange(sheetName, range, values, valueInputOption = "USER_ENTERED") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${encodedRange}?valueInputOption=${valueInputOption}`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to update sheet range ${sheetName}!${range}: HTTP ${response.status} ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

export async function appendSheetValues(sheetName, values, valueInputOption = "USER_ENTERED") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${encodedRange}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to append rows to ${sheetName}: HTTP ${response.status} ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

export async function batchClearAndWriteSheet(sheetName, range, values, valueInputOption = "USER_ENTERED") {
  const token = await getAccessToken();
  
  // 1. Clear range
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${encodedRange}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  // 2. Write new values
  if (values && values.length > 0) {
    return await updateSheetRange(sheetName, range, values, valueInputOption);
  }
}
