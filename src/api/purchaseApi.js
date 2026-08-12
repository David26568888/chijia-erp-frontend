import axiosInstance from './axiosInstance';

export const purchaseApi = {
  // 1. 取得所有進貨單列表
  getAllPurchaseOrders: () => {
    return axiosInstance.get('/purchase-orders');
  },

  // 2. 依 ID 查詢單一進貨單 (包含明細項目)
  getPurchaseOrderById: (id) => {
    return axiosInstance.get(`/purchase-orders/${id}`);
  },

  // 3. 建立新進貨單 (會同步扣抵庫存、更新最後進價與移動加權平均成本)
  createPurchaseOrder: (createPurchaseOrderDTO) => {
    return axiosInstance.post('/purchase-orders', createPurchaseOrderDTO);
  },
};