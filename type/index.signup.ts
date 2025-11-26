export interface ISignup {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  avatar_url?: string;
  last_login: string;
  is_verified: boolean;
}
