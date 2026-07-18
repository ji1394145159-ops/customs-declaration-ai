import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, ConfigProvider, theme } from 'antd';
import { UploadOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import UploadPage from './pages/UploadPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import { useState } from 'react';
import type { ProductInfo, UploadedFile, HSCodeCandidate, Declaration } from './types';

const { Header, Content, Footer } = Layout;

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 全局状态
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [hsCandidates, setHsCandidates] = useState<HSCodeCandidate[]>([]);
  const [declaration, setDeclaration] = useState<Declaration | null>(null);

  const menuItems = [
    { key: '/', icon: <UploadOutlined />, label: '单据上传' },
    { key: '/result', icon: <FileTextOutlined />, label: '处理结果' },
    { key: '/history', icon: <HistoryOutlined />, label: '历史记录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Typography.Title level={3} style={{ color: 'white', margin: 0, marginRight: 40, whiteSpace: 'nowrap' }}>
          📦 报关单据AI助手
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={
            <UploadPage
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              productInfo={productInfo}
              setProductInfo={setProductInfo}
              hsCandidates={hsCandidates}
              setHsCandidates={setHsCandidates}
              setDeclaration={setDeclaration}
              navigate={navigate}
            />
          } />
          <Route path="/result" element={
            <ResultPage
              uploadedFile={uploadedFile}
              productInfo={productInfo}
              setProductInfo={setProductInfo}
              hsCandidates={hsCandidates}
              setHsCandidates={setHsCandidates}
              declaration={declaration}
              setDeclaration={setDeclaration}
            />
          } />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', color: '#999' }}>
        跨境电商报关单据AI自动生成与智能校验助手 ©2026
      </Footer>
    </Layout>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
