import axiosInstance from './axiosInstance';

export const backupApi = {
  // 1. 下載匯出備份檔
  exportBackup: (type) => {
    return axiosInstance.get(`/backup/export/${type}`, {
      responseType: 'blob', // 必須設為 blob 才能正確接收流式二進位檔案
    });
  },

  // 2. 匯入商品還原檔
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/backup/import/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};