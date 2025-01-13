export interface AuthState {
  user: {
    name: string;
    email: string;
    phone?: string;
  } | null;
} 