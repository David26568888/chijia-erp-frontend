import axiosInstance from './axiosInstance';

export const customerApi = {
  // 1. 取得所有客戶列表
  getAllCustomers: () => {
    return axiosInstance.get('/customers');
  },

  // 2. 依 ID 查詢單一客戶
  getCustomerById: (id) => {
    return axiosInstance.get(`/customers/${id}`);
  },

  // 3. 新增客戶
  createCustomer: (customerDTO) => {
    return axiosInstance.post('/customers', customerDTO);
  },

  // 4. 修改客戶資料
  updateCustomer: (id, customerDTO) => {
    return axiosInstance.put(`/customers/${id}`, customerDTO);
  },

  // 5. 切換客戶啟用/停用狀態
  toggleStatus: (id) => {
    return axiosInstance.patch(`/customers/${id}/toggle-status`);
  },

  // 6. 批次匯入客戶資料 Excel (解析 bcust 分頁)
  importCustomersExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};