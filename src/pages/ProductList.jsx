import React, { useState, useEffect } from 'react';
import { 
  Table, Input, Button, Space, Card, Tag, Typography, message, Tooltip, 
  Popconfirm, Modal, Form, InputNumber, Row, Col, Divider, Upload 
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, PlusOutlined, UploadOutlined, 
  EditOutlined, InfoCircleOutlined, InboxOutlined 
} from '@ant-design/icons';
import { productApi } from '../api/productApi';

const { Text } = Typography;
const { Dragger } = Upload;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null 代表新增，有值代表修改
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const [form] = Form.useForm();

  // 1. 取得商品資料
  const fetchProducts = async (keyword = '') => {
    setLoading(true);
    try {
      const res = await productApi.getAllProducts(keyword);
      let dataList = [];
      if (res && res.success) {
        dataList = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      } else if (Array.isArray(res)) {
        dataList = res;
      }
      setProducts(dataList);
      if (keyword && dataList.length === 0) {
        message.warning(`查無符合「${keyword}」的商品！`);
      }
    } catch (err) {
      console.error('讀取商品失敗:', err);
      message.error('讀取商品列表失敗，請檢查 API 連線！');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts('');
  }, []);

  const handleSearch = () => fetchProducts(searchKeyword);
  const handleReset = () => { setSearchKeyword(''); fetchProducts(''); };

  // 2. 切換商品上架/停用狀態
  const handleToggleStatus = async (id) => {
    try {
      const res = await productApi.toggleStatus(id);
      if (res && res.success) {
        message.success('商品狀態切換成功！');
        fetchProducts(searchKeyword);
      }
    } catch (err) {
      message.error('狀態變更失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 3. 打開「新增商品」 Modal
  const openCreateModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
    // 使用 setTimeout 確保 Modal 與 Form 已 mount 完成後再 setFieldsValue，避免 useForm 警告
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        productCode: '',
        barcode: '',
        productName: '',
        unit: '個',
        salePrice: 0,
        costPrice: 0,
        lastCostPrice: 0,
        avgCostPrice: 0,
        stockQuantity: 0,
        safetyStock: 5,
        status: true,
      });
    }, 0);
  };

  // 4. 打開「修改商品」 Modal
  const openEditModal = (record) => {
    setEditingId(record.id);
    setIsModalOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        productCode: record.productCode || '',
        barcode: record.barcode || '',
        productName: record.productName || '',
        unit: record.unit || '個',
        salePrice: record.salePrice || 0,
        costPrice: record.costPrice || 0,
        lastCostPrice: record.lastCostPrice || 0,
        avgCostPrice: record.avgCostPrice || 0,
        stockQuantity: record.stockQuantity || 0,
        safetyStock: record.safetyStock || 5,
      });
    }, 0);
  };

  // 5. 送出表單 (新增 / 修改)
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingId) {
        // 修改商品
        const res = await productApi.updateProduct(editingId, values);
        if (res?.success || res?.id) {
          message.success('✏️ 商品資料與商品編號修改成功！');
          setIsModalOpen(false);
          fetchProducts(searchKeyword);
        }
      } else {
        // 新增商品
        const res = await productApi.createProduct(values);
        if (res?.success || res?.id) {
          message.success('🎉 新增商品成功！');
          setIsModalOpen(false);
          fetchProducts(searchKeyword);
        }
      }
    } catch (err) {
      console.error('儲存失敗:', err);
      message.error('儲存失敗：' + (err.response?.data?.message || err.message || '連線錯誤'));
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Excel 匯入動作
  const handleExcelImport = async () => {
    if (!uploadFile) {
      message.error('請先選擇要上傳的 Excel 檔案！');
      return;
    }
    setSubmitting(true);
    try {
      const res = await productApi.importProductsExcel(uploadFile);
      if (res?.success) {
        message.success('📊 Excel 商品資料批次匯入成功！');
        setIsImportModalOpen(false);
        setUploadFile(null);
        fetchProducts();
      }
    } catch (err) {
      message.error('匯入失敗：' + (err.message || '檔案格式錯誤'));
    } finally {
      setSubmitting(false);
    }
  };

  // 7. 表格欄位定義
  const columns = [
    {
      title: '商品編號',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 110,
      render: (text) => <strong>{text || '-'}</strong>,
    },
    {
      title: '商品名稱 / 規格',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      render: (text) => (
        <span style={{ color: '#0958d9', fontWeight: 'bold' }}>
          {text || '未命名商品'}
        </span>
      ),
    },
    {
      title: '國際條碼',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 125,
      render: (text) => text ? <Tag color="blue" style={{ margin: 0 }}>{text}</Tag> : <Text type="secondary" style={{ fontSize: '12px' }}>無條碼</Text>,
    },
    {
      title: '單位',
      dataIndex: 'unit',
      key: 'unit',
      width: 50,
      align: 'center',
      render: (text) => text || '個',
    },
    {
      title: '零售價',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 85,
      align: 'right',
      render: (val) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold' }}>
          ${(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="三軌成本包含：期初基準成本(基) / 最新進貨價(進) / 加權移動平均成本(平)">
          三軌成本 <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
        </Tooltip>
      ),
      key: 'threeCost',
      width: 130,
      render: (_, record) => (
        <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
          <div>基: <span style={{ color: '#08979c' }}>${(record.costPrice ?? 0).toLocaleString()}</span></div>
          <div>進: <span style={{ color: '#d46b08' }}>${(record.lastCostPrice ?? 0).toLocaleString()}</span></div>
          <div>平: <span style={{ color: '#531dab' }}>${(record.avgCostPrice ?? 0).toLocaleString()}</span></div>
        </div>
      ),
    },
    {
      title: '庫存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 80,
      align: 'right',
      render: (qty, record) => {
        const numQty = qty ?? 0;
        const isLow = numQty <= (record.safetyStock || 5);
        return (
          <span style={{ fontWeight: 'bold', color: isLow ? '#f5222d' : '#3f8600' }}>
            {numQty} {isLow && <Tooltip title="低於安全庫存！"><Text type="danger">⚠️</Text></Tooltip>}
          </span>
        );
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 65,
      align: 'center',
      render: (status) => (
        <Tag color={status ? 'success' : 'default'} style={{ margin: 0, padding: '0 4px', fontSize: '11px' }}>
          {status ? '上架' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="確定變更狀態？"
            onConfirm={() => handleToggleStatus(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" size="small" danger={record.status} style={{ padding: '0 2px' }}>
              {record.status ? '停用' : '啟用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    /* 💡Ant Design v5 語法修正：以 styles={{ body: ... }} 替代 deprecated bodyStyle */
    <Card title="📦 奇家五金行 - 商品管理與三軌成本控管" style={{ margin: '8px' }} styles={{ body: { padding: '12px' } }}>
      {/* 搜尋列 */}
      <Space style={{ marginBottom: 12, justifyContent: 'space-between', width: '100%' }} wrap>
        <Space wrap>
          <Input
            placeholder="請輸入品名、條碼或編號..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            快搜
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增商品
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>
            Excel 匯入
          </Button>
        </Space>
      </Space>

      {/* 資料表格 */}
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        size="small"
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `共 ${total} 筆商品`,
        }}
      />

      {/* 💡 新增 / 修改商品 Modal 彈窗 (修正 Ant Design v5 destroyOnHidden) */}
      <Modal
        title={editingId ? '✏️ 修改商品資料與三軌成本' : '📦 新增商品與成本建置'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingId ? '儲存修改' : '建立商品'}
        cancelText="取消"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              {/* 💡 確定商品編號對齊 productCode 屬性 */}
              <Form.Item name="productCode" label="商品編號" rules={[{ required: true, message: '請輸入商品編號' }]}>
                <Input placeholder="例：0-0000-0100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label="國際條碼 (EAN-13 / 條碼槍)">
                <Input placeholder="例：4710367983866" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={18}>
              <Form.Item name="productName" label="商品名稱 / 規格" rules={[{ required: true, message: '請輸入商品名稱' }]}>
                <Input placeholder="例：3M DIY 手套 / 矽利康中性 透明" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unit" label="單位" rules={[{ required: true, message: '單位' }]}>
                <Input placeholder="例：支、包、個、捲" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }}>💰 售價與三軌成本控管</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salePrice" label="門市零售價 (NT$)" rules={[{ required: true, message: '請輸入零售價' }]}>
                <InputNumber min={0} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="costPrice" label="期初基準成本 (基)" rules={[{ required: true, message: '請輸入基準成本' }]}>
                <InputNumber min={0} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lastCostPrice" label="最新進貨單價 (進)">
                <InputNumber min={0} style={{ width: '100%' }} prefix="$" placeholder="進貨單將自動更新" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="avgCostPrice" label="加權移動平均成本 (平)">
                <InputNumber min={0} style={{ width: '100%' }} prefix="$" placeholder="進貨單將自動精算" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }}>📦 庫存管控設定</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stockQuantity" label="初始現有庫存" rules={[{ required: true, message: '請輸入庫存' }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="safetyStock" label="安全庫存警戒值" rules={[{ required: true, message: '請輸入安全庫存' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Excel 批次匯入 Modal */}
      <Modal
        title="📊 批次匯入五金商品 Excel 資料"
        open={isImportModalOpen}
        onOk={handleExcelImport}
        onCancel={() => { setIsImportModalOpen(false); setUploadFile(null); }}
        confirmLoading={submitting}
        okText="開始匯入入庫"
        cancelText="取消"
        width={500}
        destroyOnHidden
      >
        <p>請上傳包含商品編號、品名規格、條碼與成本售價的 Excel 檔案（.xlsx / .xls）：</p>
        <Dragger
          name="file"
          multiple={false}
          beforeUpload={(file) => {
            setUploadFile(file);
            return false;
          }}
          onRemove={() => setUploadFile(null)}
          fileList={uploadFile ? [uploadFile] : []}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#1677ff', fontSize: '36px' }} />
          </p>
          <p className="ant-upload-text">點擊或拖拽 產品資料.xlsx 至此區域上傳</p>
          <p className="ant-upload-hint">支援單一檔案上傳，系統將自動解析商品品名與成本</p>
        </Dragger>
      </Modal>
    </Card>
  );
};

export default ProductList;