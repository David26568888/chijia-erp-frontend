import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { 
  ShoppingOutlined, 
  ShopOutlined, 
  UserOutlined, 
  ImportOutlined, 
  ExportOutlined 
} from '@ant-design/icons';
import ProductList from './pages/ProductList';
import SupplierList from './pages/SupplierList';
import CustomerList from './pages/CustomerList';
import PurchaseOrderList from './pages/PurchaseOrderList';
import SaleOrderList from './pages/SaleOrderList'; // 👈 匯入銷貨模組

const { Header, Content, Sider } = Layout;

const App = () => {
  const [selectedKey, setSelectedKey] = useState('1');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    { key: '1', icon: <ShoppingOutlined />, label: '商品與三軌成本控管' },
    { key: '2', icon: <ShopOutlined />, label: '廠商資料管理' },
    { key: '3', icon: <UserOutlined />, label: '客戶資料管理' },
    { key: '4', icon: <ImportOutlined />, label: '進貨單管理' },
    { key: '5', icon: <ExportOutlined />, label: '門市 POS 銷貨單' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: 6,
          color: '#fff',
          textAlign: 'center',
          lineHeight: '32px',
          fontWeight: 'bold'
        }}>
          🛠️ 奇家五金 ERP
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[selectedKey]}
          onClick={(e) => setSelectedKey(e.key)}
          items={menuItems} 
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1677ff' }}>奇家五金商行 - 全端進銷存管理系統</h2>
          <span style={{ color: '#8c8c8c' }}>登入者：系統管理者 (Admin)</span>
        </Header>

        <Content style={{ margin: '16px' }}>
          <div style={{ 
            padding: 12, 
            minHeight: 360, 
            background: colorBgContainer, 
            borderRadius: borderRadiusLG 
          }}>
            {selectedKey === '1' && <ProductList />}
            {selectedKey === '2' && <SupplierList />}
            {selectedKey === '3' && <CustomerList />}
            {selectedKey === '4' && <PurchaseOrderList />}
            {selectedKey === '5' && <SaleOrderList />} {/* 👈 5 大模組全數上線 */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;