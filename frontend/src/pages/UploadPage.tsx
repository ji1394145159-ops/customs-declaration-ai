import { useState } from 'react';
import { Card, Upload, Button, Steps, message, Typography, Space, Spin, Alert, Image, Progress } from 'antd';
import { InboxOutlined, RocketOutlined, FileImageOutlined, SearchOutlined } from '@ant-design/icons';
import type { ProductInfo, UploadedFile, HSCodeCandidate, Declaration } from '../types';
import { uploadFile, extractInfo, matchHSCode } from '../services/api';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface Props {
  uploadedFile: UploadedFile | null;
  setUploadedFile: (f: UploadedFile | null) => void;
  productInfo: ProductInfo | null;
  setProductInfo: (info: ProductInfo | null) => void;
  hsCandidates: HSCodeCandidate[];
  setHsCandidates: (candidates: HSCodeCandidate[]) => void;
  setDeclaration: (d: Declaration | null) => void;
  navigate: (path: string) => void;
}

export default function UploadPage({
  uploadedFile, setUploadedFile, productInfo, setProductInfo,
  setHsCandidates, navigate
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleUpload = async (file: File) => {
    setLoading(true);
    setLoadingText('正在上传文件...');
    try {
      const result = await uploadFile(file);
      setUploadedFile(result);
      setPreviewUrl(URL.createObjectURL(file));
      message.success('文件上传成功！');
      setCurrentStep(1);

      // 自动开始提取
      setLoadingText('AI正在分析文档，提取关键信息...');
      const info = await extractInfo(result.file_path, result.file_type);
      setProductInfo(info);
      message.success('信息提取完成！');
      setCurrentStep(2);

      // 自动匹配HS编码
      setLoadingText('正在匹配HS编码...');
      const candidates = await matchHSCode(info);
      setHsCandidates(candidates);
      message.success('HS编码匹配完成！');
      setCurrentStep(3);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || err.message || '处理失败');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleGoToResult = () => {
    if (!productInfo) {
      message.warning('请先上传并处理单据');
      return;
    }
    navigate('/result');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Steps
        current={currentStep}
        items={[
          { title: '上传单据', icon: <FileImageOutlined /> },
          { title: 'AI提取信息', icon: <SearchOutlined /> },
          { title: 'HS编码匹配', icon: <SearchOutlined /> },
          { title: '生成申报单', icon: <RocketOutlined /> },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Title level={4}>📤 上传产品说明书 / 采购单 / 发票</Title>
        <Text type="secondary">支持 JPG、PNG、PDF 格式，单文件最大 20MB</Text>

        <div style={{ marginTop: 24 }}>
          <Dragger
            name="file"
            multiple={false}
            accept=".jpg,.jpeg,.png,.pdf"
            showUploadList={false}
            disabled={loading}
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 JPG/PNG/PDF 格式</p>
          </Dragger>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text strong>{loadingText}</Text>
            </div>
            <Progress percent={currentStep * 25} status="active" style={{ marginTop: 8 }} />
          </div>
        )}

        {previewUrl && !loading && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>📄 上传的文件预览</Title>
            {uploadedFile?.file_type === 'pdf' ? (
              <Alert message="PDF文件已上传" type="info" showIcon />
            ) : (
              <Image src={previewUrl} style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }} />
            )}
          </div>
        )}

        {currentStep >= 3 && !loading && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space>
              <Button type="primary" size="large" onClick={handleGoToResult}>
                🚀 查看处理结果 & 生成申报单
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {currentStep >= 2 && productInfo && !loading && (
        <Card style={{ marginTop: 16 }}>
          <Title level={5}>📋 AI提取结果预览</Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {Object.entries({
              '中文品名': productInfo.product_name_cn,
              '英文品名': productInfo.product_name_en,
              '规格型号': productInfo.specification,
              '材质成分': productInfo.material,
              '品牌': productInfo.brand,
              '产品类别': productInfo.product_category,
              '数量': productInfo.quantity,
              '单价': productInfo.unit_price,
              '总金额': productInfo.total_amount,
              '币种': productInfo.currency,
              '净重(kg)': productInfo.net_weight,
              '毛重(kg)': productInfo.gross_weight,
              '包装方式': productInfo.packaging,
              '原产地': productInfo.origin_country,
            }).map(([label, value]) => (
              <div key={label}>
                <Text type="secondary">{label}：</Text>
                <Text strong>{value ?? '未识别'}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
