import axiosInstance from './axiosInstance'; // 請依據你專案實際的 axios 設定路徑調整

export const backupApi = {
  // 1. 匯出備份 (Export)
  exportBackup: (type) => {
    return axiosInstance.get(`/backup/export/${type}`, {
      responseType: 'blob', // 確保下載二進位檔案 (.xlsx)
    });
  },

  // 2A-1. 商品：還原「系統自身商品備份檔」(標準 11 欄)
  restoreProductsBackup: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/products/backup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2A-2. 商品：匯入「舊系統原始商品報表」(100多欄期初匯入)
  importProductsRaw: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/products/raw', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2B-1. 廠商：還原「系統自身廠商備份檔」
  restoreSuppliersBackup: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/suppliers/backup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2B-2. 廠商：匯入「舊系統原始廠商報表」
  importSuppliersRaw: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/suppliers/raw', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2C-1. 客戶：還原「系統自身客戶備份檔」
  restoreCustomersBackup: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/customers/backup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 2C-2. 客戶：匯入「舊系統原始客戶報表」
  importCustomersRaw: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/customers/raw', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};