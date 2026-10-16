export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokenResponse {
  readonly accessToken: string;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface JwtPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly name?: string;
  readonly exp?: number;
}
