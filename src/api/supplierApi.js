import axiosInstance from './axiosInstance';

export const supplierApi = {
  // 1. 取得所有廠商列表
  getAllSuppliers: () => {
    return axiosInstance.get('/suppliers');
  },

  // 2. 依 ID 查詢單一廠商
  getSupplierById: (id) => {
    return axiosInstance.get(`/suppliers/${id}`);
  },

  // 3. 新增廠商
  createSupplier: (supplierDTO) => {
    return axiosInstance.post('/suppliers', supplierDTO);
  },

  // 4. 修改廠商資料
  updateSupplier: (id, supplierDTO) => {
    return axiosInstance.put(`/suppliers/${id}`, supplierDTO);
  },

  // 5. 切換廠商啟用/停用狀態
  toggleStatus: (id) => {
    return axiosInstance.patch(`/suppliers/${id}/toggle-status`);
  },

  // 6. 上傳 Excel 批次匯入廠商資料 (解析 bsupp 分頁)
  importSuppliersExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/suppliers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};