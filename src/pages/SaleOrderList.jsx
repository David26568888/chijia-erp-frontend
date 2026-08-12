import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Select, 
  Input, InputNumber, DatePicker, Tag, message, Card, Typography, Divider, Row, Col 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, MinusCircleOutlined, EyeOutlined, ShoppingCartOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { saleApi } from '../api/saleApi';
import { customerApi } from '../api/customerApi';
import { productApi } from '../api/productApi';

const { Text } = Typography;

const SaleOrderList = () => {
  const [saleOrders, setSaleOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal 狀態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form] = Form.useForm();

  // 1. 初始化讀取資料 (加上完整的防呆空陣列保護)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [soRes, custRes, prodRes] = await Promise.allSettled([
        saleApi.getAllSaleOrders(),
        customerApi.getAllCustomers(),
        productApi.getAllProducts(),
      ]);

      if (soRes.status === 'fulfilled' && soRes.value?.success) {
        setSaleOrders(Array.isArray(soRes.value.data) ? soRes.value.data : []);
      } else {
        setSaleOrders([]);
      }

      if (custRes.status === 'fulfilled' && custRes.value?.success) {
        setCustomers(Array.isArray(custRes.value.data) ? custRes.value.data : []);
      } else {
        setCustomers([]);
      }

      if (prodRes.status === 'fulfilled' && prodRes.value?.success) {
        setProducts(Array.isArray(prodRes.value.data) ? prodRes.value.data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      message.error('資料讀取失敗：' + (err.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 開啟 POS 開單 Modal
  const openCreateModal = () => {
    form.resetFields();
    const defaultCustomer = customers.length > 0 ? customers[0].id : undefined;
    form.setFieldsValue({
      saleDate: dayjs(),
      customerId: defaultCustomer,
      items: [{}],
    });
    setIsCreateModalOpen(true);
  };

  // 3. 櫃檯選商品自動帶入單價
  const handleProductSelect = (productId, fieldIndex) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      if ((product.stockQuantity || 0) <= 0) {
        message.warning(`警告：商品 [${product.productName}] 現有庫存為 0！`);
      }
      const items = form.getFieldValue('items') || [];
      items[fieldIndex] = {
        ...items[fieldIndex],
        productId: product.id,
        unitPrice: product.salePrice || 0,
        quantity: 1,
      };
      form.setFieldsValue({ items: [...items] });
    }
  };

  // 4. 送出銷貨單
  const handleCreateSubmit = async (values) => {
    try {
      const payload = {
        customerId: values.customerId,
        saleDate: values.saleDate ? values.saleDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        remark: values.remark || '',
        items: (values.items || []).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await saleApi.createSaleOrder(payload);
      if (res?.success) {
        message.success('🛒 結帳成功！商品庫存已同步扣減！');
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      message.error('結帳失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 5. 查看銷貨單明細
  const handleViewDetail = async (id) => {
    setLoading(true);
    try {
      const res = await saleApi.getSaleOrderById(id);
      if (res?.success) {
        setSelectedOrder(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      message.error('讀取單據失敗：' + (err.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 表格欄位定義
  const columns = [
    {
      title: '銷貨單號',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text) => <strong>{text || '-'}</strong>,
    },
    {
      title: '銷貨日期',
      dataIndex: 'saleDate',
      key: 'saleDate',
      width: 120,
    },
    {
      title: '購買客戶',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text) => <Tag color="green">{text || '門市散客'}</Tag>,
    },
    {
      title: '銷貨總金額 (NT$)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#3f8600', fontWeight: 'bold', fontSize: '15px' }}>
          ${(amount || 0).toLocaleString()}
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
          檢視
        </Button>
      ),
    },
  ];

  return (
    <Card title="🛒 奇家五金行 - 門市 POS 銷貨與結帳管理" style={{ margin: '10px' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          重新整理銷貨紀錄
        </Button>
        <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={openCreateModal}>
          門市 POS 快速開單 / 結帳
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={saleOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆銷貨單` }}
      />

      {/* POS 門市開單結帳 Modal */}
      <Modal
        title="🛒 門市櫃檯 POS 結帳開單"
        open={isCreateModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsCreateModalOpen(false)}
        okText="完成結帳並扣庫存"
        cancelText="取消"
        width={850}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="選擇購買客戶" rules={[{ required: true, message: '請選擇客戶' }]}>
                <Select
                  id="customerId"
                  name="customerId"
                  placeholder="選擇客戶 (預設散客)..." 
                  showSearch 
                  optionFilterProp="children"
                >
                  {customers.map((c) => (
                    <Select.Option key={c.id} value={c.id}>
                      [{c.customerCode}] {c.shortName || c.fullName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="saleDate" label="銷貨日期" rules={[{ required: true, message: '請選擇日期' }]}>
                <DatePicker id="saleDate" name="saleDate" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>銷售商品清單</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      label={index === 0 ? '商品品名規格 (支援條碼/關鍵字快搜)' : ''}
                      rules={[{ required: true, message: '請選擇商品' }]}
                    >
                      <Select
                        id={`product-select-${index}`}
                        name={`product-select-${index}`}
                        style={{ width: 340 }}
                        placeholder="搜尋品名、條碼或編號..."
                        showSearch
                        optionFilterProp="children"
                        onChange={(val) => handleProductSelect(val, index)}
                      >
                        {products.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            [{p.productCode}] {p.productName} (庫存: {p.stockQuantity ?? 0})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'unitPrice']}
                      label={index === 0 ? '售價 (NT$)' : ''}
                      rules={[{ required: true, message: '請輸入金額' }]}
                    >
                      <InputNumber id={`unitPrice-${index}`} name={`unitPrice-${index}`} min={0} style={{ width: 130 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label={index === 0 ? '數量' : ''}
                      rules={[{ required: true, message: '請輸入數量' }]}
                    >
                      <InputNumber id={`quantity-${index}`} name={`quantity-${index}`} min={1} style={{ width: 100 }} />
                    </Form.Item>

                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    增加銷售項目
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="remark" label="銷貨備註">
            <Input.TextArea id="remark" name="remark" rows={2} placeholder="例：付現免留發票、客訂保留、自取..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看銷貨單明細 Modal */}
      <Modal
        title={`📄 銷貨單明細 - ${selectedOrder?.orderNo || ''}`}
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
            <p><strong>購買客戶：</strong> {selectedOrder.customerName || '門市散客'}</p>
            <p><strong>銷貨日期：</strong> {selectedOrder.saleDate}</p>
            <p><strong>總金額：</strong> <Text type="success" style={{ fontSize: '18px', fontWeight: 'bold' }}>${(selectedOrder.totalAmount || 0).toLocaleString()}</Text></p>
            <p><strong>備註：</strong> {selectedOrder.remark || '無'}</p>
            <Divider>銷售明细項</Divider>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '商品編號', dataIndex: 'productCode', key: 'productCode' },
                { title: '品名規格', dataIndex: 'productName', key: 'productName' },
                { title: '銷售單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (val) => `$${val ?? 0}` },
                { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '小計', dataIndex: 'subtotal', key: 'subtotal', render: (val) => `$${val ?? 0}` },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SaleOrderList;