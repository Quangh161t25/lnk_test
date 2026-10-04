import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config/constants';
import { SIMPLE_SHEET_MODULES } from '../config/dataSources';
import { fetchSheetValues, updateSheetRange, appendSheetValues } from '../services/googleSheetsService';
import { parseCaiDatRows, saveCaiDatToGoogleSheet, buildCaiDatRows } from '../services/caiDatService';
import { getLocalItem, setLocalItem, STORAGE_KEYS } from '../utils/storage';
import { cleanNumber, normalizeLoginValue } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { updateUsers, applyParsedPermissions } = useAuth();
  const { applyParsedSettings } = useSettings();

  const [nhapData, setNhapData] = useState(() => getLocalItem(STORAGE_KEYS.NHAP_CACHE, []));
  const [dukienData, setDukienData] = useState(() => getLocalItem(STORAGE_KEYS.DUKIEN_CACHE, []));
  const [xuatData, setXuatData] = useState(() => getLocalItem(STORAGE_KEYS.XUAT_CACHE, []));
  const [transferData, setTransferData] = useState(() => getLocalItem(STORAGE_KEYS.TRANSFER_CACHE, []));
  const [productData, setProductData] = useState(() => getLocalItem(STORAGE_KEYS.PRODUCT_CACHE, []));
  const [warehouseProductData, setWarehouseProductData] = useState(() => getLocalItem(STORAGE_KEYS.WAREHOUSE_PRODUCT_CACHE, []));
  const [tonNppData, setTonNppData] = useState(() => getLocalItem(STORAGE_KEYS.TON_NPP_CACHE, []));
  const [doisoatData, setDoisoatData] = useState(() => getLocalItem(STORAGE_KEYS.RECONCILIATION_CACHE, []));
  const [caidatData, setCaidatData] = useState(() => getLocalItem(STORAGE_KEYS.CAIDAT_CACHE, []));

  const [loadingModules, setLoadingModules] = useState({});
  const [syncStatus, setSyncStatus] = useState('IDLE'); // 'IDLE' | 'SYNCING' | 'ERROR' | 'SUCCESS'
  const [lastSyncedTime, setLastSyncedTime] = useState(() => new Date());

  // Set module data helper
  const setModuleData = (moduleName, data) => {
    switch (moduleName) {
      case 'nhap':
        setNhapData(data);
        setLocalItem(STORAGE_KEYS.NHAP_CACHE, data);
        break;
      case 'dukien':
        setDukienData(data);
        setLocalItem(STORAGE_KEYS.DUKIEN_CACHE, data);
        break;
      case 'xuat':
        setXuatData(data);
        setLocalItem(STORAGE_KEYS.XUAT_CACHE, data);
        break;
      case 'chuyenkho':
        setTransferData(data);
        setLocalItem(STORAGE_KEYS.TRANSFER_CACHE, data);
        break;
      case 'sanpham':
        setProductData(data);
        setLocalItem(STORAGE_KEYS.PRODUCT_CACHE, data);
        break;
      case 'sanphamkho':
        setWarehouseProductData(data);
        setLocalItem(STORAGE_KEYS.WAREHOUSE_PRODUCT_CACHE, data);
        break;
      case 'ton_npp':
        setTonNppData(data);
        setLocalItem(STORAGE_KEYS.TON_NPP_CACHE, data);
        break;
      case 'doisoat':
        setDoisoatData(data);
        setLocalItem(STORAGE_KEYS.RECONCILIATION_CACHE, data);
        break;
      case 'caidat':
        setCaidatData(data);
        setLocalItem(STORAGE_KEYS.CAIDAT_CACHE, data);
        break;
      default:
        break;
    }
  };

  const getModuleData = (moduleName) => {
    switch (moduleName) {
      case 'nhap': return nhapData;
      case 'dukien': return dukienData;
      case 'xuat': return xuatData;
      case 'chuyenkho': return transferData;
      case 'sanpham': return productData;
      case 'sanphamkho': return warehouseProductData;
      case 'ton_npp': return tonNppData;
      case 'doisoat': return doisoatData;
      case 'caidat': return caidatData;
      default: return [];
    }
  };

  // Fetch DSNV Users Data
  const fetchUsersData = useCallback(async () => {
    try {
      const rows = await fetchSheetValues(CONFIG.authSheetName, 'A1:H10000');
      if (rows && rows.length > 1) {
        const headers = rows[0].map(h => (h || '').toString().trim().toLowerCase());
        const iId = headers.findIndex(h => h === 'id');
        const iName = headers.findIndex(h => h === 'ho_ten' || h === 'họ tên' || h === 'name' || h === 'ten');
        const iImage = headers.findIndex(h => h === 'hinh_anh');
        const iGender = headers.findIndex(h => h === 'gioi_tinh');
        const iBirthDate = headers.findIndex(h => h === 'ngay_sinh');
        const iPass = headers.findIndex(h => h === 'password' || h === 'mat_khau' || h === 'mk');
        const iRole = headers.findIndex(h => h === 'role' || h === 'quyen');
        const iType = headers.findIndex(h => h === 'truong');

        const parsedUsers = rows.slice(1).map((r, index) => ({
          sheetRow: index + 2,
          id: normalizeLoginValue(iId !== -1 ? r[iId] : r[0]),
          name: normalizeLoginValue(iName !== -1 ? r[iName] : r[1]),
          image: normalizeLoginValue(iImage !== -1 ? r[iImage] : r[2]),
          gender: normalizeLoginValue(iGender !== -1 ? r[iGender] : r[3]),
          birthDate: normalizeLoginValue(iBirthDate !== -1 ? r[iBirthDate] : r[4]),
          role: normalizeLoginValue(iRole !== -1 ? r[iRole] : r[5]),
          password: '', // Masked for security
          type: normalizeLoginValue(iType !== -1 ? r[iType] : r[7])
        })).filter(u => u.id);

        updateUsers(parsedUsers);
        return parsedUsers;
      }
      return [];
    } catch (err) {
      console.error("fetchUsersData error:", err);
      return [];
    }
  }, [updateUsers]);

  // Fetch Module Data
  const fetchModule = useCallback(async (moduleName) => {
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!config) return [];

    setLoadingModules(prev => ({ ...prev, [moduleName]: true }));
    try {
      const sheetName = config.sheetName();
      const rows = await fetchSheetValues(sheetName, config.range);
      setModuleData(moduleName, rows);
      setLastSyncedTime(new Date());

      // If CAI_DAT is fetched, apply parsed values to settings and permissions
      if (moduleName === 'caidat' && rows && rows.length > 1) {
        const parsed = parseCaiDatRows(rows);
        if (parsed) {
          if (parsed.settings && applyParsedSettings) applyParsedSettings(parsed.settings);
          if (parsed.permissions && applyParsedPermissions) applyParsedPermissions(parsed.permissions);
        }
      }

      return rows;
    } catch (err) {
      console.error(`Fetch ${moduleName} failed:`, err);
      return getModuleData(moduleName);
    } finally {
      setLoadingModules(prev => ({ ...prev, [moduleName]: false }));
    }
  }, [applyParsedSettings, applyParsedPermissions]);

  // Fetch Essential System Configuration (Home only needs system settings/permissions; business sheets lazy-load on navigation)
  const fetchAllData = useCallback(async () => {
    setSyncStatus('SYNCING');
    try {
      await fetchModule('caidat');
      setSyncStatus('SUCCESS');
      setLastSyncedTime(new Date());
    } catch (err) {
      setSyncStatus('ERROR');
      console.error("fetchAllData error:", err);
    }
  }, [fetchModule]);

  // Append multiple rows to a module
  const appendRows = async (moduleName, rowsArray) => {
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!config || !rowsArray || rowsArray.length === 0) return;

    const sheetName = config.sheetName();
    await appendSheetValues(sheetName, rowsArray);
    
    // Update local state
    const current = getModuleData(moduleName);
    const updated = [...current, ...rowsArray];
    setModuleData(moduleName, updated);
  };

  // Append new row to a module
  const appendRow = async (moduleName, rowValues) => {
    await appendRows(moduleName, [rowValues]);
  };

  // Update existing row in a module
  const updateRow = async (moduleName, sheetRowIndex, rowValues) => {
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!config || !sheetRowIndex || sheetRowIndex < 1) return;

    const sheetName = config.sheetName();
    const range = `A${sheetRowIndex}:Z${sheetRowIndex}`;
    await updateSheetRange(sheetName, range, [rowValues]);

    // Update local state
    const current = getModuleData(moduleName);
    const updated = [...current];
    if (updated[sheetRowIndex - 1]) {
      updated[sheetRowIndex - 1] = rowValues;
      setModuleData(moduleName, updated);
    }
  };

  // Delete / Clear a row in a module
  const deleteRow = async (moduleName, sheetRowIndex) => {
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!config || !sheetRowIndex || sheetRowIndex < 1) return;

    const sheetName = config.sheetName();
    const range = `A${sheetRowIndex}:Z${sheetRowIndex}`;
    const emptyRow = new Array(26).fill('');
    await updateSheetRange(sheetName, range, [emptyRow]);

    const current = getModuleData(moduleName);
    const updated = [...current];
    if (updated[sheetRowIndex - 1]) {
      updated[sheetRowIndex - 1] = emptyRow;
      setModuleData(moduleName, updated);
    }
  };

  // Delete an entire order by MDH
  const deleteOrder = async (moduleName, mdh) => {
    const current = getModuleData(moduleName);
    if (!current || !mdh) return;
    const targetMdh = mdh.toString().trim().toLowerCase();
    
    const rowsToDelete = [];
    current.slice(1).forEach((row, idx) => {
      const rowMdh = (row[3] || '').toString().trim().toLowerCase();
      if (rowMdh === targetMdh) {
        rowsToDelete.push(idx + 2);
      }
    });

    for (const sheetRow of rowsToDelete) {
      await deleteRow(moduleName, sheetRow);
    }
    await fetchModule(moduleName);
  };

  // Delete user from DSNV
  const deleteUser = async (sheetRow) => {
    const sheetName = CONFIG.authSheetName;
    if (!sheetRow || sheetRow < 2) return;
    const range = `A${sheetRow}:H${sheetRow}`;
    const emptyRow = new Array(8).fill('');
    await updateSheetRange(sheetName, range, [emptyRow]);
    await fetchUsersData();
  };

  // Upsert user in DSNV
  const upsertUser = async (userData) => {
    const sheetName = CONFIG.authSheetName;
    const rowValues = [
      userData.id || '',
      userData.name || userData.ho_ten || '',
      userData.image || userData.hinh_anh || '',
      userData.gender || userData.gioi_tinh || '',
      userData.birthDate || userData.ngay_sinh || '',
      userData.role || userData.quyen || '',
      userData.password || userData.mk || '',
      userData.type || userData.truong || 'NHÂN VIÊN'
    ];

    if (userData.sheetRow && userData.sheetRow > 1) {
      const range = `A${userData.sheetRow}:H${userData.sheetRow}`;
      await updateSheetRange(sheetName, range, [rowValues]);
    } else {
      await appendSheetValues(sheetName, [rowValues]);
    }

    await fetchUsersData();
  };

  // Product helper maps
  const getProductMap = useCallback(() => {
    const map = new Map();
    (productData || []).slice(1).forEach(row => {
      const id = (row[0] || '').toString().trim();
      if (!id) return;
      map.set(id.toLowerCase(), {
        id,
        name: (row[1] || '').toString().trim(),
        model: (row[2] || '').toString().trim(),
        image: (row[3] || '').toString().trim(),
        price: cleanNumber(row[4]),
        note: (row[5] || '').toString().trim()
      });
    });
    return map;
  }, [productData]);

  const getProductNameById = useCallback((id) => {
    if (!id) return '';
    const found = getProductMap().get(id.toString().trim().toLowerCase());
    return found ? found.name : id;
  }, [getProductMap]);

  return (
    <DataContext.Provider
      value={{
        nhapData,
        dukienData,
        xuatData,
        transferData,
        productData,
        warehouseProductData,
        tonNppData,
        doisoatData,
        caidatData,
        loadingModules,
        syncStatus,
        lastSyncedTime,
        setModuleData,
        getModuleData,
        fetchUsersData,
        fetchModule,
        fetchAllData,
        appendRow,
        appendRows,
        updateRow,
        deleteRow,
        deleteOrder,
        upsertUser,
        deleteUser,
        getProductMap,
        getProductNameById
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
