import axiosInstance from './axiosInstance'; // 💡 指向已有 /api/v1 baseURL 的 Axios 實例

export const reportApi = {
  // 取得月度財務報表
  getMonthlyReport: (year, month) => {
    return axiosInstance.get('/reports/monthly', { params: { year, month } });
  },

  // 取得商品獲利排行榜
  getTopProfitableProducts: () => {
    return axiosInstance.get('/reports/top-products');
  },

  // 取得熱銷商品排行榜
  getBestSellingProducts: () => {
    return axiosInstance.get('/reports/best-sellers');
  },

  // 取得單筆訂單毛利明細
  getOrderProfit: (orderId) => {
    return axiosInstance.get(`/reports/order/${orderId}/profit`);
  },
};