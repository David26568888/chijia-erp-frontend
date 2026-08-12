import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Space, Modal, Form, 
  Upload, Tag, message, Popconfirm, Card, Tooltip 
} from 'antd';
import { 
  PlusOutlined, UploadOutlined, SearchOutlined, 
  EditOutlined, ReloadOutlined, PhoneOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { supplierApi } from '../api/supplierApi';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // 彈窗與檔案狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [fileList, setFileList] = useState([]);

  const [form] = Form.useForm();

  // 1. 取得所有廠商資料
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAllSuppliers();
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (err) {
      message.error(err.message || '讀取廠商列表失敗！');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 2. 前端關鍵字快速過濾 (廠商編號/簡稱/全稱/電話/統編)
  const filteredSuppliers = suppliers.filter((item) => {
    if (!searchText.trim()) return true;
    const kw = searchText.toLowerCase();
    return (
      (item.supplierCode && item.supplierCode.toLowerCase().includes(kw)) ||
      (item.shortName && item.shortName.toLowerCase().includes(kw)) ||
      (item.fullName && item.fullName.toLowerCase().includes(kw)) ||
      (item.phone && item.phone.includes(kw)) ||
      (item.taxId && item.taxId.includes(kw))
    );
  });

  // 3. 開啟新增/修改 Modal 彈窗
  const openModal = (record = null) => {
    setEditingSupplier(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
    setIsModalOpen(true);
  };

  // 4. 送出新增或編輯表單
  const handleFormSubmit = async (values) => {
    try {
      if (editingSupplier) {
        const res = await supplierApi.updateSupplier(editingSupplier.id, values);
        if (res.success) message.success('廠商資料更新成功！');
      } else {
        const res = await supplierApi.createSupplier(values);
        if (res.success) message.success('新增廠商成功！');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      message.error('操作失敗：' + err.message);
    }
  };

  // 5. 切換廠商啟用/停用狀態
  const handleToggleStatus = async (id) => {
    try {
      const res = await supplierApi.toggleStatus(id);
      if (res.success) {
        message.success('廠商狀態切換成功！');
        fetchSuppliers();
      }
    } catch (err) {
      message.error('狀態切換失敗：' + err.message);
    }
  };

  // 6. Excel 批次匯入廠商 (解析 bsupp 工作表)
  const handleImportExcel = async () => {
    if (fileList.length === 0) {
      message.warning('請先選擇要上傳的 Excel 檔案！');
      return;
    }
    setLoading(true);
    try {
      const res = await supplierApi.importSuppliersExcel(fileList[0].originFileObj);
      message.success(res.data || '廠商資料匯入完成！');
      setIsImportModalOpen(false);
      setFileList([]);
      fetchSuppliers();
    } catch (err) {
      message.error('匯入失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. 定義表格欄位
  const columns = [
    {
      title: '廠商編號',
      dataIndex: 'supplierCode',
      key: 'supplierCode',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '廠商簡稱',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 140,
      render: (text) => <Tag color="blue">{text || '無簡稱'}</Tag>,
    },
    {
      title: '公司全銜',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
    },
    {
      title: '聯絡電話',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text) => text ? <span><PhoneOutlined /> {text}</span> : <span style={{ color: '#ccc' }}>無電話</span>,
    },
    {
      title: '統一編號',
      dataIndex: 'taxId',
      key: 'taxId',
      width: 120,
      render: (text) => text ? <Tag color="geekblue"><SafetyCertificateOutlined /> {text}</Tag> : <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '公司地址',
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
          {status ? '合作中' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '操作選項',
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
            title="確定要變更該廠商的合作狀態嗎？"
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
    <Card title="🏭 奇家五金行 - 廠商資料管理" style={{ margin: '10px' }}>
      {/* 搜尋欄與控制按鈕 */}
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Input
            placeholder="搜尋廠商編號、簡稱、全銜、電話或統編..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 340 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchSuppliers}>
            整理頁面
          </Button>
        </Space>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增廠商
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>
            Excel 匯入 (bsupp)
          </Button>
        </Space>
      </Space>

      {/* 廠商列表表格 */}
      <Table
        columns={columns}
        dataSource={filteredSuppliers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 家廠商` }}
      />

      {/* 新增/修改廠商彈窗 Modal */}
      <Modal
        title={editingSupplier ? '✏️ 修改廠商資料' : '➕ 新增廠商'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        okText="儲存"
        cancelText="取消"
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="supplierCode" label="廠商編號" rules={[{ required: true, message: '請輸入廠商編號' }]}>
              <Input placeholder="例: SUP001" disabled={!!editingSupplier} />
            </Form.Item>
            <Form.Item name="shortName" label="廠商簡稱" rules={[{ required: true, message: '請輸入廠商簡稱' }]}>
              <Input placeholder="例: 泳淼/佳晶" />
            </Form.Item>
            <Form.Item name="taxId" label="統一編號">
              <Input placeholder="8碼統編" style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Form.Item name="fullName" label="公司全銜">
            <Input placeholder="例: 泳淼企業有限公司" />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="contactPerson" label="聯絡人">
              <Input placeholder="例: 王先生" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="phone" label="公司電話">
              <Input placeholder="例: 04-26390499" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="mobile" label="行動電話">
              <Input placeholder="例: 0937-232320" style={{ width: 180 }} />
            </Form.Item>
          </Space>

          <Form.Item name="companyAddress" label="公司地址">
            <Input placeholder="完整通訊或送貨地址" />
          </Form.Item>

          <Form.Item name="remark" label="備註說明">
            <Input.TextArea rows={2} placeholder="付款條件、出貨習慣或其他紀錄..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Excel 批次匯入 Modal */}
      <Modal
        title="📥 批次匯入廠商資料 Excel (bsupp)"
        open={isImportModalOpen}
        onOk={handleImportExcel}
        onCancel={() => setIsImportModalOpen(false)}
        okText="開始匯入"
        cancelText="取消"
        confirmLoading={loading}
      >
        <p>請選擇包含 <code>bsupp</code> 工作表的廠商 Excel 檔（如：<code>廠商資料2026.07.10.xlsx</code>）：</p>
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

export default SupplierList;