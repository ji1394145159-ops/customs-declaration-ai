import { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Empty, message, Select } from 'antd';
import { ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import type { Declaration } from '../types';
import { COUNTRY_OPTIONS } from '../types';
import { getDeclarations, exportExcel, exportPDF } from '../services/api';

const { Title, Text } = Typography;

export default function HistoryPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDeclarations();
      setDeclarations(data);
    } catch (err: any) {
      message.error('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = filterCountry
    ? declarations.filter(d => d.target_country === filterCountry)
    : declarations;

  const handleExport = async (record: Declaration, format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') await exportExcel(record);
      else await exportPDF(record);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const countryNameMap: Record<string, string> = { US: '美国', EU: '欧盟', ID: '印尼', VN: '越南' };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>📚 历史记录</Title>
          <Space>
            <Select
              allowClear
              placeholder="筛选国家"
              style={{ width: 140 }}
              value={filterCountry}
              onChange={setFilterCountry}
              options={COUNTRY_OPTIONS}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
          </Space>
        </div>

        <Table
          dataSource={filtered.map(d => ({ ...d, key: d.id }))}
          loading={loading}
          columns={[
            { title: 'HS编码', dataIndex: 'hs_code', width: 120, render: (t: string) => <Text code>{t}</Text> },
            {
              title: '目标国家',
              dataIndex: 'target_country',
              width: 100,
              render: (t: string) => <Tag color="blue">{countryNameMap[t] || t}</Tag>
            },
            {
              title: '完整度',
              dataIndex: 'completeness_score',
              width: 100,
              render: (v: number) => <Text>{v}%</Text>
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s: string) => (
                <Tag color={s === 'confirmed' ? 'green' : s === 'reviewed' ? 'blue' : 'default'}>
                  {s === 'confirmed' ? '已确认' : s === 'reviewed' ? '已复核' : '草稿'}
                </Tag>
              )
            },
            {
              title: '主要商品',
              dataIndex: 'declaration_elements',
              render: (els: Record<string, string>) => <Text>{els?.['商品描述'] || '-'}</Text>
            },
            {
              title: '操作',
              width: 160,
              render: (_: any, record: Declaration) => (
                <Space>
                  <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(record, 'excel')}>Excel</Button>
                  <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(record, 'pdf')}>PDF</Button>
                </Space>
              )
            },
          ]}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无历史记录" /> }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
}
