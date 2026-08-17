import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Select, 
  Input, InputNumber, DatePicker, Tag, message, Card, Typography, Divider, Row, Col, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, MinusCircleOutlined, EyeOutlined, 
  ImportOutlined, DollarOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CopyOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { purchaseApi } from '../api/purchaseApi';
import { supplierApi } from '../api/supplierApi';
import { productApi } from '../api/productApi';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 搜尋條件
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState(null);

  // Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form] = Form.useForm();

  // 1. 讀取進貨單列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await purchaseApi.getAllPurchaseOrders(params);
      let list = [];
      if (res?.success && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }
      setPurchaseOrders(list);
    } catch (err) {
      console.error('讀取進貨單失敗:', err);
      message.error('讀取進貨單失敗，請確認後端狀態！');
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. 載入廠商與商品選項
  const fetchOptions = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        supplierApi.getAllSuppliers(),
        productApi.getAllProducts(),
      ]);
      setSuppliers(Array.isArray(sRes?.data) ? sRes.data : (Array.isArray(sRes) ? sRes : []));
      setProducts(Array.isArray(pRes?.data) ? pRes.data : (Array.isArray(pRes) ? pRes : []));
    } catch (err) {
      console.error('讀取選項失敗:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, []);

  // 3. 打開「新增」彈窗
  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();
    const defaultSupplier = suppliers.length > 0 ? suppliers[0].id : undefined;
    form.setFieldsValue({
      purchaseDate: dayjs(),
      supplierId: defaultSupplier,
      discountAmount: 0,
      items: [{}],
    });
    setIsModalOpen(true);
  };

  // 4. 打開「修改」彈窗
  const openEditModal = async (record) => {
    setEditingId(record.id);
    form.resetFields();
    try {
      const res = await purchaseApi.getPurchaseOrderById(record.id);
      const data = res?.data || res;
      
      form.setFieldsValue({
        supplierId: data.supplierId,
        purchaseDate: data.purchaseDate ? dayjs(data.purchaseDate) : dayjs(),
        remark: data.remark || '',
        discountAmount: data.discountAmount || 0,
        items: (data.items || []).map(item => {
          const matchedProd = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            stockQuantity: matchedProd ? matchedProd.stockQuantity : '-',
            unit: matchedProd ? matchedProd.unit : '個',
          };
        }),
      });
      setIsModalOpen(true);
    } catch (err) {
      message.error('讀取單據失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 5. 複製單據
  const handleCopyOrder = async (record) => {
    setEditingId(null);
    form.resetFields();
    try {
      const res = await purchaseApi.getPurchaseOrderById(record.id);
      const data = res?.data || res;
      
      form.setFieldsValue({
        supplierId: data.supplierId,
        purchaseDate: dayjs(),
        remark: `複製自進貨單 ${data.purchaseNo || ''}${data.remark ? ' (' + data.remark + ')' : ''}`,
        discountAmount: data.discountAmount || 0,
        items: (data.items || []).map(item => {
          const matchedProd = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            stockQuantity: matchedProd ? matchedProd.stockQuantity : '-',
            unit: matchedProd ? matchedProd.unit : '個',
          };
        }),
      });
      message.info(`📋 已將進貨單 [${data.purchaseNo || ''}] 載入開單視窗！`);
      setIsModalOpen(true);
    } catch (err) {
      message.error('複製單據失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 6. 選商品帶入預設進價與現有庫存
  const handleProductSelect = (productId, fieldIndex) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const items = form.getFieldValue('items') || [];
      items[fieldIndex] = {
        ...items[fieldIndex],
        productId: product.id,
        unitPrice: product.costPrice || product.lastCostPrice || 0,
        quantity: 1,
        stockQuantity: product.stockQuantity || 0,
        unit: product.unit || '個',
      };
      form.setFieldsValue({ items: [...items] });
    }
  };

  // 7. 提交（新增或修改）
  const handleSubmit = async (values) => {
    try {
      const items = values.items || [];
      if (items.length === 0) {
        message.error('請至少新增一項進貨商品！');
        return;
      }

      const payload = {
        supplierId: values.supplierId,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        remark: values.remark || '',
        discountAmount: values.discountAmount || 0,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (editingId) {
        await purchaseApi.updatePurchaseOrder(editingId, payload);
        message.success('✏️ 進貨單修改成功，庫存與成本已重新校正！');
      } else {
        await purchaseApi.createPurchaseOrder(payload);
        message.success('📦 進貨開單成功！商品庫存與三軌成本已自動更新！');
      }

      setIsModalOpen(false);
      fetchOrders();
      fetchOptions(); // 重新整理商品最新庫存與成本
    } catch (err) {
      message.error('儲存失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 8. 作廢/刪除進貨單
  const handleDelete = async (id) => {
    try {
      await purchaseApi.deletePurchaseOrder(id);
      message.success('🗑️ 進貨單已成功作廢，商品庫存已自動扣回！');
      fetchOrders();
      fetchOptions();
    } catch (err) {
      message.error('作廢失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 9. 檢視明細
  const handleViewDetail = async (id) => {
    try {
      const res = await purchaseApi.getPurchaseOrderById(id);
      setSelectedOrder(res?.data || res);
      setIsDetailModalOpen(true);
    } catch (err) {
      message.error('讀取單據失敗：' + (err.message || '未知錯誤'));
    }
  };

  // 表格欄位定義
  const columns = [
    {
      title: '進貨單號',
      dataIndex: 'purchaseNo',
      key: 'purchaseNo',
      width: 160,
      render: (text) => <strong>{text || '-'}</strong>,
    },
    {
      title: '進貨日期',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 110,
    },
    {
      title: '進貨廠商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (text) => <Tag color="blue">{text || '未知廠商'}</Tag>,
    },
    {
      title: '整單折讓',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 90,
      align: 'right',
      render: (val) => val ? <span style={{ color: '#d97706' }}>-${val}</span> : '-',
    },
    {
      title: '應付總金額 (NT$)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold', fontSize: '15px' }}>
          ${(amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      align: 'center',
      render: (_, record) => (
        <Space size={0}>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            檢視
          </Button>
          <Button type="text" style={{ color: '#1677ff' }} icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            修改
          </Button>
          <Button type="text" style={{ color: '#52c41a' }} icon={<CopyOutlined />} onClick={() => handleCopyOrder(record)}>
            複製
          </Button>
          <Popconfirm
            title="確定要作廢此進貨單嗎？"
            description="作廢後將自動將當時增加的商品庫存扣回！"
            onConfirm={() => handleDelete(record.id)}
            okText="作廢"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              作廢
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="📦 奇家五金行 - 進貨單管理與補貨作業" style={{ margin: '8px' }}>
      {/* 搜尋過濾列 */}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }} wrap>
        <Space wrap>
          <Input
            placeholder="搜尋進貨單號或廠商名稱..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={fetchOrders}
            style={{ width: 220 }}
            allowClear
          />
          <RangePicker 
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            placeholder={['開始日期', '結束日期']}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchOrders}>
            快搜
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setSearchKeyword(''); setDateRange(null); fetchOrders(); }}>
            重置
          </Button>
        </Space>

        <Button type="primary" size="large" icon={<ImportOutlined />} onClick={openCreateModal}>
          新建進貨單 (補貨入庫)
        </Button>
      </Space>

      {/* 資料表格 */}
      <Table
        columns={columns}
        dataSource={purchaseOrders}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆進貨單` }}
      />

      {/* 開單 / 修改 / 複製 Modal */}
      <Modal
        title={editingId ? '✏️ 修改進貨單' : '📦 建立進貨單 (補貨入庫)'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText={editingId ? '儲存修改' : '完成進貨並加庫存'}
        cancelText="取消"
        width={920}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierId" label="選擇進貨廠商" rules={[{ required: true, message: '請選擇廠商' }]}>
                <Select placeholder="選擇進貨廠商..." showSearch optionFilterProp="children">
                  {suppliers.map((s) => (
                    <Select.Option key={s.id} value={s.id}>
                      [{s.supplierCode}] {s.shortName || s.supplierName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchaseDate" label="進貨日期" rules={[{ required: true, message: '請選擇日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }}>進貨商品明細</Divider>

          <Form.Item noStyle shouldUpdate>
            {() => {
              const items = form.getFieldValue('items') || [];
              const discount = form.getFieldValue('discountAmount') || 0;

              const rawTotal = items.reduce((sum, item) => {
                const price = Number(item?.unitPrice) || 0;
                const qty = Number(item?.quantity) || 0;
                return sum + (price * qty);
              }, 0);

              const finalPay = Math.max(0, rawTotal - discount);

              return (
                <>
                  <Form.List name="items">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }, index) => {
                          const currentItem = items[index] || {};
                          const linePrice = Number(currentItem.unitPrice) || 0;
                          const lineQty = Number(currentItem.quantity) || 0;
                          const lineSubtotal = linePrice * lineQty;
                          const currentStock = currentItem.stockQuantity ?? null;
                          const unitStr = currentItem.unit || '';

                          return (
                            <Row key={key} gutter={8} align="middle" style={{ marginBottom: 10, background: '#fafafa', padding: '8px 4px', borderRadius: 6 }}>
                              <Col span={9}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'productId']}
                                  label={index === 0 ? '商品品名規格 (條碼/關鍵字)' : ''}
                                  rules={[{ required: true, message: '請選擇商品' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Select
                                    placeholder="搜尋品名、條碼或編號..."
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
                              </Col>

                              <Col span={3} style={{ textAlign: 'center' }}>
                                {index === 0 && <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>當前庫存</div>}
                                {currentStock !== null ? (
                                  <Tag color="processing">
                                    {currentStock} {unitStr}
                                  </Tag>
                                ) : (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
                                )}
                              </Col>

                              <Col span={4}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'unitPrice']}
                                  label={index === 0 ? '進價 (NT$)' : ''}
                                  rules={[{ required: true, message: '進價' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>

                              <Col span={3}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'quantity']}
                                  label={index === 0 ? '數量' : ''}
                                  rules={[{ required: true, message: '數量' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>

                              <Col span={4} style={{ textAlign: 'right' }}>
                                {index === 0 && <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>項目小計</div>}
                                <Text strong style={{ color: '#cf1322', fontSize: '14px' }}>
                                  ${lineSubtotal.toLocaleString()}
                                </Text>
                              </Col>

                              <Col span={1} style={{ textAlign: 'center' }}>
                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer', marginTop: index === 0 ? 22 : 0 }} />
                              </Col>
                            </Row>
                          );
                        })}

                        <Form.Item>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            增加進貨項目
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  <Row gutter={16}>
                    <Col span={14}>
                      <Form.Item name="remark" label="進貨備註">
                        <Input.TextArea rows={2} placeholder="例：預付訂金、月結單據、廠商自送..." />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item name="discountAmount" label="整單折讓 / 折扣額 (NT$)">
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：100" prefix={<DollarOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Card style={{ background: '#fff2f0', borderColor: '#ffccc7', marginTop: 8 }}>
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Text type="secondary">進貨原始小計：${rawTotal.toLocaleString()}</Text>
                        {discount > 0 && (
                          <Text type="warning" style={{ marginLeft: 16 }}>
                            整單折讓：-${discount.toLocaleString()}
                          </Text>
                        )}
                      </Col>
                      <Col>
                        <Space align="baseline">
                          <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>進貨應付總金額：</Text>
                          <Text type="danger" style={{ fontSize: '26px', fontWeight: 'bold' }}>
                            ${finalPay.toLocaleString()}
                          </Text>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 檢視明細 Modal */}
      <Modal
        title={`📄 進貨單明細 - ${selectedOrder?.purchaseNo || ''}`}
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
            <p><strong>進貨廠商：</strong> {selectedOrder.supplierName || '未知廠商'}</p>
            <p><strong>進貨日期：</strong> {selectedOrder.purchaseDate}</p>
            <p><strong>整單折讓：</strong> ${selectedOrder.discountAmount || 0}</p>
            <p><strong>應付總金額：</strong> <Text type="danger" style={{ fontSize: '18px', fontWeight: 'bold' }}>${(selectedOrder.totalAmount || 0).toLocaleString()}</Text></p>
            <p><strong>備註：</strong> {selectedOrder.remark || '無'}</p>
            <Divider>進貨商品明細項</Divider>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '商品編號', dataIndex: 'productCode', key: 'productCode' },
                { title: '品名規格', dataIndex: 'productName', key: 'productName' },
                { title: '進貨單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (val) => `$${val ?? 0}` },
                { title: '進貨數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '項目小計', dataIndex: 'subtotal', key: 'subtotal', render: (val) => `$${val ?? 0}` },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default PurchaseOrderList;