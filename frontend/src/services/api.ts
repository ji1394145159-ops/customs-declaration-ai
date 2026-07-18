import axios from 'axios';
import type { UploadedFile, ProductInfo, HSCodeCandidate, Declaration } from '../types';

// 生产环境使用 VITE_API_URL 环境变量，开发环境使用代理
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// 上传文件
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// 批量上传
export async function uploadBatch(files: File[]): Promise<{ files: UploadedFile[] }> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const { data } = await api.post('/upload/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// 提取信息
export async function extractInfo(filePath: string, fileType: string): Promise<ProductInfo> {
  const { data } = await api.post('/extract', { file_path: filePath, file_type: fileType });
  return data.data;
}

// HS编码匹配
export async function matchHSCode(productInfo: Partial<ProductInfo>): Promise<HSCodeCandidate[]> {
  const { data } = await api.post('/hscode/match', productInfo);
  return data.candidates;
}

// 生成申报单
export async function generateDeclaration(
  productInfo: ProductInfo,
  targetCountry: string,
  hsCode: string
): Promise<Declaration> {
  const { data } = await api.post('/declaration/generate', {
    product_info: productInfo,
    target_country: targetCountry,
    hs_code: hsCode,
  });
  return data.data;
}

// 更新申报单
export async function updateDeclaration(
  declarationId: string,
  elements: Record<string, string>,
  targetCountry: string
): Promise<Declaration> {
  const { data } = await api.put('/declaration/update', {
    declaration_id: declarationId,
    elements,
    target_country: targetCountry,
  });
  return data.data;
}

// 确认申报单
export async function confirmDeclaration(declarationId: string): Promise<Declaration> {
  const { data } = await api.post(`/declaration/${declarationId}/confirm`);
  return data.data;
}

// 获取申报单列表
export async function getDeclarations(): Promise<Declaration[]> {
  const { data } = await api.get('/declaration/list');
  return data.data;
}

// 导出Excel
export async function exportExcel(declaration: Declaration): Promise<void> {
  const response = await api.post('/export/excel', {
    target_country: declaration.target_country,
    hs_code: declaration.hs_code,
    declaration_elements: declaration.declaration_elements,
    compliance_notes: declaration.compliance_notes,
    completeness_score: declaration.completeness_score,
    risk_fields: declaration.risk_fields,
  }, { responseType: 'blob' });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `报关申报单_${declaration.target_country}_${declaration.hs_code}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// 导出PDF
export async function exportPDF(declaration: Declaration): Promise<void> {
  const response = await api.post('/export/pdf', {
    target_country: declaration.target_country,
    hs_code: declaration.hs_code,
    declaration_elements: declaration.declaration_elements,
    compliance_notes: declaration.compliance_notes,
    completeness_score: declaration.completeness_score,
    risk_fields: declaration.risk_fields,
  }, { responseType: 'blob' });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `报关申报单_${declaration.target_country}_${declaration.hs_code}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
