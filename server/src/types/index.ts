// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Response types
export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Date;
  submittedBy?: string;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// Token types
export interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: Date;
  lastUsed?: Date;
}

// Database types
export interface DbConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    multipleActiveResultSets: boolean;
  };
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password'>;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
} 