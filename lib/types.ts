export interface ExtractedFields {
  name: string;
  address: string;
  dob: string;
  annual_income: string;
  income_protection_benefit: string;
  deferral_period: string;
  occupation: string;
  smoking_status: string;
  mobile: string;
  email: string;
}

export interface UploadResponse {
  success: boolean;
  downloadUrl?: string;
  downloadUrl2?: string;
  fields?: ExtractedFields;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
}
