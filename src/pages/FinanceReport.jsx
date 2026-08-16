import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Table, Spin, message, Typography } from 'antd';
import { DollarOutlined, RiseOutlined, TrophyOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportApi } from '../api/reportApi';

const { Title } = Typography;

const FinanceReport = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  
  const [monthlyData, setMonthlyData] = useState({ totalRevenue: 0, totalGrossProfit: 0 });
  const [topProfitable, setTopProfitable] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  // 載入月度營收與毛利
  const fetchMonthlyData = async (date) => {
    setLoading(true);
    try {
      const year = date.year();
      const month = date.month() + 1; // dayjs month 為 0-11
      const res = await reportApi.getMonthlyReport(year, month);
      setMonthlyData(res?.data || res || { totalRevenue: 0, totalGrossProfit: 0 });
    } catch (err) {
      message.error('載入月度財務報表失敗：' + (err.message || '連線異常'));
    } finally {
      setLoading(false);
    }
  };

  // 載入排行榜數據
  const fetchRankings = async () => {
    try {
      const [profitRes, sellRes] = await Promise.all([
        reportApi.getTopProfitableProducts(),
        reportApi.getBestSellingProducts()
      ]);
      setTopProfitable(profitRes?.data || profitRes || []);
      setBestSellers(sellRes?.data || sellRes || []);
    } catch (err) {
      console.error('載入排行榜數據失敗:', err);
    }
  };

  useEffect(() => {
    fetchMonthlyData(selectedMonth);
    fetchRankings();
  }, []);

  const handleMonthChange = (date) => {
    if (date) {
      setSelectedMonth(date);
      fetchMonthlyData(date);
    }
  };

  // 熱銷/獲利表格欄位定義
  const productColumns = [
    { title: '商品名稱/規格', dataIndex: 0, key: 'name' },
    { title: '數值', dataIndex: 1, key: 'val', render: (val) => Number(val || 0).toLocaleString() },
  ];

  return (
    <Card title="📊 奇家五金行 - 財務與毛利分析儀表板" style={{ margin: '8px', flex: 1 }}>
      <Spin spinning={loading}>
        <Row align="middle" style={{ marginBottom: 16 }}>
          <Col style={{ marginRight: 12 }}>
            <Title level={5} style={{ margin: 0 }}>選擇統計月份：</Title>
          </Col>
          <Col>
            <DatePicker 
              picker="month" 
              value={selectedMonth} 
              onChange={handleMonthChange} 
              allowClear={false}
            />
          </Col>
        </Row>

        {/* 營收與毛利數據卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card style={{ background: '#e6f7ff', borderColor: '#91caff' }}>
              <Statistic
                title="當月營業額 (Total Revenue)"
                value={monthlyData.totalRevenue || 0}
                precision={2}
                valueStyle={{ color: '#0958d9', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic
                title="當月營業毛利 (Gross Profit)"
                value={monthlyData.totalGrossProfit || 0}
                precision={2}
                valueStyle={{ color: '#389e0d', fontWeight: 'bold' }}
                prefix={<RiseOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
        </Row>

        {/* 商品排行榜 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="🏆 利潤貢獻排行榜 (Top Profitable)" icon={<TrophyOutlined />}>
              <Table 
                dataSource={topProfitable} 
                columns={productColumns} 
                rowKey={(r, i) => i} 
                pagination={false} 
                size="small" 
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="🛒 熱銷商品銷量榜 (Best Sellers)" icon={<ShoppingCartOutlined />}>
              <Table 
                dataSource={bestSellers} 
                columns={productColumns} 
                rowKey={(r, i) => i} 
                pagination={false} 
                size="small" 
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </Card>
  );
};

export default FinanceReport;