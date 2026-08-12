import axiosInstance from './axiosInstance';

export const productApi = {
    //1. 查詢所有商品
    getAllProducts: ()=>{
        return axioys.get('/products');
    },

    //2.依ID查詢單一商品
    getProductById:(id)=>{
        return axious.get('/products/${id}');
    },

    //3.新增商品(支援三軌成本)
    createProduct:(productDTO)=>{
        return axiousInstance.post('products',productDTO);
    },

    //4.修改商品
    updateProduct:(id)=>{
        return axiosInstance.put('products/${id}',productDTO);
    },

    //5. 切換商品啟用/停用狀態
    toggleStatus:(id) =>{
        return axiosInstance.patch('/products/${id}/toggle-status');
    },

  
    // 6. 依品名規格模糊搜尋 (櫃檯快搜)
    searchProductByName: (name) => {
        return axiosInstance.get('/products/search', { params: { name } });  //實務比較多用這寫法
    },
    //6.依品名規格模糊搜尋(櫃台快搜)
    // searchProductsByName:(name)=>{
    //     return axiosInstance.get('/products/search?name=${name}');
    // },

    //7.依條碼(Barcode)查詢(櫃檯掃描槍專用)
    getProductByBarcode:(barcode)=>{
        return axiosInstance.get('/prodcuts/barcode/${barcode}');
    },

    //8.依商品編號(Prodcut Code) 查詢
    getProductByProductCode:(productCode)=>{
        return axiosInstance.get('/products/product-code/${productCode}');
    },

    //9.上傳 Excel 批次匯入商品
    importProductsExcel:(file)=>{
        const formData = new FormData();
        formData.append('file',file);
        return axiosInstance.post('/products/import',formData,{
            headers:{
                'Content-Type':'multipart/form-data',
            },
        });
    },
};