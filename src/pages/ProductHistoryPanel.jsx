import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductHistoryPanel = ({ productId, productName }) => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' 或 'purchases'
  const [salesHistory, setSalesHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);

    // 平行發送請求查詢銷售與進貨歷史
    Promise.all([
      axios.get(`http://localhost:8080/api/v1/products/${productId}/sales-history`),
      axios.get(`http://localhost:8080/api/v1/products/${productId}/purchase-history`)
    ])
    .then(([salesRes, purchaseRes]) => {
      setSalesHistory(salesRes.data || []);
      setPurchaseHistory(purchaseRes.data || []);
    })
    .catch(err => console.error("無法載入歷史價格數據:", err))
    .finally(() => setLoading(false));
  }, [productId]);

  if (!productId) return <div className="text-gray-400">請先選擇商品</div>;

  return (
    <div className="border rounded-lg p-3 bg-gray-50 mt-2 text-sm">
      <div className="font-bold mb-2">📊 【{productName}】歷史行情參考</div>
      
      {/* 頁籤切換 */}
      <div className="flex border-b mb-3">
        <button
          className={`px-3 py-1 mr-2 ${activeTab === 'sales' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('sales')}
        >
          其他客戶銷售紀錄 ({salesHistory.length})
        </button>
        <button
          className={`px-3 py-1 ${activeTab === 'purchases' ? 'border-b-2 border-green-600 font-bold text-green-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('purchases')}
        >
          廠商進貨紀錄 ({purchaseHistory.length})
        </button>
      </div>

      {loading ? (
        <div>載入歷史資料中...</div>
      ) : activeTab === 'sales' ? (
        /* 客戶銷售紀錄表格 */
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-1">銷售日期</th>
              <th className="p-1">客戶名稱</th>
              <th className="p-1">成交單價</th>
              <th className="p-1">數量</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.length === 0 ? (
              <tr><td colSpan="4" className="p-2 text-center text-gray-400">尚無過往銷售紀錄</td></tr>
            ) : (
              salesHistory.map((item, index) => (
                <tr key={index} className="border-b hover:bg-blue-50">
                  <td className="p-1">{item.saleDate}</td>
                  <td className="p-1">{item.customerName || '散客'}</td>
                  <td className="p-1 font-semibold text-blue-600">${item.unitPrice}</td>
                  <td className="p-1">{item.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        /* 廠商進貨紀錄表格 */
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-1">進貨日期</th>
              <th className="p-1">供應商</th>
              <th className="p-1">進貨單價(成本)</th>
              <th className="p-1">進貨數量</th>
            </tr>
          </thead>
          <tbody>
            {purchaseHistory.length === 0 ? (
              <tr><td colSpan="4" className="p-2 text-center text-gray-400">尚無進貨紀錄</td></tr>
            ) : (
              purchaseHistory.map((item, index) => (
                <tr key={index} className="border-b hover:bg-green-50">
                  <td className="p-1">{item.purchaseDate}</td>
                  <td className="p-1">{item.supplierName}</td>
                  <td className="p-1 font-semibold text-green-700">${item.unitPrice}</td>
                  <td className="p-1">{item.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductHistoryPanel;