import { randomUUID } from 'node:crypto';
import { Knex } from 'knex';
import { IAuthRepository, IAuthUser, RefreshSessionInput } from '../interfaces/auth.interface.js';
import { AuthMethodsDTO } from '../dto/auth.dto.js';

export default class AuthRepository implements IAuthRepository {
  constructor(private readonly db: Knex) {}

  async findAuthUserByEmail(email: string, executor: Knex | Knex.Transaction = this.db): Promise<IAuthUser | undefined> {
    const row = await executor('user_profiles')
      .where({ auth_enabled: true })
      .whereRaw('LOWER(email) = ?', [email])
      .first('id', 'email', 'display_name');
    return row as IAuthUser | undefined;
  }

  async findAuthUserById(userId: string, executor: Knex | Knex.Transaction = this.db): Promise<IAuthUser | undefined> {
    const row = await executor('user_profiles')
      .where({ id: userId, auth_enabled: true })
      .first('id', 'email', 'display_name');
    return row as IAuthUser | undefined;
  }

  async findPasswordHash(userId: string): Promise<string | undefined> {
    const row = await this.db('password_credentials').where({ user_id: userId }).first('password_hash');
    return row?.password_hash as string | undefined;
  }

  async getAuthMethods(userId: string): Promise<AuthMethodsDTO> {
    const [passwordCredential, googleIdentity] = await Promise.all([
      this.db('password_credentials').where({ user_id: userId }).first('user_id'),
      this.db('oauth_identities').where({ user_id: userId, provider: 'google' }).first('user_id'),
    ]);
    return { password: Boolean(passwordCredential), google: Boolean(googleIdentity) };
  }

  async createPasswordAccount(user: IAuthUser, passwordHash: string, refresh: RefreshSessionInput): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('user_profiles').insert({
        id: user.id,
        email: user.email,
        display_name: user.name,
        auth_enabled: true,
      });
      await trx('password_credentials').insert({ user_id: user.id, password_hash: passwordHash });
      await this.insertRefreshSession(trx, user.id, refresh);
    });
  }

  async createRefreshSession(userId: string, refresh: RefreshSessionInput): Promise<void> {
    await this.insertRefreshSession(this.db, userId, refresh);
  }

  private async insertRefreshSession(executor: Knex | Knex.Transaction, userId: string, refresh: RefreshSessionInput): Promise<void> {
    await executor('refresh_sessions').insert({
      id: refresh.id,
      user_id: userId,
      token_hash: refresh.tokenHash,
      expires_at: refresh.expiresAt,
    });
  }

  async rotateRefreshSession(tokenHash: string, replacement: RefreshSessionInput): Promise<{ kind: 'ok'; user: IAuthUser } | { kind: 'expired' }> {
    return this.db.transaction(async (trx) => {
      const session = await trx('refresh_sessions').where({ token_hash: tokenHash }).forUpdate().first();
      if (!session) return { kind: 'expired' as const };
      if (session.revoked_at) {
        await trx('refresh_sessions').where({ user_id: session.user_id }).whereNull('revoked_at').update({ revoked_at: new Date() });
        return { kind: 'expired' as const };
      }
      if (new Date(session.expires_at).getTime() <= Date.now()) return { kind: 'expired' as const };
      const user = await this.findAuthUserById(session.user_id as string, trx);
      if (!user) return { kind: 'expired' as const };
      await this.insertRefreshSession(trx, user.id, replacement);
      await trx('refresh_sessions').where({ id: session.id }).update({ revoked_at: new Date(), replaced_by: replacement.tokenHash });
      return { kind: 'ok' as const, user };
    });
  }

  async revokeRefreshSession(tokenHash: string): Promise<void> {
    await this.db('refresh_sessions').where({ token_hash: tokenHash }).whereNull('revoked_at').update({ revoked_at: new Date() });
  }

  async addPassword(userId: string, passwordHash: string): Promise<'added' | 'exists'> {
    return this.db.transaction(async (trx) => {
      const existing = await trx('password_credentials').where({ user_id: userId }).forUpdate().first('user_id');
      if (existing) return 'exists';
      await trx('password_credentials').insert({ user_id: userId, password_hash: passwordHash });
      return 'added';
    });
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.db.transaction(async (trx) => {
      const user = await trx('user_profiles').where({ id: userId }).forUpdate().first('id');
      if (!user) return;
      await trx('password_reset_tokens').where({ user_id: userId }).whereNull('consumed_at').update({ consumed_at: new Date() });
      await trx('password_reset_tokens').insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
    });
  }

  async resetPassword(tokenHash: string, passwordHash: string): Promise<boolean> {
    return this.db.transaction(async (trx) => {
      const resetToken = await trx('password_reset_tokens').where({ token_hash: tokenHash }).whereNull('consumed_at').forUpdate().first();
      if (!resetToken || new Date(resetToken.expires_at).getTime() <= Date.now()) return false;

      const credential = await trx('password_credentials').where({ user_id: resetToken.user_id }).forUpdate().first('user_id');
      if (!credential) {
        await trx('password_reset_tokens').where({ user_id: resetToken.user_id }).whereNull('consumed_at').update({ consumed_at: new Date() });
        return false;
      }

      const now = new Date();
      await trx('password_credentials').where({ user_id: resetToken.user_id }).update({ password_hash: passwordHash, updated_at: now });
      await trx('password_reset_tokens').where({ user_id: resetToken.user_id }).whereNull('consumed_at').update({ consumed_at: now });
      await trx('refresh_sessions').where({ user_id: resetToken.user_id }).whereNull('revoked_at').update({ revoked_at: now });
      return true;
    });
  }

  async findGoogleIdentity(subject: string): Promise<{ userId: string } | undefined> {
    const identity = await this.db('oauth_identities').where({ provider: 'google', provider_subject: subject }).first('user_id');
    return identity ? { userId: identity.user_id as string } : undefined;
  }

  async createGoogleAccount(user: IAuthUser, subject: string, email: string, refresh: RefreshSessionInput): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('user_profiles').insert({
        id: user.id,
        email: user.email,
        display_name: user.name,
        auth_enabled: true,
      });
      await trx('oauth_identities').insert({
        id: randomUUID(), user_id: user.id, provider: 'google', provider_subject: subject, provider_email: email,
      });
      await this.insertRefreshSession(trx, user.id, refresh);
    });
  }

  async linkGoogleIdentity(userId: string, subject: string, email: string): Promise<'linked' | 'already-linked' | 'identity-conflict' | 'email-conflict' | 'missing-user'> {
    try {
      return await this.db.transaction(async (trx) => {
        const user = await this.findAuthUserById(userId, trx);
        if (!user) return 'missing-user';
        const linked = await trx('oauth_identities').where({ provider: 'google', provider_subject: subject }).forUpdate().first('user_id');
        if (linked) return linked.user_id === userId ? 'already-linked' : 'identity-conflict';
        const emailOwner = await this.findAuthUserByEmail(email, trx);
        if (emailOwner && emailOwner.id !== userId) return 'email-conflict';
        await trx('oauth_identities').insert({
          id: randomUUID(), user_id: userId, provider: 'google', provider_subject: subject, provider_email: email,
        });
        return 'linked';
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return 'identity-conflict';
      throw error;
    }
  }
}
