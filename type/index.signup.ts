export interface ISignup {
  first_name: string;
  last_name: string;
  location: string;
  email: string;
  password: string;
  confirm_password: string;
  avatar_url?: string;
  last_login: string;
  is_verified: boolean;
}
