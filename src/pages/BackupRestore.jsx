import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, message, Upload, Divider, Alert } from 'antd';
import { 
  DownloadOutlined, UploadOutlined, DatabaseOutlined, 
  SafetyCertificateOutlined, InboxOutlined 
} from '@ant-design/icons';
import { backupApi } from '../api/backupApi';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const BackupRestore = () => {
  const [downloading, setDownloading] = useState(false);
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

  // 2. 處理還原匯入
  const handleImport = async () => {
    if (!uploadFile) {
      message.error('請先選擇要還原的 Excel 備份檔！');
      return;
    }
    setUploading(true);
    try {
      const res = await backupApi.importProducts(uploadFile);
      if (res?.success) {
        message.success('🛡️ 系統商品資料已成功災難還原！');
        setUploadFile(null);
      }
    } catch (err) {
      message.error('還原失敗：' + (err.message || '檔案格式無效'));
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
    <div style={{ padding: '8px' }}>
      <Card title="🛡️ 奇家五金行 - 系統資料一鍵備份與災難還原中心">
        <Alert
          message="災難復原提示 (Disaster Recovery)"
          description="建議每日營業結束後，點擊下方「一鍵匯出備份」將 5 大模組資料下載存至隨身碟。即使電腦損壞，在新電腦安裝系統後上傳備份檔即可 100% 完美還原全店資料！"
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 20 }}
        />

        <Title level={4}>📤 1. 一鍵匯出資料庫備份 (Export)</Title>
        <Row gutter={[16, 16]}>
          {modules.map((m) => (
            <Col xs={24} sm={12} md={8} key={m.key}>
              <Card size="small" bordered style={{ borderColor: m.color }}>
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

        <Title level={4}>📥 2. 一鍵災難復原匯入 (Import & Restore)</Title>
        <Row gutter={16}>
          <Col span={16}>
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
                <InboxOutlined style={{ color: '#1677ff', fontSize: '40px' }} />
              </p>
              <p className="ant-upload-text">點擊或將備份檔 (.xlsx / .xls) 拖拽至此區域</p>
              <p className="ant-upload-hint">上傳備份 Excel 後，系統將自動覆蓋與補齊最新商品、成本與庫存紀錄</p>
            </Dragger>
          </Col>
          <Col span={8} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleImport}
              block
              style={{ height: '60px', fontSize: '18px' }}
            >
              執行一鍵還原入庫
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default BackupRestore;