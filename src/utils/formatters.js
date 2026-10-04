export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '0';
  const val = Number(num);
  if (Number.isNaN(val)) return '0';
  return val.toLocaleString('vi-VN');
}

export function formatCurrency(num) {
  if (num === null || num === undefined || num === '') return '0 ₫';
  const val = Number(num);
  if (Number.isNaN(val)) return '0 ₫';
  return val.toLocaleString('vi-VN') + ' ₫';
}

export function cleanNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/,/g, '').replace(/\./g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

export function parseSimpleSheetDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  if (dateStr instanceof Date) return dateStr;
  
  const s = dateStr.toString().trim();
  
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const parts = s.split('T')[0].split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  
  // Format DD/MM/YYYY or DD-MM-YYYY
  const parts = s.split(/[\/\-]/);
  if (parts.length >= 3) {
    let d = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1;
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  }
  
  const ts = Date.parse(s);
  return Number.isNaN(ts) ? new Date(NaN) : new Date(ts);
}

export function formatDateVN(dateVal) {
  if (!dateVal) return '';
  const d = parseSimpleSheetDate(dateVal);
  if (Number.isNaN(d.getTime())) return dateVal.toString();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateInput(dateVal) {
  if (!dateVal) return '';
  const d = parseSimpleSheetDate(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

export function normalizeLoginValue(val) {
  return (val || '').toString().trim();
}

export function normalizeWarehouseProductKey(kho, idSp) {
  return `${(kho || '').toString().trim().toUpperCase()}|${(idSp || '').toString().trim().toUpperCase()}`;
}

export function generateRandomOrderId(prefix = 'DH') {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function removeVietnameseTones(str) {
  if (!str) return '';
  let s = str.toString().toLowerCase();
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(text, query) {
  if (!query) return true;
  if (!text) return false;
  const rawText = text.toString().toLowerCase();
  const rawQuery = query.toString().toLowerCase().trim();
  if (rawText.includes(rawQuery)) return true;

  // Compare without spaces, hyphens, and punctuation
  const strippedText = rawText.replace(/[-_.,/\s()]/g, '');
  const strippedQuery = rawQuery.replace(/[-_.,/\s()]/g, '');
  if (strippedQuery && strippedText.includes(strippedQuery)) return true;

  // Compare Vietnamese unaccented
  const noToneText = removeVietnameseTones(rawText);
  const noToneQuery = removeVietnameseTones(rawQuery);
  if (noToneText.includes(noToneQuery)) return true;
  if (noToneQuery && noToneText.replace(/[-_.,/\s()]/g, '').includes(noToneQuery.replace(/[-_.,/\s()]/g, ''))) return true;

  return false;
}
