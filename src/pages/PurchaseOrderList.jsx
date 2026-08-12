import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Select, 
  InputNumber, DatePicker, Tag, message, Card, Typography, Divider 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, MinusCircleOutlined, EyeOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { purchaseApi } from '../api/purchaseApi';
import { supplierApi } from '../api/supplierApi';
import { productApi } from '../api/productApi';

const { Text } = Typography;

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal 狀態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form] = Form.useForm();

  // 1. 初始化資料 (進貨單列表、廠商下拉選單、商品下拉選單)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, suppRes, prodRes] = await Promise.all([
        purchaseApi.getAllPurchaseOrders(),
        supplierApi.getAllSuppliers(),
        productApi.getAllProducts(),
      ]);

      if (poRes.success) setPurchaseOrders(poRes.data);
      if (suppRes.success) setSuppliers(suppRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      message.error('資料讀取失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 開啟建立進貨單 Modal
  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      purchaseDate: dayjs(),
      items: [{}], // 預設帶出一列空白商品項目
    });
    setIsCreateModalOpen(true);
  };

  // 3. 當選擇商品時，自動帶入該商品的預設進價/最後進價
  const handleProductSelect = (productId, fieldIndex) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const items = form.getFieldValue('items');
      items[fieldIndex] = {
        ...items[fieldIndex],
        productId: product.id,
        purchasePrice: product.lastCostPrice || product.costPrice || 0,
        quantity: 1,
      };
      form.setFieldsValue({ items: [...items] });
    }
  };

  // 4. 送出建立進貨單
  const handleCreateSubmit = async (values) => {
    try {
      const payload = {
        supplierId: values.supplierId,
        purchaseDate: values.purchaseDate.format('YYYY-MM-DD'),
        remark: values.remark || '',
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        })),
      };

      const res = await purchaseApi.createPurchaseOrder(payload);
      if (res.success) {
        message.success('進貨單建立成功，庫存與三軌成本已同步更新！');
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      message.error('進貨單建立失敗：' + err.message);
    }
  };

  // 5. 查看進貨單明細
  const handleViewDetail = async (id) => {
    setLoading(true);
    try {
      const res = await purchaseApi.getPurchaseOrderById(id);
      if (res.success) {
        setSelectedOrder(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      message.error('讀取單據明細失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 主表格欄位定義
  const columns = [
    {
      title: '進貨單號',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '進貨日期',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
    },
    {
      title: '進貨廠商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (text) => <Tag color="blue">{text || '未知廠商'}</Tag>,
    },
    {
      title: '進貨總金額 (NT$)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold' }}>
          ${amount?.toLocaleString()}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          查看明細
        </Button>
      ),
    },
  ];

  return (
    <Card title="📥 奇家五金行 - 進貨單管理與進價滾動控管" style={{ margin: '10px' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          重新整理列表
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          新建進貨單
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={purchaseOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆進貨單` }}
      />

      {/* 新建進貨單 Modal */}
      <Modal
        title="➕ 新建五金進貨單"
        open={isCreateModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsCreateModalOpen(false)}
        okText="完成進貨並更新庫存"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="supplierId" label="選擇進貨廠商" rules={[{ required: true, message: '請選擇廠商' }]}>
              <Select style={{ width: 260 }} placeholder="搜尋或選擇廠商...">
                {suppliers.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    [{s.supplierCode}] {s.shortName || s.fullName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="purchaseDate" label="進貨日期" rules={[{ required: true, message: '請選擇日期' }]}>
              <DatePicker style={{ width: 180 }} />
            </Form.Item>
          </Space>

          <Divider>進貨商品明細列</Divider>

          {/* 動態表單項目欄位 */}
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      label={index === 0 ? '進貨商品' : ''}
                      rules={[{ required: true, message: '請選擇商品' }]}
                    >
                      <Select
                        style={{ width: 300 }}
                        placeholder="請選擇商品..."
                        showSearch
                        optionFilterProp="children"
                        onChange={(val) => handleProductSelect(val, index)}
                      >
                        {products.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            [{p.productCode}] {p.productName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'purchasePrice']}
                      label={index === 0 ? '進貨單價 (NT$)' : ''}
                      rules={[{ required: true, message: '請輸入金額' }]}
                    >
                      <InputNumber min={0} style={{ width: 130 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label={index === 0 ? '數量' : ''}
                      rules={[{ required: true, message: '請輸入數量' }]}
                    >
                      <InputNumber min={1} style={{ width: 100 }} />
                    </Form.Item>

                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    增加商品項目
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="remark" label="進貨單備註">
            <InputNumber.TextArea rows={2} placeholder="如：附發票、送貨司機代收、折抵運費等..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看單據明細 Modal */}
      <Modal
        title={`📄 進貨單詳細內容 - ${selectedOrder?.orderNo || ''}`}
        open={isDetailModalOpen}
        onOk={() => setIsDetailModalOpen(false)}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            關閉
          </Button>,
        ]}
        width={700}
      >
        {selectedOrder && (
          <div>
            <p><strong>進貨廠商：</strong> {selectedOrder.supplierName}</p>
            <p><strong>進貨日期：</strong> {selectedOrder.purchaseDate}</p>
            <p><strong>總金額：</strong> <Text type="danger">${selectedOrder.totalAmount?.toLocaleString()}</Text></p>
            <p><strong>備註：</strong> {selectedOrder.remark || '無'}</p>
            <Divider>商品項目清單</Divider>
            <Table
              dataSource={selectedOrder.items}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '商品編號', dataIndex: 'productCode', key: 'productCode' },
                { title: '品名規格', dataIndex: 'productName', key: 'productName' },
                { title: '進貨單價', dataIndex: 'purchasePrice', key: 'purchasePrice', render: (val) => `$${val}` },
                { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '小計', dataIndex: 'subtotal', key: 'subtotal', render: (val) => `$${val}` },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default PurchaseOrderList;