/**
 * Client-Side Google Sheets Proxy Service
 * Communicates with /api/sheets serverless backend to keep credentials & raw sheets 100% hidden from DevTools
 */

export async function loginWithServerAuth(id, password) {
  const response = await fetch('/api/sheets?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', id, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Tài khoản hoặc mật khẩu không chính xác!');
  }

  return data;
}

export async function fetchSheetValues(sheetName, range = "A1:Z50000") {
  const encodedSheet = encodeURIComponent(sheetName);
  const encodedRange = encodeURIComponent(range);
  const url = `/api/sheets?action=fetch&sheet=${encodedSheet}&range=${encodedRange}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch sheet ${sheetName}: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.values || [];
}

export async function updateSheetRange(sheetName, range, values, valueInputOption = "USER_ENTERED") {
  const response = await fetch('/api/sheets?action=update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      sheetName,
      range,
      values,
      valueInputOption
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update sheet ${sheetName}!${range}: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function appendSheetValues(sheetName, values, valueInputOption = "USER_ENTERED") {
  const response = await fetch('/api/sheets?action=append', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'append',
      sheetName,
      values,
      valueInputOption
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to append rows to ${sheetName}: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function batchClearAndWriteSheet(sheetName, range, values, valueInputOption = "USER_ENTERED") {
  const response = await fetch('/api/sheets?action=batchClearAndWrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batchClearAndWrite',
      sheetName,
      range,
      values,
      valueInputOption
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to write sheet ${sheetName}!${range}: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}
