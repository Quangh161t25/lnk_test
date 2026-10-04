import * as XLSX from 'xlsx';
import { SIMPLE_SHEET_MODULES } from '../config/dataSources';

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(dataRows, filename = 'export.xlsx', sheetName = 'Data') {
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function downloadModuleTemplate(moduleName) {
  let headers = [];
  let sampleRows = [];
  let fileName = `template_${moduleName}.xlsx`;

  if (moduleName === 'cngiasp') {
    headers = ['id', 'ngay_cap_nhat', 'ma_sp', 'ten_sp', 'gia_nhap', 'gia_ban', 'gia_cu', 'chenh_lech', 'nguoi_cap_nhat', 'ghi_chu', 'trang_thai'];
    sampleRows = [
      ['GIA-001', '05/10/2026', 'LM-LK-6201A', 'Chảo cạn Titanium Lock&King 28cm', 120000, 185000, 175000, 10000, 'Kế toán', 'Điều chỉnh giá bán tháng 10', 'Áp dụng']
    ];
  } else if (SIMPLE_SHEET_MODULES[moduleName]) {
    headers = [...SIMPLE_SHEET_MODULES[moduleName].columns];
  } else if (moduleName === 'nhanvien') {
    headers = ['id', 'ho_ten', 'hinh_anh', 'gioi_tinh', 'ngay_sinh', 'quyen', 'mk', 'truong'];
    sampleRows = [
      ['NV001', 'Nguyễn Văn A', '', 'Nam', '1990-01-01', 'KHO', '123456', 'NHÂN VIÊN']
    ];
  } else if (moduleName === 'khachhang') {
    headers = ['id', 'ho_ten', 'hinh_anh', 'gioi_tinh', 'ngay_sinh', 'quyen', 'mk', 'truong'];
    sampleRows = [
      ['KH001', 'Đại lý Miền Bắc', '', '', '', 'NPP', '', 'KHÁCH HÀNG NPP']
    ];
  }

  const exportData = [headers, ...sampleRows];
  exportToExcel(exportData, fileName, 'Template');
}
