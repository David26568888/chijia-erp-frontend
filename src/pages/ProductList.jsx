import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Space, Modal, Form, 
  InputNumber, Upload, Tag, message, Popconfirm, Card, Tooltip 
} from 'antd';
import { 
  PlusOutlined, UploadOutlined, SearchOutlined, 
  EditOutlined, ReloadOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import { productApi } from '../api/productApi';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();

  // 1. 讀取商品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAllProducts();
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      message.error(err.message || '讀取商品列表失敗！');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. 萬能快搜 (品名 / 條碼 / 商品編號)
  const handleSearch = async () => {
    if (!searchText.trim()) {
      fetchProducts();
      return;
    }
    setLoading(true);
    try {
      const res = await productApi.searchProductByName(searchText.trim());
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      message.error('搜尋失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. 開啟彈窗
  const openModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: true, stockQuantity: 0, safetyStock: 5 });
    }
    setIsModalOpen(true);
  };

  // 4. 表單送出
  const handleFormSubmit = async (values) => {
    try {
      if (editingProduct) {
        const res = await productApi.updateProduct(editingProduct.id, values);
        if (res.success) message.success('商品更新成功！');
      } else {
        const res = await productApi.createProduct(values);
        if (res.success) message.success('新增商品成功！');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      message.error('操作失敗：' + err.message);
    }
  };

  // 5. 切換狀態
  const handleToggleStatus = async (id) => {
    try {
      const res = await productApi.toggleStatus(id);
      if (res.success) {
        message.success('狀態切換成功！');
        fetchProducts();
      }
    } catch (err) {
      message.error('狀態切換失敗：' + err.message);
    }
  };

  // 6. Excel 匯入
  const handleImportExcel = async () => {
    if (fileList.length === 0) {
      message.warning('請先選擇要上傳的 Excel 檔案！');
      return;
    }
    setLoading(true);
    try {
      const res = await productApi.importProductsExcel(fileList[0].originFileObj);
      message.success(res.data || 'Excel 匯入完成！');
      setIsImportModalOpen(false);
      setFileList([]);
      fetchProducts();
    } catch (err) {
      message.error('匯入失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. 表格欄位定義
  const columns = [
    {
      title: '商品編號',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '品名規格',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: '國際條碼',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : <span style={{ color: '#ccc' }}>無條碼</span>,
    },
    {
      title: '單位',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
      align: 'center',
    },
    {
      title: '零售價 (NT$)',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 110,
      align: 'right',
      render: (val) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>${val?.toLocaleString()}</span>,
    },
    {
      title: '三軌成本比較',
      key: 'threeTierCosts',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ fontSize: '12px' }}>
          <Tooltip title="期初基準成本">
            <Tag color="cyan">期初基準: ${record.costPrice ?? 0}</Tag>
          </Tooltip>
          <Tooltip title="最近一次進貨單價格">
            <Tag color="orange">最後進價: ${record.lastCostPrice ?? 0}</Tag>
          </Tooltip>
          <Tooltip title="滾動計算之平均成本">
            <Tag color="purple">移動平均: ${record.avgCostPrice ?? 0}</Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '現有庫存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 120,
      align: 'right',
      render: (qty, record) => {
        const isLowStock = qty <= (record.safetyStock || 0);
        return (
          <Space>
            <span style={{ fontWeight: 'bold', color: isLowStock ? '#ff4d4f' : '#3f8600' }}>
              {qty} {record.unit}
            </span>
            {isLowStock && (
              <Tooltip title={`低於安全存量 (${record.safetyStock})`}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => (
        <Tag color={status ? 'success' : 'error'}>
          {status ? '上架中' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => openModal(record)} 
          />
          <Popconfirm
            title="確定要變更狀態嗎？"
            onConfirm={() => handleToggleStatus(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger={record.status}>
              {record.status ? '停用' : '啟用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="📦 奇家五金行 - 商品管理與三軌成本控管" style={{ margin: '10px' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Input
            placeholder="請輸入品名、國際條碼或商品編號..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 320 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            快搜
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchProducts}>
            重置
          </Button>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增商品
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>
            Excel 批次匯入
          </Button>
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 筆商品` }}
      />

      <Modal
        title={editingProduct ? '✏️ 修改商品資料' : '➕ 新增商品'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText="儲存"
        cancelText="取消"
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="productCode" label="商品編號" rules={[{ required: true, message: '請輸入商品編號' }]}>
              <Input placeholder="例: A001" disabled={!!editingProduct} />
            </Form.Item>
            <Form.Item name="barcode" label="國際條碼">
              <Input placeholder="條碼槍掃描" />
            </Form.Item>
            <Form.Item name="unit" label="單位" rules={[{ required: true, message: '請輸入單位' }]}>
              <Input placeholder="例: 個/支/箱" style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Form.Item name="productName" label="品名規格" rules={[{ required: true, message: '請輸入品名規格' }]}>
            <Input placeholder="例: 4分白鐵雙頭螺絲 1/2*2" />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="salePrice" label="零售售價 (NT$)" rules={[{ required: true, message: '請輸入售價' }]}>
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="costPrice" label="期初基準成本">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="lastCostPrice" label="最後進價">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="avgCostPrice" label="移動平均成本">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="stockQuantity" label="現有庫存">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="safetyStock" label="安全庫存量">
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="📥 批次匯入五金商品 Excel"
        open={isImportModalOpen}
        onOk={handleImportExcel}
        onCancel={() => setIsImportModalOpen(false)}
        okText="開始匯入"
        cancelText="取消"
        confirmLoading={loading}
      >
        <p>請選擇五金行舊系統導出的 <code>.xlsx</code> 或 <code>.xls</code> 報表檔案：</p>
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
        >
          <Button icon={<UploadOutlined />}>選擇檔案</Button>
        </Upload>
      </Modal>
    </Card>
  );
};

export default ProductList;