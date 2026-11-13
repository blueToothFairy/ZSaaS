import { Knex } from 'knex';
import { AuthUserDTO } from '../dto/auth.dto.js';

export type IAuthUser = AuthUserDTO;

export interface IAuthRepository {
  findAuthUserByEmail(email: string, executor?: Knex | Knex.Transaction): Promise<IAuthUser | undefined>;
  findAuthUserById(userId: string, executor?: Knex | Knex.Transaction): Promise<IAuthUser | undefined>;
  findPasswordHash(userId: string): Promise<string | undefined>;
  createPasswordAccount(user: IAuthUser, passwordHash: string, refresh: RefreshSessionInput): Promise<void>;
  createRefreshSession(userId: string, refresh: RefreshSessionInput): Promise<void>;
  rotateRefreshSession(tokenHash: string, replacement: RefreshSessionInput): Promise<{ kind: 'ok'; user: IAuthUser } | { kind: 'expired' }>;
  revokeRefreshSession(tokenHash: string): Promise<void>;
  addPassword(userId: string, passwordHash: string): Promise<'added' | 'exists'>;
  findGoogleIdentity(subject: string): Promise<{ userId: string } | undefined>;
  createGoogleAccount(user: IAuthUser, subject: string, email: string, refresh: RefreshSessionInput): Promise<void>;
  linkGoogleIdentity(userId: string, subject: string, email: string): Promise<'linked' | 'already-linked' | 'identity-conflict' | 'email-conflict' | 'missing-user'>;
}

export interface RefreshSessionInput {
  id: string;
  tokenHash: string;
  expiresAt: Date;
}
