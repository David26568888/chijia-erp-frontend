import React from 'react';
import ProductHistoryPanel from './ProductHistoryPanel';

const ProductHistoryModal = ({ isOpen, onClose, productId, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden border">
        {/* Modal 標題列 */}
        <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b">
          <h3 className="font-bold text-gray-800">📊 商品行情速查 - 【{productName}】</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 font-bold text-lg px-2"
          >
            ✕
          </button>
        </div>

        {/* 行情面板內容 */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <ProductHistoryPanel productId={productId} productName={productName} />
        </div>

        {/* 底部關閉按鈕 */}
        <div className="bg-gray-50 px-4 py-2 text-right border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHistoryModal;