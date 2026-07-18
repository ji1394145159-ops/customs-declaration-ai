// 上传文件信息
export interface UploadedFile {
  id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
}

// 置信度信息
export interface ConfidenceItem {
  value: string;
  score: number;
  source: 'direct' | 'inferred' | 'translated' | 'unidentified';
}

// AI提取的产品信息
export interface ProductInfo {
  product_name_cn: string | null;
  product_name_en: string | null;
  specification: string | null;
  material: string | null;
  brand: string | null;
  product_category: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  currency: string | null;
  net_weight: number | null;
  gross_weight: number | null;
  packaging: string | null;
  origin_country: string | null;
  confidence: Record<string, ConfidenceItem> | null;
}

// HS编码候选
export interface HSCodeCandidate {
  code: string;
  description_cn: string;
  description_en: string;
  score: number;
  basis: string;
  risks: string[];
}

// 风险字段
export interface RiskField {
  field: string;
  reason: string;
  suggestion: string;
}

// 申报单
export interface Declaration {
  id: string;
  target_country: string;
  hs_code: string;
  declaration_elements: Record<string, string>;
  compliance_notes: string[];
  completeness_score: number;
  risk_fields: RiskField[];
  status: 'draft' | 'reviewed' | 'confirmed';
}

// 目标国家
export type TargetCountry = 'US' | 'EU' | 'ID' | 'VN';

export const COUNTRY_OPTIONS = [
  { value: 'US', label: '🇺🇸 美国', flag: '🇺🇸' },
  { value: 'EU', label: '🇪🇺 欧盟', flag: '🇪🇺' },
  { value: 'ID', label: '🇮🇩 印尼', flag: '🇮🇩' },
  { value: 'VN', label: '🇻🇳 越南', flag: '🇻🇳' },
];
