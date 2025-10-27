export interface ApiResponse<T = any> {
  data?: T;
  message: string;
  timestamp: string;
  success: boolean;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  field?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string[];
}

export interface FilterRequest {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL'
}

export interface SearchRequest {
  query: string;
  filters?: FilterRequest[];
  page?: PageRequest;
}

// HTTP Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Form States
export interface FormState<T> {
  data: T;
  isValid: boolean;
  isDirty: boolean;
  errors: FormErrors;
  isSubmitting: boolean;
}

export interface FormErrors {
  [key: string]: string | string[];
}

// File Upload
export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}
