import AIRepository from '../interfaces/ai-output-repo.interface.js';
import { Knex } from 'knex';

import { CreateAIOutputDTO, AIOutputDTO, UpdateAIOutputDTO } from '../dto/ai-repo.js';

export default class KnexAIOutputsRepository implements AIRepository {
  private readonly TABLE_NAME="recommendation_jobs";
  constructor (
    private readonly knexClient: Knex
  ) {}

  async create(data: CreateAIOutputDTO, trx?: Knex.Transaction): Promise<AIOutputDTO> {
    try {
      const [insertedRecord] = await (trx ?? this.knexClient)(this.TABLE_NAME)
        .insert(data)
        .returning('*');

      return insertedRecord as AIOutputDTO;
    } catch (error) {
      console.error('Error creating AI Output:', error);
      throw new Error('Could not create AI Output record in database.');
    }
  }

  async findById(id: string): Promise<AIOutputDTO | undefined> {
    return this.knexClient(this.TABLE_NAME).where({ id }).first() as Promise<AIOutputDTO | undefined>;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<AIOutputDTO | undefined> {
    return this.knexClient(this.TABLE_NAME).where({ id, user_id: userId }).first() as Promise<AIOutputDTO | undefined>;
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<AIOutputDTO | undefined> {
    return this.knexClient(this.TABLE_NAME).where({ user_id: userId, idempotency_key: idempotencyKey, feature_type: 'match_music' }).first() as Promise<AIOutputDTO | undefined>;
  }

  async updateIfStatus(id: string, statuses: AIOutputDTO['status'][], update: UpdateAIOutputDTO): Promise<boolean> {
    const count = await this.knexClient(this.TABLE_NAME).where({ id }).whereIn('status', statuses)
      .update({ ...update, updated_at: this.knexClient.fn.now() });
    return count === 1;
  }

  async findByUserId(user_id: string, limit: number, offset: number): Promise<AIOutputDTO[]> {
    try {
      const records = await this.knexClient(this.TABLE_NAME)
        .where({ user_id })
        .orderBy('created_at', 'desc') 
        .limit(limit)
        .offset(offset);

      return records as AIOutputDTO[];
    } catch (error) {
      console.error(`Error fetching AI Outputs for user:`, error);
      throw new Error('Could not fetch AI Output records from database.');
    }
  }
}
