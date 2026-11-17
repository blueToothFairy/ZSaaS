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
  authMethods?: AuthMethodsDTO;
}

export interface AuthMethodsDTO {
  password: boolean;
  google: boolean;
}

export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}
