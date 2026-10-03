import crypto from 'crypto';

const DEFAULT_CONFIG = {
  spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || "1qo4DMUGNd-D7n2hbrRiGIIkR24mArDoKZSeYjdkP8hQ",
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "lnk-773@cty-lnk-161.iam.gserviceaccount.com",
  privateKey: (process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTg5BFj22QViBG\nTyE073/XFsN/Tu0qf9zHmCREpC0V8hMUIG1sh7BhcfEYMpoQy3PK1EKmcVFj33/f\nn8p1KI+4vGrFAJgXLPxlbNmfJA1S2Ru5rMZxamZPiQ+vfCSVbjlyfb019oaDTd55\nTYWxl8QjI7uv+bd8p2aJDCk6fMams96j82kjQG5GObrmDNINtNWXW9S7K32Yndjx\nOcoFe4VFICAau9y2phJFdw1Dh82fa2DMtnJttCeRN+wgQhoH0299XEoyJvGTzBTH\n1hJnwzKiiZHlLNMTAmzqlp+/YZa9kkqBhslKG+w3U0qS6gJA2Qh2yJQCEQYUk5OD\nqDrd2ZmBAgMBAAECggEAJIbhJJ4dE/LHrpSuPaPJnkW0W7kv3GnJ4R8tTjxS++n6\n8PwboYU6SM3CTsU4VYOpGsM2wmMp5Nc9UEtaTYrEbSj+wEg2u7PdX4+hcmnpsh/D\nubg0afQvuHcJQissbzDik1rTEO1is+y/6Y9hcfatXMsoN77meMy4+Jxkx1CyhqmT\ncOowEwASxDkSKN4472OSujg7ECkQY224FlafLbjU5nsRgF2EqfA4Z10e+FGQE6l0\n+E6mD135lUyk/Ug6zjizEdEmHC8+BBfsGJCIYizBFJZ7KjfF5VPbdWHBdw+m0qQr\nMIqfTrfiO7TVs8VqiFv3JEOYKSG6ZM7oAIii7xsGdQKBgQDxqLxd+NPbZFp0OKEU\nAOmNt2CjA/iEmCeNZ8Cjkkn6lWS6q8X9fdWEHAgWJPcnOZA4U3PrZSNFZzrJ9f+b\nVWS5/zynJgAY96YAQoOiTJjnJUlaMTNt+QkEtduFZKOwy1I4Ig9fFwQQBIrlE4rQ\nc39QaYm7Az9JLJAqVwScMYlAPQKBgQDgEN1NOKMUkEbOtLIWWnUWTzCtSChs4AvQ\nbhIivQAMQRcZ4ALtpf1RIJgqHyh2SA3ptGaujJDic61tfTeEUx1NEIFdisFpLIG6\nu88g0KMU/0hJd0yabg/Cgh464Sp2XTeiB3tDd7LwfdUMZFVameiSREAZW/feLbPO\nbmJ/3aFulQKBgCwSScgZiQmJ07U+XqH3SKC/wK/6GWiVFyGCum8aTsOUWzpv+Tux\npy7grdjcBPbyWIrtLUbQuw39NYt/gY4ilKwXEEirdXkYMP37I2aF8Zy2ABqivm5f\n7HUfdVlucSvc6LG0BHmjCOqi6XG9jqNVbPKNTMD+ZpxBtEkEdaLGpfFBAoGAE+bL\nkTlPmtr5vxBjpQKh1bpw62M2W/1Gb1vndnhtEamSYLT57ZvJtTP87/jWgjMCMVjZ\nqfVIRSTbKZdun+019AtcQi+54BqY5zoZOqPtaEcIZ6YWAr113uPpxXcMa3j6IQUj\nGKoAFcZHbxNWVXbIJn2zZ804Zd6PUu2RCCRqW0UCgYEAv5rs4lg2tdIx3zKX67qQ\naFDBvxYriDqUuACpzV9TlZme6tDp+S21BGhwzwl9dcaWjda++lqyBqtkSHZtGAY+\nNf7d7jqgqgiofhYlBTSVo8qU8vVvIlzgzOb+Z3aZPiZHiCu8K4YAJ9Qn5q8Fz1PV\n4b87bpePRsmiNvOiCsTBaRY=\n-----END PRIVATE KEY-----\n").replace(/\\n/g, '\n'),
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
};

let cachedAccessToken = null;
let tokenExpiryTime = 0;

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiryTime - 300000) {
    return cachedAccessToken;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: DEFAULT_CONFIG.serviceAccountEmail,
    scope: DEFAULT_CONFIG.scopes.join(" "),
    aud: DEFAULT_CONFIG.tokenUrl,
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);
  signer.end();
  const signature = signer.sign(DEFAULT_CONFIG.privateKey, "base64url");
  const sJWT = `${signatureInput}.${signature}`;

  const response = await fetch(DEFAULT_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`Google OAuth error: ${JSON.stringify(data)}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiryTime = Date.now() + (data.expires_in * 1000);
  return cachedAccessToken;
}

// Google Sheets API Helpers
async function callSheetFetch(sheetName, range = "A1:Z50000") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_CONFIG.spreadsheetId}/values/${encodedRange}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Sheet fetch failed: HTTP ${response.status} - ${errText}`);
  }

  const data = await response.json();
  let values = data.values || [];

  // SECURITY: If DSNV (Employees/Users) is fetched, ALWAYS sanitize passwords from response!
  if (sheetName.toUpperCase() === 'DSNV' && values.length > 0) {
    const headers = values[0].map(h => (h || '').toString().trim().toLowerCase());
    const passIdx = headers.findIndex(h => h === 'password' || h === 'mat_khau' || h === 'mk');
    const idxToMask = passIdx !== -1 ? passIdx : 6;
    values = values.map((row, rIdx) => {
      if (rIdx === 0) return row;
      const copy = [...row];
      if (copy[idxToMask] !== undefined) copy[idxToMask] = '***'; // Mask password
      return copy;
    });
  }

  return values;
}

async function callSheetUpdate(sheetName, range, values, valueInputOption = "USER_ENTERED") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_CONFIG.spreadsheetId}/values/${encodedRange}?valueInputOption=${valueInputOption}`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Sheet update failed: HTTP ${response.status} - ${errText}`);
  }

  return await response.json();
}

async function callSheetAppend(sheetName, values, valueInputOption = "USER_ENTERED") {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_CONFIG.spreadsheetId}/values/${encodedRange}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Sheet append failed: HTTP ${response.status} - ${errText}`);
  }

  return await response.json();
}

async function callSheetClear(sheetName, range) {
  const token = await getAccessToken();
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_CONFIG.spreadsheetId}/values/${encodedRange}:clear`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Sheet clear failed: HTTP ${response.status} - ${errText}`);
  }

  return await response.json();
}

// Serverless Handler (Vercel Node.js Function)
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = req.query?.action || url.searchParams.get('action') || (req.body && req.body.action);

    // 1. SECURE LOGIN ACTION (Server-side Authentication)
    if (action === 'login') {
      const { id, password } = req.body || {};
      if (!id || !password) {
        return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ ID và mật khẩu.' });
      }

      const normId = (id || '').toString().trim().toLowerCase();
      const normPass = (password || '').toString().trim();

      // Read raw DSNV privately on server
      const token = await getAccessToken();
      const encodedRange = encodeURIComponent(`'DSNV'!A1:H10000`);
      const authUrl = `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_CONFIG.spreadsheetId}/values/${encodedRange}`;
      const authRes = await fetch(authUrl, { headers: { Authorization: `Bearer ${token}` } });
      const authData = await authRes.json();
      const rows = authData.values || [];

      if (rows.length <= 1) {
        return res.status(401).json({ success: false, error: 'Không tìm thấy dữ liệu nhân viên.' });
      }

      const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
      const iId = headers.findIndex(h => h === 'id');
      const iName = headers.findIndex(h => h === 'ho_ten' || h === 'họ tên' || h === 'name' || h === 'ten');
      const iImage = headers.findIndex(h => h === 'hinh_anh');
      const iGender = headers.findIndex(h => h === 'gioi_tinh');
      const iBirthDate = headers.findIndex(h => h === 'ngay_sinh');
      const iRole = headers.findIndex(h => h === 'role' || h === 'quyen');
      const iPass = headers.findIndex(h => h === 'password' || h === 'mat_khau' || h === 'mk');
      const iType = headers.findIndex(h => h === 'truong');

      let matchedUser = null;
      rows.slice(1).forEach((r, idx) => {
        const uId = (iId !== -1 ? r[iId] || '' : r[0] || '').toString().trim();
        const uPass = (iPass !== -1 ? r[iPass] || '' : r[6] || '').toString().trim();

        if (uId.toLowerCase() === normId && uPass === normPass) {
          matchedUser = {
            sheetRow: idx + 2,
            id: uId,
            name: (iName !== -1 ? r[iName] || '' : r[1] || uId).toString().trim(),
            image: (iImage !== -1 ? r[iImage] || '' : r[2] || '').toString().trim(),
            gender: (iGender !== -1 ? r[iGender] || '' : r[3] || '').toString().trim(),
            birthDate: (iBirthDate !== -1 ? r[iBirthDate] || '' : r[4] || '').toString().trim(),
            role: (iRole !== -1 ? r[iRole] || '' : r[5] || 'KHO').toString().trim().toUpperCase(),
            type: (iType !== -1 ? r[iType] || '' : r[7] || 'NHÂN VIÊN').toString().trim()
          };
        }
      });

      if (!matchedUser) {
        return res.status(401).json({ success: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' });
      }

      return res.status(200).json({
        success: true,
        user: matchedUser
      });
    }

    // 2. FETCH SHEET VALUES
    if (action === 'fetch') {
      const sheetName = req.query?.sheet || url.searchParams.get('sheet') || (req.body && req.body.sheet);
      const range = req.query?.range || url.searchParams.get('range') || (req.body && req.body.range) || "A1:Z50000";

      if (!sheetName) {
        return res.status(400).json({ success: false, error: 'Thiếu tên sheet.' });
      }

      const values = await callSheetFetch(sheetName, range);
      return res.status(200).json({ success: true, values });
    }

    // 3. UPDATE SHEET RANGE
    if (action === 'update') {
      const { sheetName, range, values, valueInputOption } = req.body || {};
      if (!sheetName || !range || !values) {
        return res.status(400).json({ success: false, error: 'Thiếu thông số cập nhật.' });
      }

      const result = await callSheetUpdate(sheetName, range, values, valueInputOption);
      return res.status(200).json({ success: true, result });
    }

    // 4. APPEND SHEET ROWS
    if (action === 'append') {
      const { sheetName, values, valueInputOption } = req.body || {};
      if (!sheetName || !values) {
        return res.status(400).json({ success: false, error: 'Thiếu thông số thêm dòng.' });
      }

      const result = await callSheetAppend(sheetName, values, valueInputOption);
      return res.status(200).json({ success: true, result });
    }

    // 5. BATCH CLEAR AND WRITE (e.g. CAI_DAT)
    if (action === 'batchClearAndWrite') {
      const { sheetName, range = "A1:H1000", values, valueInputOption } = req.body || {};
      if (!sheetName || !values) {
        return res.status(400).json({ success: false, error: 'Thiếu thông số ghi sheet.' });
      }

      await callSheetClear(sheetName, range);
      const result = await callSheetUpdate(sheetName, range, values, valueInputOption);
      return res.status(200).json({ success: true, result });
    }

    return res.status(400).json({ success: false, error: `Hành động không hợp lệ: ${action}` });
  } catch (err) {
    console.error("API /api/sheets error:", err);
    return res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý máy chủ' });
  }
}
