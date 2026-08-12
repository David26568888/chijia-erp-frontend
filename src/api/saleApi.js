import axiosInstance from './axiosInstance';

export const saleApi = {
  // 1. 取得所有銷貨單列表
  getAllSaleOrders: () => {
    return axiosInstance.get('/sale-orders');
  },

  // 2. 依 ID 查詢單一銷貨單 (含明細)
  getSaleOrderById: (id) => {
    return axiosInstance.get(`/sale-orders/${id}`);
  },

  // 3. 建立銷貨單 (櫃檯 POS 結帳，自動扣減商品庫存)
  createSaleOrder: (createSaleOrderDTO) => {
    return axiosInstance.post('/sale-orders', createSaleOrderDTO);
  },
};