import { AIOutputDTO, CreateAIOutputDTO, UpdateAIOutputDTO } from '../dto/ai-repo.js';
import { Knex } from 'knex';

export default interface AIRepository {
  create(data: CreateAIOutputDTO, trx?: Knex.Transaction): Promise<AIOutputDTO>;
  findByUserId(user_id: string, limit: number, offset: number): Promise<AIOutputDTO[]>;
  findById(id: string): Promise<AIOutputDTO | undefined>;
  findByIdAndUserId(id: string, userId: string): Promise<AIOutputDTO | undefined>;
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<AIOutputDTO | undefined>;
  updateIfStatus(id: string, statuses: AIOutputDTO['status'][], update: UpdateAIOutputDTO): Promise<boolean>;
}
