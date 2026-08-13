import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, ConfigProvider } from 'antd';
import { 
  AppstoreOutlined, 
  TeamOutlined, 
  UserOutlined, 
  ImportOutlined, 
  ShoppingCartOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import zhTW from 'antd/locale/zh_TW';

import ProductList from './pages/ProductList';
import SupplierList from './pages/SupplierList';
import CustomerList from './pages/CustomerList';
import PurchaseOrderList from './pages/PurchaseOrderList';
import SaleOrderList from './pages/SaleOrderList';
import BackupRestore from './pages/BackupRestore';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: <Link to="/products">商品與三軌成本控管</Link>,
    },
    {
      key: '/suppliers',
      icon: <TeamOutlined />,
      label: <Link to="/suppliers">廠商資料管理</Link>,
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: <Link to="/customers">客戶資料管理</Link>,
    },
    {
      key: '/purchase-orders',
      icon: <ImportOutlined />,
      label: <Link to="/purchase-orders">進貨單管理</Link>,
    },
    {
      key: '/sale-orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/sale-orders">門市 POS 銷貨單</Link>,
    },
    {
      key: '/backup',
      icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
      label: <Link to="/backup">🛡️ 系統備份與還原</Link>,
    },
  ];

  return (
    <Layout style={{ height: '100vh', width: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* 頂部標題列 */}
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 64 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          🛠️ 奇家五金商行 - 全端進銷存管理系統
        </Title>
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>登入者: 系統管理者 (Admin)</span>
      </Header>

      {/* 下方主體：使用 flex 左右並排 */}
      <Layout style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 'calc(100vh - 64px)', margin: 0, padding: 0 }}>
        {/* 左側導覽列 */}
        <Sider width={220} theme="dark" style={{ height: '100%', overflowY: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        {/* 💡 關鍵修正：Content 設為 flex 容器，確保內部頁面 Card 能 100% 撐滿 */}
        <Content style={{ flex: 1, margin: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/suppliers" element={<SupplierList />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/purchase-orders" element={<PurchaseOrderList />} />
              <Route path="/sale-orders" element={<SaleOrderList />} />
              <Route path="/backup" element={<BackupRestore />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhTW}>
      <Router>
        <MainLayout />
      </Router>
    </ConfigProvider>
  );
};

export default App;