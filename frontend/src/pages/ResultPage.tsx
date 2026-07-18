import { useState } from 'react';
import {
  Card, Typography, Table, Tag, Select, Button, Space, Alert,
  Progress, Input, message, Tooltip, Collapse
} from 'antd';
import {
  CheckCircleOutlined, WarningOutlined, EditOutlined,
  ExportOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ProductInfo, HSCodeCandidate, Declaration, TargetCountry } from '../types';
import { COUNTRY_OPTIONS } from '../types';
import { generateDeclaration, updateDeclaration, confirmDeclaration, exportExcel, exportPDF } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface Props {
  uploadedFile: UploadedFile | null;
  productInfo: ProductInfo | null;
  setProductInfo: (info: ProductInfo | null) => void;
  hsCandidates: HSCodeCandidate[];
  setHsCandidates: (candidates: HSCodeCandidate[]) => void;
  declaration: Declaration | null;
  setDeclaration: (d: Declaration | null) => void;
}

export default function ResultPage({
  productInfo,
  hsCandidates, declaration, setDeclaration
}: Props) {
  const [selectedCountry, setSelectedCountry] = useState<TargetCountry>('US');
  const [selectedHsCode, setSelectedHsCode] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!productInfo) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
          <Title level={4} style={{ marginTop: 16 }}>暂无处理数据</Title>
          <Paragraph type="secondary">请先在"单据上传"页面上传并处理文件</Paragraph>
          <Button type="primary" href="/">去上传</Button>
        </div>
      </Card>
    );
  }

  // 置信度标签
  const renderConfidence = (fieldName: string) => {
    const conf = productInfo.confidence?.[fieldName];
    if (!conf) return null;
    const score = conf.score;
    const source = conf.source;
    let color = 'green';
    let text = '高置信';
    if (score < 0.5) { color = 'red'; text = '低置信'; }
    else if (score < 0.8) { color = 'orange'; text = '中置信'; }

    const sourceMap: Record<string, string> = {
      direct: '直接识别',
      inferred: '推断',
      translated: '翻译',
      unidentified: '未识别',
    };

    return (
      <Tooltip title={`置信度: ${(score * 100).toFixed(0)}% | 来源: ${sourceMap[source] || source}`}>
        <Tag color={color} style={{ marginLeft: 4 }}>
          {text} {source === 'unidentified' ? '⚠️' : ''}
        </Tag>
      </Tooltip>
    );
  };

  // AI提取结果表格数据
  const extractTableData = [
    { key: 'product_name_cn', label: '中文品名', value: productInfo.product_name_cn },
    { key: 'product_name_en', label: '英文品名', value: productInfo.product_name_en },
    { key: 'specification', label: '规格型号', value: productInfo.specification },
    { key: 'material', label: '材质成分', value: productInfo.material },
    { key: 'brand', label: '品牌', value: productInfo.brand },
    { key: 'product_category', label: '产品类别', value: productInfo.product_category },
    { key: 'quantity', label: '数量', value: productInfo.quantity },
    { key: 'unit_price', label: '单价', value: productInfo.unit_price },
    { key: 'total_amount', label: '总金额', value: productInfo.total_amount },
    { key: 'currency', label: '币种', value: productInfo.currency },
    { key: 'net_weight', label: '净重(kg)', value: productInfo.net_weight },
    { key: 'gross_weight', label: '毛重(kg)', value: productInfo.gross_weight },
    { key: 'packaging', label: '包装方式', value: productInfo.packaging },
    { key: 'origin_country', label: '原产地', value: productInfo.origin_country },
  ];

  // 生成申报单
  const handleGenerate = async () => {
    if (!selectedHsCode) {
      message.warning('请先选择HS编码');
      return;
    }
    setGenerating(true);
    try {
      const decl = await generateDeclaration(productInfo, selectedCountry, selectedHsCode);
      setDeclaration(decl);
      setEditingFields(decl.declaration_elements);
      message.success('申报单生成成功！');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 保存修改
  const handleSaveEdit = async () => {
    if (!declaration) return;
    try {
      const updated = await updateDeclaration(declaration.id, editingFields, selectedCountry);
      setDeclaration(updated);
      setIsEditing(false);
      message.success('修改已保存');
    } catch (err: any) {
      message.error('保存失败');
    }
  };

  // 确认申报单
  const handleConfirm = async () => {
    if (!declaration) return;
    try {
      const confirmed = await confirmDeclaration(declaration.id);
      setDeclaration(confirmed);
      message.success('申报单已确认！');
    } catch (err: any) {
      message.error('确认失败');
    }
  };

  // 导出
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!declaration) return;
    setExporting(true);
    try {
      if (format === 'excel') {
        await exportExcel(declaration);
      } else {
        await exportPDF(declaration);
      }
      message.success(`${format.toUpperCase()} 导出成功！`);
    } catch (err: any) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* 1. AI提取结果 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>📋 AI提取信息</Title>
        <Table
          dataSource={extractTableData}
          columns={[
            {
              title: '字段',
              dataIndex: 'label',
              width: 120,
              render: (text: string) => <Text strong>{text}</Text>
            },
            {
              title: '提取结果',
              dataIndex: 'value',
              render: (val: any, record: any) => (
                <Space>
                  <Text>{val ?? <Tag color="red">未识别</Tag>}</Text>
                  {renderConfidence(record.key)}
                </Space>
              )
            },
          ]}
          pagination={false}
          size="small"
          bordered
        />
      </Card>

      {/* 2. HS编码选择 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>🔍 HS编码匹配</Title>
        {hsCandidates.length > 0 ? (
          <Table
            dataSource={hsCandidates.map((c, i) => ({ ...c, key: i }))}
            columns={[
              {
                title: 'HS编码',
                dataIndex: 'code',
                width: 120,
                render: (text: string) => <Text strong code>{text}</Text>
              },
              {
                title: '中文描述',
                dataIndex: 'description_cn',
              },
              {
                title: '匹配度',
                dataIndex: 'score',
                width: 100,
                render: (score: number) => (
                  <Progress
                    percent={Math.round(score * 100)}
                    size="small"
                    status={score >= 0.7 ? 'success' : score >= 0.4 ? 'normal' : 'exception'}
                  />
                )
              },
              {
                title: '归类依据',
                dataIndex: 'basis',
                ellipsis: true,
              },
              {
                title: '风险提示',
                dataIndex: 'risks',
                render: (risks: string[]) => risks?.length ? (
                  <Tooltip title={risks.join('\n')}>
                    <Tag color="warning"><WarningOutlined /> {risks.length}条</Tag>
                  </Tooltip>
                ) : <Tag color="success">无</Tag>
              },
              {
                title: '操作',
                width: 80,
                render: (_: any, record: HSCodeCandidate) => (
                  <Button
                    type={selectedHsCode === record.code ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setSelectedHsCode(record.code)}
                  >
                    {selectedHsCode === record.code ? '已选' : '选择'}
                  </Button>
                )
              },
            ]}
            pagination={false}
            size="small"
            bordered
          />
        ) : (
          <Alert message="暂无匹配结果" type="info" />
        )}
      </Card>

      {/* 3. 目标国家选择 & 生成申报单 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>🌍 生成申报单</Title>
        <Space size="large" style={{ marginBottom: 16 }}>
          <div>
            <Text strong>目标国家：</Text>
            <Select
              value={selectedCountry}
              onChange={setSelectedCountry}
              style={{ width: 160, marginLeft: 8 }}
              options={COUNTRY_OPTIONS}
            />
          </div>
          <div>
            <Text strong>选定HS编码：</Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>{selectedHsCode || '未选择'}</Tag>
          </div>
          <Button
            type="primary"
            loading={generating}
            onClick={handleGenerate}
            disabled={!selectedHsCode}
          >
            生成申报单
          </Button>
        </Space>
      </Card>

      {/* 4. 申报单结果 */}
      {declaration && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>📝 申报要素</Title>
              <Space>
                <div>
                  <Text type="secondary">完整度：</Text>
                  <Progress
                    percent={declaration.completeness_score}
                    size="small"
                    style={{ display: 'inline-block', width: 120, marginLeft: 8 }}
                    status={declaration.completeness_score >= 80 ? 'success' : 'normal'}
                  />
                </div>
                <Tag color={declaration.status === 'confirmed' ? 'green' : declaration.status === 'reviewed' ? 'blue' : 'default'}>
                  {declaration.status === 'confirmed' ? '已确认' : declaration.status === 'reviewed' ? '已复核' : '草稿'}
                </Tag>
              </Space>
            </div>

            {/* 风险提示 */}
            {declaration.risk_fields.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="以下字段需要人工核实"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {declaration.risk_fields.map((r, i) => (
                      <li key={i}><Text strong>{r.field}</Text>: {r.reason} - {r.suggestion}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {/* 申报要素表格 */}
            <Table
              dataSource={Object.entries(
                isEditing ? editingFields : declaration.declaration_elements
              ).map(([key, value], i) => ({ key: i, field: key, value }))}
              columns={[
                {
                  title: '申报要素',
                  dataIndex: 'field',
                  width: 160,
                  render: (text: string) => {
                    const isRisk = declaration.risk_fields.some(r => r.field === text);
                    return (
                      <Space>
                        <Text strong>{text}</Text>
                        {isRisk && <Tag color="warning"><WarningOutlined /></Tag>}
                      </Space>
                    );
                  }
                },
                {
                  title: '内容',
                  dataIndex: 'value',
                  render: (val: string, record: any) => {
                    if (isEditing) {
                      return (
                        <Input
                          value={editingFields[record.field] || ''}
                          onChange={(e) => setEditingFields(prev => ({
                            ...prev, [record.field]: e.target.value
                          }))}
                          size="small"
                        />
                      );
                    }
                    return <Text>{val || <Tag>待填写</Tag>}</Text>;
                  }
                },
              ]}
              pagination={false}
              size="small"
              bordered
            />

            {/* 合规提示 */}
            {declaration.compliance_notes.length > 0 && (
              <Collapse
                style={{ marginTop: 16 }}
                items={[{
                  key: '1',
                  label: <Text strong>⚠️ 合规提示 ({declaration.compliance_notes.length}条)</Text>,
                  children: (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {declaration.compliance_notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  )
                }]}
              />
            )}
          </Card>

          {/* 5. 操作按钮 */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                {!isEditing ? (
                  <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                    编辑修改
                  </Button>
                ) : (
                  <>
                    <Button type="primary" onClick={handleSaveEdit}>保存修改</Button>
                    <Button onClick={() => { setIsEditing(false); setEditingFields(declaration.declaration_elements); }}>
                      取消
                    </Button>
                  </>
                )}
              </Space>
              <Space>
                {declaration.status !== 'confirmed' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirm}>
                    确认申报单
                  </Button>
                )}
                <Button
                  icon={<ExportOutlined />}
                  loading={exporting}
                  onClick={() => handleExport('excel')}
                >
                  导出Excel
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  loading={exporting}
                  onClick={() => handleExport('pdf')}
                >
                  导出PDF
                </Button>
              </Space>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
