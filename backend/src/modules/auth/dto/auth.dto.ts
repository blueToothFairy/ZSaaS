export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface PasswordLinkDTO {
  password: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}
