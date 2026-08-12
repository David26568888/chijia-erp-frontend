import axios from 'axios';

// 💡 建立統一的 Axios 連線實例，對接 Spring Boot 後端 API
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Spring Boot API 根路徑
    timeout: 10000,                          // 設定請求超時時間（10秒）
    headers: {
        'Content-Type': 'application/json',
    },
});

// 💡 回應攔截器 (Response Interceptor)
axiosInstance.interceptors.response.use(
    (response) => {
        const res = response.data;

        // 如果後端有傳回 ApiResponse 結構 (包含 success 欄位)
        if (res && typeof res.success === 'boolean') {
            if (!res.success) {
                // 業務邏輯失敗 (例如：庫存不足、帳號重複) -> 主動拋出錯誤進到 catch 區塊
                return Promise.reject(new Error(res.message || '業務處理失敗'));
            }
        }
        
        // 業務邏輯成功 -> 直接回傳 res，讓調用處直接取得 { success: true, message, data }
        return res;
    },
    (error) => {
        // HTTP 協定層級錯誤 (如 404, 500, 403 權限不足、伺服器未啟動)
        let errorMessage = '伺服器連線異常，請確認 Spring Boot 後端已啟動！';

        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || `HTTP 錯誤碼: ${error.response.status}`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('API 呼叫錯誤:', errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
);

export default axiosInstance;