import axios from 'axios';

// 💡 建立統一的 Axios 連線實例，對接 Spring Boot 後端 API
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Spring Boot API 的基礎 URL
    timeout: 10000, // 設定請求超時時間（毫秒）
    headers: {
        'Content-Type': 'application/json', // 設定請求的內容類型為 JSON
    },
});

// 💡 回應攔截器 (Response Interceptor)
// 自動解包後端的 ApiResponse { success, code, message, data }
anxiosInstance.interceptors.response.use(
    (response) => {
        // 直接回傳 response.data，讓調用處能直接取得 { success, message, data }
        return response.data; // 直接回傳 data，方便前端使用
    },
    (error) => {
        // 錯誤處理
        const errorMessage = error.response?.data?.message ||'伺服器連線異常，請確認 Spring Boot 後端已啟動！';
        console.error('API 呼叫錯誤:',errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
);

export default axiosInstance;