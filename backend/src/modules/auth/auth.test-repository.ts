import { randomUUID } from 'node:crypto';
import { Knex } from 'knex';
import { AuthMethodsDTO } from './dto/auth.dto.js';
import { IAuthRepository, IAuthUser, RefreshSessionInput } from './interfaces/auth.interface.js';

interface MemorySession {
  userId: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: string;
}

interface MemoryResetToken {
  userId: string;
  expiresAt: Date;
  consumedAt?: Date;
}

export default class AuthTestRepository implements IAuthRepository {
  private readonly usersById = new Map<string, IAuthUser>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly passwordHashes = new Map<string, string>();
  private readonly googleUserIdBySubject = new Map<string, string>();
  private readonly sessionsByHash = new Map<string, MemorySession>();
  private readonly resetTokensByHash = new Map<string, MemoryResetToken>();

  async findAuthUserByEmail(email: string, _executor?: Knex | Knex.Transaction): Promise<IAuthUser | undefined> {
    const id = this.userIdByEmail.get(email.toLowerCase());
    const user = id ? this.usersById.get(id) : undefined;
    return user ? { ...user } : undefined;
  }

  async findAuthUserById(userId: string, _executor?: Knex | Knex.Transaction): Promise<IAuthUser | undefined> {
    const user = this.usersById.get(userId);
    return user ? { ...user } : undefined;
  }

  async getAuthMethods(userId: string): Promise<AuthMethodsDTO> {
    return {
      password: this.passwordHashes.has(userId),
      google: [...this.googleUserIdBySubject.values()].includes(userId),
    };
  }

  async findPasswordHash(userId: string): Promise<string | undefined> { return this.passwordHashes.get(userId); }

  async createPasswordAccount(user: IAuthUser, passwordHash: string, refresh: RefreshSessionInput): Promise<void> {
    this.usersById.set(user.id, { ...user });
    this.userIdByEmail.set(user.email.toLowerCase(), user.id);
    this.passwordHashes.set(user.id, passwordHash);
    await this.createRefreshSession(user.id, refresh);
  }

  async createRefreshSession(userId: string, refresh: RefreshSessionInput): Promise<void> {
    this.sessionsByHash.set(refresh.tokenHash, { userId, expiresAt: refresh.expiresAt });
  }

  async rotateRefreshSession(tokenHash: string, replacement: RefreshSessionInput): Promise<{ kind: 'ok'; user: IAuthUser } | { kind: 'expired' }> {
    const session = this.sessionsByHash.get(tokenHash);
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      if (session?.revokedAt) {
        for (const current of this.sessionsByHash.values()) if (current.userId === session.userId && !current.revokedAt) current.revokedAt = new Date();
      }
      return { kind: 'expired' };
    }
    const user = this.usersById.get(session.userId);
    if (!user) return { kind: 'expired' };
    await this.createRefreshSession(session.userId, replacement);
    session.revokedAt = new Date();
    session.replacedBy = replacement.tokenHash;
    return { kind: 'ok', user: { ...user } };
  }

  async revokeRefreshSession(tokenHash: string): Promise<void> {
    const session = this.sessionsByHash.get(tokenHash);
    if (session && !session.revokedAt) session.revokedAt = new Date();
  }

  async addPassword(userId: string, passwordHash: string): Promise<'added' | 'exists'> {
    if (this.passwordHashes.has(userId)) return 'exists';
    this.passwordHashes.set(userId, passwordHash);
    return 'added';
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    for (const token of this.resetTokensByHash.values()) if (token.userId === userId && !token.consumedAt) token.consumedAt = new Date();
    this.resetTokensByHash.set(tokenHash, { userId, expiresAt });
  }

  async resetPassword(tokenHash: string, passwordHash: string): Promise<boolean> {
    const token = this.resetTokensByHash.get(tokenHash);
    if (!token || token.consumedAt || token.expiresAt.getTime() <= Date.now()) return false;
    if (!this.passwordHashes.has(token.userId)) {
      for (const current of this.resetTokensByHash.values()) if (current.userId === token.userId && !current.consumedAt) current.consumedAt = new Date();
      return false;
    }
    const now = new Date();
    this.passwordHashes.set(token.userId, passwordHash);
    for (const current of this.resetTokensByHash.values()) if (current.userId === token.userId && !current.consumedAt) current.consumedAt = now;
    for (const session of this.sessionsByHash.values()) if (session.userId === token.userId && !session.revokedAt) session.revokedAt = now;
    return true;
  }

  async findGoogleIdentity(subject: string): Promise<{ userId: string } | undefined> {
    const userId = this.googleUserIdBySubject.get(subject);
    return userId ? { userId } : undefined;
  }

  async createGoogleAccount(user: IAuthUser, subject: string, _email: string, refresh: RefreshSessionInput): Promise<void> {
    this.usersById.set(user.id, { ...user });
    this.userIdByEmail.set(user.email.toLowerCase(), user.id);
    this.googleUserIdBySubject.set(subject, user.id);
    await this.createRefreshSession(user.id, refresh);
  }

  async linkGoogleIdentity(userId: string, subject: string, email: string): Promise<'linked' | 'already-linked' | 'identity-conflict' | 'email-conflict' | 'missing-user'> {
    if (!this.usersById.has(userId)) return 'missing-user';
    const existingUserId = this.googleUserIdBySubject.get(subject);
    if (existingUserId) return existingUserId === userId ? 'already-linked' : 'identity-conflict';
    const emailUserId = this.userIdByEmail.get(email.toLowerCase());
    if (emailUserId && emailUserId !== userId) return 'email-conflict';
    this.googleUserIdBySubject.set(subject, userId);
    return 'linked';
  }

  async addGoogleOnlyUser(email: string): Promise<IAuthUser> {
    const user: IAuthUser = { id: randomUUID(), email, name: null };
    this.usersById.set(user.id, user);
    this.userIdByEmail.set(email.toLowerCase(), user.id);
    this.googleUserIdBySubject.set(randomUUID(), user.id);
    return { ...user };
  }

  hasResetTokenHash(tokenHash: string): boolean { return this.resetTokensByHash.has(tokenHash); }
  resetTokenCount(userId: string): number { return [...this.resetTokensByHash.values()].filter((token) => token.userId === userId).length; }
  getResetTokenExpiry(tokenHash: string): Date | undefined { return this.resetTokensByHash.get(tokenHash)?.expiresAt; }
  activeSessionCount(userId: string): number {
    return [...this.sessionsByHash.values()].filter((session) => session.userId === userId && !session.revokedAt).length;
  }
}