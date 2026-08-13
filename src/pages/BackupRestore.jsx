import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, message, Upload, Divider, Alert, Select } from 'antd';
import { 
  DownloadOutlined, UploadOutlined, DatabaseOutlined, 
  SafetyCertificateOutlined, InboxOutlined 
} from '@ant-design/icons';
import { backupApi } from '../api/backupApi';

const { Title, Text } = Typography;

const BackupRestore = () => {
  const [downloading, setDownloading] = useState(false);
  const [uploadType, setUploadType] = useState('products_backup');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 1. 處理匯出下載
  const handleExport = async (type, name) => {
    setDownloading(true);
    try {
      const response = await backupApi.exportBackup(type);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `奇家五金_${name}_備份_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`🎉 ${name} 資料備份匯出成功！`);
    } catch (err) {
      console.error('匯出失敗:', err);
      message.error(`${name} 備份匯出失敗，請重試！`);
    } finally {
      setDownloading(false);
    }
  };

  // 2. 處理還原匯入 (支援商品、客戶、廠商之雙軌分流)
  const handleImport = async () => {
    if (!uploadFile) {
      message.error('請先選擇要還原的 Excel 檔案！');
      return;
    }
    setUploading(true);
    try {
      let res;
      switch (uploadType) {
        case 'products_backup':
          res = await backupApi.restoreProductsBackup(uploadFile);
          break;
        case 'products_raw':
          res = await backupApi.importProductsRaw(uploadFile);
          break;
        case 'suppliers_backup':
          res = await backupApi.restoreSuppliersBackup(uploadFile);
          break;
        case 'suppliers_raw':
          res = await backupApi.importSuppliersRaw(uploadFile);
          break;
        case 'customers_backup':
          res = await backupApi.restoreCustomersBackup(uploadFile);
          break;
        case 'customers_raw':
          res = await backupApi.importCustomersRaw(uploadFile);
          break;
        default:
          throw new Error('未知的還原目標類型');
      }

      const successMsg = res?.data?.message || res?.data?.data || '資料已成功災難還原入庫！';
      message.success(`🛡️ ${successMsg}`);
      setUploadFile(null);
    } catch (err) {
      console.error('還原錯誤:', err);
      const errorMsg = err.response?.data?.message || err.message || '檔案格式無效或伺服器連線異常';
      message.error('還原失敗：' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const modules = [
    { key: 'products', name: '商品與三軌成本', color: '#1677ff' },
    { key: 'suppliers', name: '廠商資料', color: '#722ed1' },
    { key: 'customers', name: '客戶資料', color: '#52c41a' },
    { key: 'purchases', name: '進貨歷史單據', color: '#fa8c16' },
    { key: 'sales', name: '銷貨門市紀錄', color: '#eb2f96' },
  ];

  return (
    <div style={{ padding: '8px', width: '100%' }}>
      <Card variant="outlined" title="🛡️ 奇家五金行 - 系統資料一鍵備份與災難還原中心">
        <Alert
          title="災難復原提示 (Disaster Recovery)"
          description="建議每日營業結束後點擊下方匯出備份。若需還原，請務必依檔案類型（本系統備份檔 vs 舊系統原始報表）精準選擇目標再上傳！"
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 20 }}
        />

        <Title level={4}>📤 1. 一鍵匯出資料庫備份 (Export)</Title>
        <Row gutter={[16, 16]}>
          {modules.map((m) => (
            <Col xs={24} sm={12} md={8} key={m.key}>
              <Card size="small" variant="outlined" style={{ borderColor: m.color }}>
                <Row align="middle" justify="space-between">
                  <Col>
                    <Text strong style={{ color: m.color, fontSize: '15px' }}>
                      <DatabaseOutlined /> {m.name}
                    </Text>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      loading={downloading}
                      onClick={() => handleExport(m.key, m.name)}
                      style={{ background: m.color }}
                    >
                      匯出 .xlsx
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        <Title level={4}>📥 2. 指定模組一鍵災難復原 (Import & Restore)</Title>
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={12}>
            <span style={{ fontWeight: 'bold', marginRight: 8 }}>選擇要還原的資料目標：</span>
            <Select
              value={uploadType}
              onChange={(val) => setUploadType(val)}
              style={{ width: 320 }}
              options={[
                { value: 'products_backup', label: '📦 本系統商品備份檔 (11欄標準)' },
                { value: 'products_raw', label: '📊 舊系統原始商品報表 (期初大張)' },
                { value: 'suppliers_backup', label: '🏢 本系統廠商備份檔' },
                { value: 'suppliers_raw', label: '📊 舊系統原始廠商報表' },
                { value: 'customers_backup', label: '👤 本系統客戶備份檔' },
                { value: 'customers_raw', label: '📊 舊系統原始客戶報表' },
              ]}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            {/* 💡 修正處：使用 Upload.Dragger 取代直接呼叫 Dragger */}
            <Upload.Dragger
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
                <InboxOutlined style={{ color: '#1677ff', fontSize: '40px' }} />
              </p>
              <p className="ant-upload-text">點擊或將對應的 Excel 備份檔拖拽至此區域</p>
              <p className="ant-upload-hint">系統將依照您上方選擇的目標類別，精準還原至對應的 MySQL 資料表中</p>
            </Upload.Dragger>
          </Col>
          <Col span={8} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleImport}
              block
              style={{ height: '60px', fontSize: '18px', background: '#52c41a' }}
            >
              執行精準還原入庫
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default BackupRestore;