import axiosInstance from './axiosInstance';

export const productApi = {
  // 1. 取得商品列表 (支援關鍵字搜尋；若 keyword 為空則後端傳回所有商品)
  getAllProducts: (keyword = '') => {
    return axiosInstance.get('/products', {
      params: { keyword: keyword ? keyword.trim() : undefined }
    });
  },

  // 2. 依 ID 查詢單一商品
  getProductById: (id) => {
    return axiosInstance.get(`/products/${id}`);
  },

  // 3. 依條碼 (Barcode) 查詢商品 (門市 POS 條碼槍專用)
  getProductByBarcode: (barcode) => {
    return axiosInstance.get(`/products/barcode/${barcode}`);
  },

  // 4. 新增商品 (支援三軌成本)
  createProduct: (productDTO) => {
    return axiosInstance.post('/products', productDTO);
  },

  // 5. 修改商品資料 (更新三軌成本與安全庫存)
  updateProduct: (id, productDTO) => {
    return axiosInstance.put(`/products/${id}`, productDTO);
  },

  // 6. 切換商品上架/停用狀態
  toggleStatus: (id) => {
    return axiosInstance.patch(`/products/${id}/toggle-status`);
  },

  // 7. 批次匯入 Excel 商品資料 (對應 產品資料2026.07.10.xlsx)
  importProductsExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // 💡 8. 新增：取得該商品的進銷歷史紀錄 (進貨廠商/日期/單價/數量 + 銷貨客戶/日期/單價/數量)
  getProductHistory: (id) => axiosInstance.get(`/products/${id}/history`),
};