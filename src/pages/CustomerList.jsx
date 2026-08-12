import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Space, Modal, Form, 
  InputNumber, Upload, Tag, message, Popconfirm, Card, Select 
} from 'antd';
import { 
  PlusOutlined, UploadOutlined, SearchOutlined, 
  EditOutlined, ReloadOutlined, MobileOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { customerApi } from '../api/customerApi';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Modal 與 Upload 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();

  // 1. 取得所有客戶
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAllCustomers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      message.error(err.message || '讀取客戶列表失敗！');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. 關鍵字快速過濾 (客戶編號/簡稱/全銜/電話/手機/統編)
  const filteredCustomers = customers.filter((item) => {
    if (!searchText.trim()) return true;
    const kw = searchText.toLowerCase();
    return (
      (item.customerCode && item.customerCode.toLowerCase().includes(kw)) ||
      (item.shortName && item.shortName.toLowerCase().includes(kw)) ||
      (item.fullName && item.fullName.toLowerCase().includes(kw)) ||
      (item.phone && item.phone.includes(kw)) ||
      (item.mobile && item.mobile.includes(kw)) ||
      (item.taxId && item.taxId.includes(kw))
    );
  });

  // 3. 開啟彈窗
  const openModal = (record = null) => {
    setEditingCustomer(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: true, checkoutDay: 31, invoiceType: '三聯式' });
    }
    setIsModalOpen(true);
  };

  // 4. 表單送出
  const handleFormSubmit = async (values) => {
    try {
      if (editingCustomer) {
        const res = await customerApi.updateCustomer(editingCustomer.id, values);
        if (res.success) message.success('客戶資料更新成功！');
      } else {
        const res = await customerApi.createCustomer(values);
        if (res.success) message.success('新增客戶成功！');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      message.error('操作失敗：' + err.message);
    }
  };

  // 5. 切換狀態
  const handleToggleStatus = async (id) => {
    try {
      const res = await customerApi.toggleStatus(id);
      if (res.success) {
        message.success('客戶狀態切換成功！');
        fetchCustomers();
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
      const res = await customerApi.importCustomersExcel(fileList[0].originFileObj);
      message.success(res.data || '客戶資料匯入完成！');
      setIsImportModalOpen(false);
      setFileList([]);
      fetchCustomers();
    } catch (err) {
      message.error('匯入失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. 表格欄位定義
  const columns = [
    {
      title: '客戶編號',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 110,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '客戶簡稱',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 130,
      render: (text) => <Tag color="cyan">{text || '散客'}</Tag>,
    },
    {
      title: '公司/客戶全銜',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
    },
    {
      title: '聯絡電話 / 手機',
      key: 'contact',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={1} style={{ fontSize: '13px' }}>
          {record.phone && <span>☎️ {record.phone}</span>}
          {record.mobile && <span><MobileOutlined /> {record.mobile}</span>}
          {!record.phone && !record.mobile && <span style={{ color: '#ccc' }}>無電話</span>}
        </Space>
      ),
    },
    {
      title: '統一編號',
      dataIndex: 'taxId',
      key: 'taxId',
      width: 120,
      render: (text) => text ? <Tag color="purple"><SafetyCertificateOutlined /> {text}</Tag> : <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '結帳日',
      dataIndex: 'checkoutDay',
      key: 'checkoutDay',
      width: 90,
      align: 'center',
      render: (day) => day ? <Tag color="gold">每月 {day} 日</Tag> : <span style={{ color: '#ccc' }}>隨貨付</span>,
    },
    {
      title: '公司/送貨地址',
      dataIndex: 'companyAddress',
      key: 'companyAddress',
      ellipsis: true,
      render: (text) => text || <span style={{ color: '#ccc' }}>未填寫</span>,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => (
        <Tag color={status ? 'success' : 'error'}>
          {status ? '啟用中' : '已停用'}
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
            title="確定要切換該客戶的啟用狀態嗎？"
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
    <Card title="👥 奇家五金行 - 客戶資料管理" style={{ margin: '10px' }}>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Input
            placeholder="搜尋客戶編號、簡稱、全銜、電話、手機或統編..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
            重新整理
          </Button>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增客戶
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>
            Excel 匯入 (bcust)
          </Button>
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 位客戶` }}
      />

      {/* 新增/編輯 Modal */}
      <Modal
        title={editingCustomer ? '✏️ 修改客戶資料' : '➕ 新增客戶'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText="儲存"
        cancelText="取消"
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="customerCode" label="客戶編號" rules={[{ required: true, message: '請輸入客戶編號' }]}>
              <Input placeholder="例: C001" disabled={!!editingCustomer} />
            </Form.Item>

            <Form.Item name="shortName" label="客戶簡稱" rules={[{ required: true, message: '請輸入客戶簡稱' }]}>
              <Input placeholder="例: 巨匠工程" style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="taxId" label="統一編號">
              <Input placeholder="8碼統編" style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Form.Item name="fullName" label="公司 / 客戶全銜">
            <Input placeholder="例: 巨匠室內裝修設計工程有限公司" />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="contactPerson" label="聯絡人">
              <Input placeholder="例: 陳先生" style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="phone" label="聯絡電話">
              <Input placeholder="例: 04-22223333" style={{ width: 160 }} />
            </Form.Item>

            <Form.Item name="mobile" label="行動電話">
              <Input placeholder="例: 0912-345678" style={{ width: 160 }} />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="checkoutDay" label="結帳日 (每個月第幾天)">
              <InputNumber min={1} max={31} style={{ width: 160 }} addonAfter="日" />
            </Form.Item>

            <Form.Item name="invoiceType" label="發票類型">
              <Select style={{ width: 160 }}>
                <Select.Option value="二聯式">二聯式 (個人/散客)</Select.Option>
                <Select.Option value="三聯式">三聯式 (公司打統編)</Select.Option>
                <Select.Option value="免用統一發票">免用統一發票</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="companyAddress" label="公司 / 送貨地址">
            <Input placeholder="完整送貨或發票寄送地址" />
          </Form.Item>

          <Form.Item name="remark" label="備註">
            <Input.TextArea rows={2} placeholder="付款習慣、折扣條件或其他備忘事項..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Excel 匯入 Modal */}
      <Modal
        title="📥 批次匯入客戶資料 Excel (bcust)"
        open={isImportModalOpen}
        onOk={handleImportExcel}
        onCancel={() => setIsImportModalOpen(false)}
        okText="開始匯入"
        cancelText="取消"
        confirmLoading={loading}
      >
        <p>請選擇包含 <code>bcust</code> 工作表的客戶 Excel 檔案（例如：<code>客戶資料2026.07.10.xlsx</code>）：</p>
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

export default CustomerList;