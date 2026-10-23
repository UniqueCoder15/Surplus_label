export type UserRole = 'donor' | 'recipient' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationName: string;
  contactName: string;
  phone?: string;
  address?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  role: 'donor' | 'recipient';
  organizationName: string;
  contactName: string;
  phone?: string;
  address?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}
