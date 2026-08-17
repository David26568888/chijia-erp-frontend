import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Select, 
  Input, InputNumber, DatePicker, Tag, message, Card, Typography, Divider, Row, Col, Popconfirm, Spin 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, MinusCircleOutlined, EyeOutlined, 
  ShoppingCartOutlined, DollarOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CopyOutlined, HistoryOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { saleApi } from '../api/saleApi';
import { customerApi } from '../api/customerApi';
import { productApi } from '../api/productApi';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const SaleOrderList = () => {
  const [saleOrders, setSaleOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // 搜尋條件 State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState(null);

  // POS / 修改 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 💡 1. 行情速查 Modal 狀態管理
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState({ id: null, name: '' });
  const [productHistoryData, setProductHistoryData] = useState({ saleHistory: [], purchaseHistory: [] });

  const [form] = Form.useForm();

  // 💡 宣告 Ref 陣列，儲存每一列商品 Select 的元件實體
  const selectRefs = React.useRef([]);

  // 1. 讀取銷貨單列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await saleApi.getAllSaleOrders(params);
      let list = [];
      if (res?.success && Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }
      setSaleOrders(list);
    } catch (err) {
      console.error('讀取銷貨單失敗:', err);
      message.error('讀取銷貨單失敗，請確認後端狀態！');
      setSaleOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. 載入客戶與商品選單
  const fetchOptions = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        customerApi.getAllCustomers(),
        productApi.getAllProducts(),
      ]);
      setCustomers(Array.isArray(cRes?.data) ? cRes.data : (Array.isArray(cRes) ? cRes : []));
      setProducts(Array.isArray(pRes?.data) ? pRes.data : (Array.isArray(pRes) ? pRes : []));
    } catch (err) {
      console.error('讀取選項失敗:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, []);

  // 💡 2. 開啟行情速查 Modal 並載入後端 API
  const handleOpenHistory = async (productId) => {
    if (!productId) {
      message.warning('請先選擇商品！');
      return;
    }
    const product = products.find(p => p.id === productId);
    setSelectedHistoryProduct({
      id: productId,
      name: product ? product.productName : '未知商品'
    });
    setHistoryModalOpen(true);
    setHistoryLoading(true);

    try {
      // 呼叫後端行情 API
      const res = await productApi.getProductHistory(productId);
      setProductHistoryData(res?.data || res || { saleHistory: [], purchaseHistory: [] });
    } catch (err) {
      message.error('讀取行情歷史失敗：' + (err.message || '網路錯誤'));
    } finally {
      setHistoryLoading(false);
    }
  };

  // 3. 打開「新增」銷貨單彈窗
  const openCreateModal = () => {
    setEditingId(null);
    form.resetFields();

    // 💡 尋找 customerCode 為 "*" 的散客/現金客戶，找不到則預設取第一筆
    const defaultCustomer = customers.find(c => c.customerCode === '*') || customers[0];
    const defaultCustomerId = defaultCustomer ? defaultCustomer.id : undefined;
      form.setFieldsValue({
      saleDate: dayjs(),
      customerId: defaultCustomerId, // 💡 自動預設帶入現金客戶 "*"
      discountAmount: 0,
      items: [{}],
    });
    setIsModalOpen(true);
  };

  // 4. 打開「修改」銷貨單彈窗
  const openEditModal = async (record) => {
    setEditingId(record.id);
    form.resetFields();
    try {
      const res = await saleApi.getSaleOrderById(record.id);
      const data = res?.data || res;
      
      form.setFieldsValue({
        customerId: data.customerId,
        saleDate: data.saleDate ? dayjs(data.saleDate) : dayjs(),
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

  // 5. 【複製訂單】功能
  const handleCopyOrder = async (record) => {
    setEditingId(null);
    form.resetFields();
    try {
      const res = await saleApi.getSaleOrderById(record.id);
      const data = res?.data || res;
      
      form.setFieldsValue({
        customerId: data.customerId,
        saleDate: dayjs(),
        remark: `複製自單號 ${data.saleNo || ''}${data.remark ? ' (' + data.remark + ')' : ''}`,
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
      message.info(`📋 已將銷貨單 [${data.saleNo || ''}] 品項載入開單視窗，確認無誤後即可結帳！`);
      setIsModalOpen(true);
    } catch (err) {
      message.error('複製單據失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 6. 選商品時向後端查詢歷史成交價/建議售價
  const handleProductSelect = async (productId, fieldIndex) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if ((product.stockQuantity || 0) <= 0) {
      message.warning(`⚠️ 警告：商品 [${product.productName}] 當前庫存不足！`);
    }

    const currentCustomerId = form.getFieldValue('customerId');
    let suggestedPrice = product.salePrice || 0;

    try {
      const res = await saleApi.getSuggestedPrice(currentCustomerId, productId);
      const fetchedPrice = res?.data ?? res;
      if (fetchedPrice !== undefined && fetchedPrice !== null) {
        suggestedPrice = fetchedPrice;
      }
    } catch (err) {
      console.warn('無法取得建議售價，自動套用商品預設售價', err);
    }

    const items = form.getFieldValue('items') || [];
    items[fieldIndex] = {
      ...items[fieldIndex],
      productId: product.id,
      unitPrice: suggestedPrice,
      quantity: 1,
      stockQuantity: product.stockQuantity || 0,
      unit: product.unit || '個',
    };

    // 💡 關鍵優化：如果當前填寫的是最後一列，自動向下擴充新增一列空白項目！
    if (fieldIndex === items.length - 1) {
      items.push({});
    
    // 💡 關鍵優化 ：等待 DOM 渲染完畢後，自動將焦點（Focus）移至下一行的商品選單
      setTimeout(() => {
        if (selectRefs.current[fieldIndex + 1]) {
          selectRefs.current[fieldIndex + 1].focus();
        }
      }, 50);
    }

    form.setFieldsValue({ items: [...items] });
  };

  // 7. 提交銷貨單
  const handleSubmit = async (values) => {
    try {
      const rawItems = values.items || [];

      // 💡 1. 自動過濾掉未選擇商品的空白列 (包含最後一行空白)
      const items = rawItems.filter((item) => item && item.productId);

      // 💡 2. 檢查是否至少有一項有效商品
      if (items.length === 0) {
        message.error('請至少選擇一項銷售商品！');
        return;
      }

      // 💡 3. 檢查有效商品是否有未填寫單價或數量的情況
      const hasInvalidItem = items.some(item => 
        item.unitPrice === undefined || item.unitPrice === null || !item.quantity
      );
      if (hasInvalidItem) {
        message.error('請確認已選擇商品的單價與數量！');
        return;
      }

      const payload = {
        customerId: values.customerId,
        saleDate: values.saleDate ? values.saleDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        remark: values.remark || '',
        discountAmount: values.discountAmount || 0,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      if (editingId) {
        await saleApi.updateSaleOrder(editingId, payload);
        message.success('✏️ 銷貨單修改成功，庫存已重新校正！');
      } else {
        await saleApi.createSaleOrder(payload);
        message.success('🛒 門市結帳成功！已開出新銷貨單並自動扣減庫存！');
      }

      setIsModalOpen(false);
      fetchOrders();
      fetchOptions();
    } catch (err) {
      message.error('儲存失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 8. 作廢/刪除銷貨單
  const handleDelete = async (id) => {
    try {
      await saleApi.deleteSaleOrder(id);
      message.success('🗑️ 銷貨單已成功作廢，商品庫存已自動回補！');
      fetchOrders();
      fetchOptions();
    } catch (err) {
      message.error('作廢失敗：' + (err.message || '連線錯誤'));
    }
  };

  // 9. 檢視明細
  const handleViewDetail = async (id) => {
    try {
      const res = await saleApi.getSaleOrderById(id);
      setSelectedOrder(res?.data || res);
      setIsDetailModalOpen(true);
    } catch (err) {
      message.error('讀取單據失敗：' + (err.message || '未知錯誤'));
    }
  };

  // 表格欄位定義
  const columns = [
    {
      title: '銷貨單號',
      dataIndex: 'saleNo',
      key: 'saleNo',
      width: 160,
      render: (text) => <strong>{text || '-'}</strong>,
    },
    {
      title: '銷貨日期',
      dataIndex: 'saleDate',
      key: 'saleDate',
      width: 110,
    },
    {
      title: '購買客戶',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text) => <Tag color="green">{text || '門市散客'}</Tag>,
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
      title: '實收總金額 (NT$)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
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
            title="確定要作廢此銷貨單嗎？"
            description="作廢後將自動將商品庫存 100% 回補！"
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
    <Card title="🛒 奇家五金行 - 門市 POS 銷貨與結帳管理" style={{ margin: '8px' }}>
      {/* 搜尋過濾列 */}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }} wrap>
        <Space wrap>
          <Input
            placeholder="搜尋銷貨單號或客戶名稱..."
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

        <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={openCreateModal}>
          門市 POS 快速開單 / 結帳
        </Button>
      </Space>

      {/* 資料表格 */}
      <Table
        columns={columns}
        dataSource={saleOrders}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆銷貨單` }}
      />

      {/* 開單 / 修改 / 複製 Modal */}
      <Modal
        title={editingId ? '✏️ 修改銷貨單' : '🛒 門市櫃檯 POS 結帳開單'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText={editingId ? '儲存修改' : '完成結帳並扣庫存'}
        cancelText="取消"
        width={960}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="選擇購買客戶" rules={[{ required: true, message: '請選擇客戶' }]}>
                <Select placeholder="選擇客戶 (預設散客)..." showSearch optionFilterProp="children">
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
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }}>銷售商品清單</Divider>

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
                              <Col span={8}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'productId']}
                                  label={index === 0 ? '商品品名規格 (條碼/關鍵字)' : ''}
                                  /*💡 移除 rules={[{ required: true, message: '請選擇商品' }]} 避免空白列被阻擋 */
                                  style={{ marginBottom: 0 }}
                                >
                                  <Select
                                    ref={(el) => (selectRefs.current[index] = el)} // 💡 將選單實體登記到 Ref 陣列
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

                              {/* 💡 查行情按鈕 */}
                              <Col span={3} style={{ textAlign: 'center' }}>
                                {index === 0 && <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>歷史行情</div>}
                                <Button 
                                  size="small" 
                                  type="dashed" 
                                  icon={<HistoryOutlined />}
                                  onClick={() => handleOpenHistory(currentItem.productId)}
                                >
                                  查行情
                                </Button>
                              </Col>

                              <Col span={3} style={{ textAlign: 'center' }}>
                                {index === 0 && <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>當前庫存</div>}
                                {currentStock !== null ? (
                                  <Tag color={currentStock <= 0 ? 'error' : 'processing'}>
                                    {currentStock} {unitStr}
                                  </Tag>
                                ) : (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
                                )}
                              </Col>

                              <Col span={3}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'unitPrice']}
                                  label={index === 0 ? '售價 (NT$)' : ''}
                                  /* 💡 移除 rules={[{ required: true, message: '單價' }]}*/
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
                                 /* 💡 移除 rules={[{ required: true, message: '數量' }]} */
                                  style={{ marginBottom: 0 }}
                                >
                                  <InputNumber min={1} style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>

                              <Col span={3} style={{ textAlign: 'right' }}>
                                {index === 0 && <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>項目小計</div>}
                                <Text strong style={{ color: '#1677ff', fontSize: '14px' }}>
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
                            增加銷售項目
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  <Row gutter={16}>
                    <Col span={14}>
                      <Form.Item name="remark" label="銷貨備註">
                        <Input.TextArea rows={2} placeholder="例：付現免留發票、客訂保留、自取..." />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item name="discountAmount" label="整單折讓 / 折扣額 (NT$)">
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：50 (去零頭)" prefix={<DollarOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginTop: 8 }}>
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Text type="secondary">商品原始小計：${rawTotal.toLocaleString()}</Text>
                        {discount > 0 && (
                          <Text type="warning" style={{ marginLeft: 16 }}>
                            整單折讓：-${discount.toLocaleString()}
                          </Text>
                        )}
                      </Col>
                      <Col>
                        <Space align="baseline">
                          <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>結帳應收總金額：</Text>
                          <Text type="success" style={{ fontSize: '26px', fontWeight: 'bold' }}>
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

      {/* 💡 3. 商品進銷歷史行情 Modal (Ant Design 獨立彈窗) */}
      <Modal
        title={`📊 商品進銷歷史行情 - 【${selectedHistoryProduct.name}】`}
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setHistoryModalOpen(false)}>
            關閉
          </Button>
        ]}
        width={750}
        zIndex={1050} /* 確保覆蓋在開單視窗 (zIndex 1000) 上層 */
      >
        <Spin spinning={historyLoading}>
          <Row gutter={16}>
            {/* 近期銷售紀錄 */}
            <Col span={12}>
              <Card title="🛒 近期銷售紀錄 (售價參考)" size="small" style={{ height: '100%' }}>
                <Table
                  dataSource={productHistoryData.saleHistory || []}
                  rowKey={(r, idx) => 'sale-' + idx}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '日期', dataIndex: 'saleDate', key: 'saleDate', width: 95 },
                    { title: '客戶', dataIndex: 'customerName', key: 'customerName' },
                    { title: '單價', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v) => <span style={{ color: '#1677ff', fontWeight: 'bold' }}>${v}</span> },
                    { title: '數量', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 60 },
                  ]}
                  locale={{ emptyText: '尚無銷售紀錄' }}
                />
              </Card>
            </Col>

            {/* 近期進貨紀錄 */}
            <Col span={12}>
              <Card title="📦 近期進貨紀錄 (成本參考)" size="small" style={{ height: '100%' }}>
                <Table
                  dataSource={productHistoryData.purchaseHistory || []}
                  rowKey={(r, idx) => 'pur-' + idx}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 95 },
                    { title: '廠商', dataIndex: 'supplierName', key: 'supplierName' },
                    { title: '進價', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>${v}</span> },
                    { title: '數量', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 60 },
                  ]}
                  locale={{ emptyText: '尚無進貨紀錄' }}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Modal>

      {/* 檢視明細 Modal */}
      <Modal
        title={`📄 銷貨單明細 - ${selectedOrder?.saleNo || ''}`}
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
            <p><strong>整單折讓：</strong> ${selectedOrder.discountAmount || 0}</p>
            <p><strong>實收總金額：</strong> <Text type="success" style={{ fontSize: '18px', fontWeight: 'bold' }}>${(selectedOrder.totalAmount || 0).toLocaleString()}</Text></p>
            <p><strong>備註：</strong> {selectedOrder.remark || '無'}</p>
            <Divider>銷售商品明細項</Divider>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: '商品編號', dataIndex: 'productCode', key: 'productCode' },
                { title: '品名規格', dataIndex: 'productName', key: 'productName' },
                { title: '銷售單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (val) => `$${val ?? 0}` },
                { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '項目小計', dataIndex: 'subtotal', key: 'subtotal', render: (val) => `$${val ?? 0}` },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default SaleOrderList;