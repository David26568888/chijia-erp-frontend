import axiosInstance from './axiosInstance';

export const purchaseApi = {
  // 1. 取得進貨單列表 (支援關鍵字與日期篩選)
  getAllPurchaseOrders: (params = {}) => {
    return axiosInstance.get('/purchase-orders', { params });
  },

  // 2. 依 ID 取得單一進貨單明細
  getPurchaseOrderById: (id) => {
    return axiosInstance.get(`/purchase-orders/${id}`);
  },

  // 3. 新增進貨單
  createPurchaseOrder: (data) => {
    return axiosInstance.post('/purchase-orders', data);
  },

  // 4. 修改進貨单
  updatePurchaseOrder: (id, data) => {
    return axiosInstance.put(`/purchase-orders/${id}`, data);
  },

  // 5. 作廢/刪除進貨單
  deletePurchaseOrder: (id) => {
    return axiosInstance.delete(`/purchase-orders/${id}`);
  },
};