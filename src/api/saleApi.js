import axiosInstance from './axiosInstance';

export const saleApi = {
  // 1. 取得銷貨單列表 (支援關鍵字與日期篩選)
  getAllSaleOrders: (params = {}) => {
    return axiosInstance.get('/sale-orders', { params });
  },

  // 2. 依 ID 取得單一銷貨單明細
  getSaleOrderById: (id) => {
    return axiosInstance.get(`/sale-orders/${id}`);
  },

  // 3. 新增銷貨單 (POS 快速開單)
  createSaleOrder: (data) => {
    return axiosInstance.post('/sale-orders', data);
  },

  // 4. 修改銷貨單
  updateSaleOrder: (id, data) => {
    return axiosInstance.put(`/sale-orders/${id}`, data);
  },

  // 5. 作廢/刪除銷貨單
  deleteSaleOrder: (id) => {
    return axiosInstance.delete(`/sale-orders/${id}`);
  },

  // 💡 新增：查詢客戶與商品的歷史建議售價[cite: 4]
  getSuggestedPrice: (customerId, productId) => 
    axiosInstance.get('/sale-orders/suggest-price', { params: { customerId, productId } }),
};